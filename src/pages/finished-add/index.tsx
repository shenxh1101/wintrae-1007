import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { InspectionStatus } from '@/types/quality';

interface InspectionItemForm {
  name: string;
  standard: string;
  result: string;
  unit: string;
  method: string;
}

const FinishedAddPage: React.FC = () => {
  const router = useRouter();
  const { addFinishedInspection } = useQualityStore();

  const [form, setForm] = useState({
    batchNo: router.params.batchNo || '',
    productName: '',
    productSpec: '',
    sampleCount: '',
    inspector: '张质检',
    remark: ''
  });

  const [items, setItems] = useState<InspectionItemForm[]>([
    { name: '外观', standard: '无破损、无变形', result: '', unit: '', method: '目视' },
    { name: '重量', standard: '500±10', result: '', unit: 'g', method: '电子秤' },
    { name: '菌落总数', standard: '≤10000', result: '', unit: 'cfu/g', method: '培养法' }
  ]);

  const stats = useMemo(() => {
    let total = 0;
    let qualified = 0;
    let unqualified = 0;
    let pending = 0;
    items.forEach(item => {
      if (!item.name.trim()) return;
      total++;
      if (!item.result) {
        pending++;
        return;
      }
      const itemResult = getItemResult(item);
      if (itemResult === 'qualified') {
        qualified++;
      } else if (itemResult === 'unqualified') {
        unqualified++;
      } else {
        pending++;
      }
    });
    return { total, qualified, unqualified, pending };
  }, [items]);

  const autoConclusion = useMemo((): InspectionStatus => {
    if (stats.unqualified > 0) return 'unqualified';
    if (stats.pending > 0) return 'pending';
    if (stats.total > 0 && stats.qualified === stats.total) return 'qualified';
    return 'pending';
  }, [stats]);

  const handleInput = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof InspectionItemForm, value: string) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddItem = () => {
    if (items.length >= 12) {
      Taro.showToast({ title: '最多添加12个指标', icon: 'none' });
      return;
    }
    setItems(prev => [...prev, { name: '', standard: '', result: '', unit: '', method: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      Taro.showToast({ title: '至少保留1个指标', icon: 'none' });
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const getItemResult = (item: InspectionItemForm): 'qualified' | 'unqualified' | 'pending' => {
    if (!item.result) return 'pending';
    if (!item.standard) return 'qualified';
    const resultNum = parseFloat(item.result);
    if (isNaN(resultNum)) return 'qualified';
    const standardMatch = item.standard.match(/([\d.]+)/);
    if (!standardMatch) return 'qualified';
    const stdNum = parseFloat(standardMatch[1]);
    if (item.standard.includes('≤') || item.standard.includes('<=')) {
      return resultNum <= stdNum ? 'qualified' : 'unqualified';
    } else if (item.standard.includes('≥') || item.standard.includes('>=')) {
      return resultNum >= stdNum ? 'qualified' : 'unqualified';
    } else if (item.standard.includes('±')) {
      const toleranceMatch = item.standard.match(/±\s*([\d.]+)/);
      if (toleranceMatch) {
        const tolerance = parseFloat(toleranceMatch[1]);
        return Math.abs(resultNum - stdNum) <= tolerance ? 'qualified' : 'unqualified';
      }
      return 'qualified';
    }
    return 'qualified';
  };

  const handleSubmit = () => {
    if (!form.productName.trim()) {
      Taro.showToast({ title: '请输入产品名称', icon: 'none' });
      return;
    }
    if (!form.batchNo.trim()) {
      Taro.showToast({ title: '请输入批次号', icon: 'none' });
      return;
    }

    const validItems = items.filter(i => i.name.trim());
    if (validItems.length === 0) {
      Taro.showToast({ title: '请至少填写一个指标', icon: 'none' });
      return;
    }

    const sampleNum = parseInt(form.sampleCount) || 0;

    addFinishedInspection({
      batchNo: form.batchNo.trim(),
      productName: form.productName.trim(),
      productSpec: form.productSpec.trim() || '标准规格',
      sampleCount: sampleNum,
      inspector: form.inspector,
      conclusion: autoConclusion,
      remark: form.remark,
      items: validItems.map(item => ({
        name: item.name.trim(),
        standard: item.standard || '—',
        result: item.result || '—',
        unit: item.unit,
        method: item.method || '—',
        isQualified: getItemResult(item) === 'qualified'
      }))
    });

    Taro.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.form}>
          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>基础信息</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>产品名称
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入产品名称"
                  value={form.productName}
                  onInput={(e) => handleInput('productName', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>规格型号</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="如：500g/盒"
                  value={form.productSpec}
                  onInput={(e) => handleInput('productSpec', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>批次号
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入批次号"
                  value={form.batchNo}
                  onInput={(e) => handleInput('batchNo', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>抽检数量</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  type="number"
                  placeholder="请输入抽检数量"
                  value={form.sampleCount}
                  onInput={(e) => handleInput('sampleCount', e.detail.value)}
                />
                <Text className={styles.unit}>件</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>检验员</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入检验员姓名"
                  value={form.inspector}
                  onInput={(e) => handleInput('inspector', e.detail.value)}
                />
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <Text>检验指标</Text>
              <Text className={styles.addBtn} onClick={handleAddItem}>+ 添加指标</Text>
            </View>

            <View className={styles.itemList}>
              {items.map((item, index) => {
                const result = getItemResult(item);
                return (
                  <View key={index} className={styles.itemRow}>
                    <View className={styles.itemHeader}>
                      <Input
                        className={styles.itemNameInput}
                        placeholder="指标名称"
                        value={item.name}
                        onInput={(e) => handleItemChange(index, 'name', e.detail.value)}
                      />
                      <Text className={styles.removeBtn} onClick={() => handleRemoveItem(index)}>删除</Text>
                    </View>
                    <View className={styles.itemRowFields}>
                      <View className={styles.field}>
                        <Text className={styles.fieldLabel}>标准值</Text>
                        <Input
                          className={styles.fieldInput}
                          placeholder="标准"
                          value={item.standard}
                          onInput={(e) => handleItemChange(index, 'standard', e.detail.value)}
                        />
                      </View>
                      <View className={styles.field}>
                        <Text className={styles.fieldLabel}>检测值</Text>
                        <Input
                          className={styles.fieldInput}
                          placeholder="结果"
                          value={item.result}
                          onInput={(e) => handleItemChange(index, 'result', e.detail.value)}
                        />
                      </View>
                      <View className={styles.field}>
                        <Text className={styles.fieldLabel}>单位</Text>
                        <Input
                          className={styles.fieldInput}
                          placeholder="单位"
                          value={item.unit}
                          onInput={(e) => handleItemChange(index, 'unit', e.detail.value)}
                        />
                      </View>
                    </View>
                    <View className={styles.itemRowFields}>
                      <View className={styles.field}>
                        <Text className={styles.fieldLabel}>检测方法</Text>
                        <Input
                          className={styles.fieldInput}
                          placeholder="方法"
                          value={item.method}
                          onInput={(e) => handleItemChange(index, 'method', e.detail.value)}
                        />
                      </View>
                    </View>
                    {item.name && (
                      <View className={classnames(styles.resultTag, styles[result])}>
                        {result === 'pending' ? '未填写结果' : result === 'qualified' ? '✓ 合格' : '✗ 不合格'}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View className={styles.summarySection}>
            <View className={styles.summaryItem}>
              <Text className={styles.num}>{stats.total}</Text>
              <Text className={styles.label}>总指标数</Text>
            </View>
            <View className={classnames(styles.summaryItem, styles.success)}>
              <Text className={styles.num}>{stats.qualified}</Text>
              <Text className={styles.label}>合格</Text>
            </View>
            <View className={classnames(styles.summaryItem, styles.error)}>
              <Text className={styles.num}>{stats.unqualified}</Text>
              <Text className={styles.label}>不合格</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          {autoConclusion === 'unqualified' ? '提交（判定不合格）' : '提交检验'}
        </Button>
      </View>
    </View>
  );
};

export default FinishedAddPage;
