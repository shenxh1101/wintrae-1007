import React, { useState } from 'react';
import { View, Text, Input, Button, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { InspectionStatus } from '@/types/quality';

interface ParamItem {
  name: string;
  value: string;
  unit: string;
  standard: string;
}

const ProcessAddPage: React.FC = () => {
  const router = useRouter();
  const { addProcessInspection } = useQualityStore();

  const [form, setForm] = useState({
    batchNo: router.params.batchNo || '',
    processName: '',
    processIndex: 1,
    operator: '',
    inspector: '张质检',
    conclusion: 'qualified' as InspectionStatus,
    remark: ''
  });

  const [params, setParams] = useState<ParamItem[]>([
    { name: '温度', value: '', unit: '℃', standard: '' },
    { name: '时间', value: '', unit: 'min', standard: '' }
  ]);

  const handleInput = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleParamChange = (index: number, field: keyof ParamItem, value: string) => {
    setParams(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddParam = () => {
    if (params.length >= 8) {
      Taro.showToast({ title: '最多添加8个参数', icon: 'none' });
      return;
    }
    setParams(prev => [...prev, { name: '', value: '', unit: '', standard: '' }]);
  };

  const handleRemoveParam = (index: number) => {
    if (params.length <= 1) {
      Taro.showToast({ title: '至少保留1个参数', icon: 'none' });
      return;
    }
    setParams(prev => prev.filter((_, i) => i !== index));
  };

  const handleConclusionChange = (conclusion: InspectionStatus) => {
    setForm(prev => ({ ...prev, conclusion }));
  };

  const checkParamQualified = (param: ParamItem): boolean => {
    if (!param.value || !param.standard) return true;
    return true;
  };

  const handleSubmit = () => {
    if (!form.processName.trim()) {
      Taro.showToast({ title: '请输入工序名称', icon: 'none' });
      return;
    }
    if (!form.batchNo.trim()) {
      Taro.showToast({ title: '请输入批次号', icon: 'none' });
      return;
    }
    if (!form.operator.trim()) {
      Taro.showToast({ title: '请输入操作人员', icon: 'none' });
      return;
    }

    const validParams = params.filter(p => p.name.trim());
    if (validParams.length === 0) {
      Taro.showToast({ title: '请至少填写一个参数', icon: 'none' });
      return;
    }

    const processIndexNum = parseInt(String(form.processIndex)) || 1;

    addProcessInspection({
      batchNo: form.batchNo.trim(),
      processName: form.processName.trim(),
      processIndex: processIndexNum,
      operator: form.operator.trim(),
      inspector: form.inspector,
      conclusion: form.conclusion,
      remark: form.remark,
      parameters: validParams.map(p => ({
        name: p.name.trim(),
        value: p.value,
        unit: p.unit,
        standard: p.standard || '—',
        isQualified: checkParamQualified(p)
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

  const conclusionOptions = [
    { key: 'qualified' as InspectionStatus, label: '合格', className: 'qualified' },
    { key: 'unqualified' as InspectionStatus, label: '不合格', className: 'unqualified' },
    { key: 'recheck' as InspectionStatus, label: '待复检', className: 'recheck' }
  ];

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.form}>
          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>基础信息</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>工序名称
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入工序名称"
                  value={form.processName}
                  onInput={(e) => handleInput('processName', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>工序序号</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  type="number"
                  placeholder="如：1"
                  value={String(form.processIndex)}
                  onInput={(e) => handleInput('processIndex', e.detail.value)}
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
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <Text>关键参数</Text>
              <Text className={styles.addBtn} onClick={handleAddParam}>+ 添加参数</Text>
            </View>

            <View className={styles.paramList}>
              {params.map((param, index) => (
                <View key={index} className={styles.paramItem}>
                  <View className={styles.paramHeader}>
                    <Input
                      className={styles.paramNameInput}
                      placeholder="参数名称"
                      value={param.name}
                      onInput={(e) => handleParamChange(index, 'name', e.detail.value)}
                    />
                    <Text className={styles.removeBtn} onClick={() => handleRemoveParam(index)}>删除</Text>
                  </View>
                  <View className={styles.paramRow}>
                    <View className={styles.paramField}>
                      <Text className={styles.fieldLabel}>检测值</Text>
                      <Input
                        className={styles.fieldInput}
                        placeholder="值"
                        value={param.value}
                        onInput={(e) => handleParamChange(index, 'value', e.detail.value)}
                      />
                    </View>
                    <View className={styles.paramField}>
                      <Text className={styles.fieldLabel}>单位</Text>
                      <Input
                        className={styles.fieldInput}
                        placeholder="单位"
                        value={param.unit}
                        onInput={(e) => handleParamChange(index, 'unit', e.detail.value)}
                      />
                    </View>
                  </View>
                  <View className={styles.paramRow}>
                    <View className={styles.paramField}>
                      <Text className={styles.fieldLabel}>标准值</Text>
                      <Input
                        className={styles.fieldInput}
                        placeholder="标准范围"
                        value={param.standard}
                        onInput={(e) => handleParamChange(index, 'standard', e.detail.value)}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>人员信息</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>操作人员
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入操作人员姓名"
                  value={form.operator}
                  onInput={(e) => handleInput('operator', e.detail.value)}
                />
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
            <View className={styles.sectionTitle}>检验结论</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>结论</Text>
              <View className={styles.conclusionRow}>
                {conclusionOptions.map(opt => (
                  <View
                    key={opt.key}
                    className={classnames(
                      styles.conclusionOption,
                      form.conclusion === opt.key && styles.active,
                      form.conclusion === opt.key && styles[opt.className]
                    )}
                    onClick={() => handleConclusionChange(opt.key)}
                  >
                    {opt.label}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text className={styles.label} style={{ marginBottom: 12 }}>备注说明</Text>
              <Textarea
                className={styles.textarea}
                placeholder="请输入检验备注说明..."
                value={form.remark}
                onInput={(e) => handleInput('remark', e.detail.value)}
                maxlength={500}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>提交检查</Button>
      </View>
    </View>
  );
};

export default ProcessAddPage;
