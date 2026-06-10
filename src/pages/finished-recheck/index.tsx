import React, { useState, useMemo, useRef } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { FinishedProductInspection, InspectionStatus } from '@/types/quality';
import { formatDateTime, getInspectionStatusText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';

interface RecheckItemForm {
  index: number;
  name: string;
  standard: string;
  originalResult: string;
  originalQualified: boolean;
  recheckResult: string;
  rechecker: string;
}

const getItemFinalQualified = (item: FinishedProductInspection['items'][number]): boolean => {
  if (typeof item.isRecheckQualified === 'boolean') return item.isRecheckQualified;
  return item.isQualified;
};

const FinishedRecheckPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || '';
  const { finishedInspectionList, updateFinishedInspection } = useQualityStore();
  const loaded = useRef(false);

  const [record, setRecord] = useState<FinishedProductInspection | null>(null);
  const [recheckItems, setRecheckItems] = useState<RecheckItemForm[]>([]);
  const [rechecker, setRechecker] = useState('李质检');

  useDidShow(() => {
    if (loaded.current) return;
    loaded.current = true;
    const found = finishedInspectionList.find(f => f.id === id);
    if (!found) {
      Taro.showToast({ title: '记录不存在', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 1000);
      return;
    }
    setRecord(found);
    const needRecheck: RecheckItemForm[] = [];
    found.items.forEach((it, idx) => {
      const finalOk = getItemFinalQualified(it);
      if (!finalOk || !it.result || it.result === '—') {
        needRecheck.push({
          index: idx,
          name: it.name,
          standard: it.standard,
          originalResult: it.result,
          originalQualified: it.isQualified,
          recheckResult: it.recheckResult || '',
          rechecker: it.rechecker || '李质检'
        });
      }
    });
    setRecheckItems(needRecheck);
  });

  const judgeResult = (standard: string, result: string): 'qualified' | 'unqualified' | 'pending' => {
    if (!result) return 'pending';
    if (!standard) return 'qualified';
    const resultNum = parseFloat(result);
    if (isNaN(resultNum)) return 'qualified';
    const standardMatch = standard.match(/([\d.]+)/);
    if (!standardMatch) return 'qualified';
    const stdNum = parseFloat(standardMatch[1]);
    if (standard.includes('≤') || standard.includes('<=')) {
      return resultNum <= stdNum ? 'qualified' : 'unqualified';
    } else if (standard.includes('≥') || standard.includes('>=')) {
      return resultNum >= stdNum ? 'qualified' : 'unqualified';
    } else if (standard.includes('±')) {
      const toleranceMatch = standard.match(/±\s*([\d.]+)/);
      if (toleranceMatch) {
        const tolerance = parseFloat(toleranceMatch[1]);
        return Math.abs(resultNum - stdNum) <= tolerance ? 'qualified' : 'unqualified';
      }
      return 'qualified';
    }
    return 'qualified';
  };

  const handleItemChange = (formIdx: number, value: string) => {
    setRecheckItems(prev => {
      const updated = [...prev];
      updated[formIdx] = { ...updated[formIdx], recheckResult: value };
      return updated;
    });
  };

  const handleItemRecheckerChange = (formIdx: number, value: string) => {
    setRecheckItems(prev => {
      const updated = [...prev];
      updated[formIdx] = { ...updated[formIdx], rechecker: value };
      return updated;
    });
  };

  const stats = useMemo(() => {
    let filled = 0;
    let pass = 0;
    recheckItems.forEach(it => {
      if (it.recheckResult) {
        filled++;
        const r = judgeResult(it.standard, it.recheckResult);
        if (r === 'qualified') pass++;
      }
    });
    return { total: recheckItems.length, filled, pass };
  }, [recheckItems]);

  const handleSubmit = () => {
    if (!record) return;
    if (stats.filled === 0) {
      Taro.showToast({ title: '请至少填写一项复检结果', icon: 'none' });
      return;
    }

    const now = new Date().toISOString();
    const newItems = [...record.items];
    let recheckPassCount = 0;

    recheckItems.forEach(form => {
      if (!form.recheckResult) return;
      const judge = judgeResult(form.standard, form.recheckResult);
      const isOk = judge === 'qualified';
      if (isOk) recheckPassCount++;
      newItems[form.index] = {
        ...newItems[form.index],
        recheckResult: form.recheckResult,
        recheckTime: now,
        rechecker: form.rechecker || rechecker,
        isRecheckQualified: isOk
      };
    });

    const originalQualifiedCount = newItems.filter(i => i.isQualified).length;
    const totalRecheckPass = newItems.filter(getItemFinalQualified).length;
    const allPass = totalRecheckPass === newItems.length;
    const anyFail = newItems.some(i => !getItemFinalQualified(i) && (i.result || i.recheckResult));
    const anyPending = newItems.some(i => {
      const finalOk = getItemFinalQualified(i);
      if (finalOk) return false;
      if (i.recheckResult) return false;
      return !i.result || i.result === '—';
    });

    let newConclusion: InspectionStatus = record.conclusion;
    if (allPass) {
      newConclusion = 'qualified';
    } else if (anyFail) {
      newConclusion = 'unqualified';
    } else if (anyPending) {
      newConclusion = 'pending';
    }

    updateFinishedInspection(record.id, {
      items: newItems,
      conclusion: newConclusion
    });

    Taro.showToast({
      title: `复检完成，合格 ${recheckPassCount} 项`,
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  if (!record) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>加载中...</View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.form}>
          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <Text>抽检基础信息</Text>
              <StatusTag
                text={getInspectionStatusText(record.conclusion)}
                type={record.conclusion === 'qualified' ? 'success' : record.conclusion === 'unqualified' ? 'error' : 'warning'}
              />
            </View>
            <View className={styles.basicInfo}>
              <View className={styles.infoRow}>
                <Text className={styles.label}>产品名称</Text>
                <Text className={styles.value}>{record.productName}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>批次号</Text>
                <Text className={styles.value}>{record.batchNo}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>原检验员</Text>
                <Text className={styles.value}>{record.inspector}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>检验时间</Text>
                <Text className={styles.value}>{formatDateTime(record.inspectionTime)}</Text>
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <Text>待复检指标（{stats.filled}/{stats.total} 已填，{stats.pass} 项合格）</Text>
            </View>
            {recheckItems.length === 0 ? (
              <View className={styles.emptyState}>所有指标均已合格，无需复检</View>
            ) : (
              recheckItems.map((item, formIdx) => {
                const preview = judgeResult(item.standard, item.recheckResult);
                return (
                  <View
                    key={formIdx}
                    className={classnames(styles.itemCard, item.recheckResult && preview === 'qualified' && styles.rechecked)}
                  >
                    <View className={styles.itemHeader}>
                      <Text className={styles.itemName}>{item.name}</Text>
                      {item.recheckResult && (
                        <Text className={classnames(styles.previewTag, preview)}>
                          {preview === 'qualified' ? '✓ 复检合格' : preview === 'unqualified' ? '✗ 复检不合格' : '待判定'}
                        </Text>
                      )}
                    </View>
                    <View className={styles.itemMeta}>
                      <Text>标准：{item.standard || '—'}</Text>
                    </View>
                    <View className={styles.originalResult}>
                      <Text className={styles.label}>原检测值：</Text>
                      <Text className={styles.value}>
                        {item.originalResult || '未填写'}
                        {item.originalQualified ? '（合格）' : '（不合格）'}
                      </Text>
                    </View>
                    <Text className={styles.fieldLabel}>复检检测值</Text>
                    <Input
                      className={styles.fieldInput}
                      placeholder="请输入复检检测值"
                      value={item.recheckResult}
                      onInput={(e) => handleItemChange(formIdx, e.detail.value)}
                    />
                    <View className={styles.recheckerRow}>
                      <Text className={styles.label}>复检人：</Text>
                      <Input
                        className={styles.input}
                        placeholder="请输入复检人"
                        value={item.rechecker}
                        onInput={(e) => handleItemRecheckerChange(formIdx, e.detail.value)}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <Button className={styles.cancelBtn} onClick={() => Taro.navigateBack()}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>保存复检结果</Button>
      </View>
    </View>
  );
};

export default FinishedRecheckPage;
