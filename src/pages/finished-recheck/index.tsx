import React, { useState, useMemo, useRef } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { FinishedProductInspection, InspectionStatus } from '@/types/quality';
import {
  formatDateTime,
  getInspectionStatusText,
  judgeInspectionItem,
  computeInspectionConclusion,
  getItemFinalQualified,
  type JudgeResult
} from '@/utils/format';
import StatusTag from '@/components/StatusTag';

interface RecheckItemForm {
  index: number;
  name: string;
  standard: string;
  originalResult: string;
  originalJudge: JudgeResult;
  recheckResult: string;
  rechecker: string;
  manualOverride?: boolean;
  manualResult?: 'qualified' | 'unqualified' | '';
}

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
      const originalJudge = judgeInspectionItem(it.standard, it.result);
      if (!finalOk || originalJudge === 'pending' || originalJudge === 'uncertain') {
        needRecheck.push({
          index: idx,
          name: it.name,
          standard: it.standard,
          originalResult: it.result,
          originalJudge,
          recheckResult: it.recheckResult || '',
          rechecker: it.rechecker || '李质检',
          manualOverride: false,
          manualResult: ''
        });
      }
    });
    setRecheckItems(needRecheck);
  });

  const getItemDisplayJudge = (form: RecheckItemForm): JudgeResult => {
    if (!form.recheckResult) return 'pending';
    if (form.manualOverride && form.manualResult) {
      return form.manualResult;
    }
    return judgeInspectionItem(form.standard, form.recheckResult);
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

  const handleToggleManual = (formIdx: number) => {
    setRecheckItems(prev => {
      const updated = [...prev];
      const cur = updated[formIdx];
      updated[formIdx] = {
        ...cur,
        manualOverride: !cur.manualOverride,
        manualResult: !cur.manualOverride ? 'qualified' : ''
      };
      return updated;
    });
  };

  const handleManualResultChange = (formIdx: number, result: 'qualified' | 'unqualified') => {
    setRecheckItems(prev => {
      const updated = [...prev];
      updated[formIdx] = { ...updated[formIdx], manualResult: result };
      return updated;
    });
  };

  const stats = useMemo(() => {
    let filled = 0;
    let pass = 0;
    let uncertain = 0;
    recheckItems.forEach(form => {
      if (!form.recheckResult) return;
      filled++;
      const r = getItemDisplayJudge(form);
      if (r === 'qualified') pass++;
      else if (r === 'uncertain') uncertain++;
    });
    return { total: recheckItems.length, filled, pass, uncertain };
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
      const judge = getItemDisplayJudge(form);
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

    const newConclusion = computeInspectionConclusion(newItems);

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

  const judgeText = (j: JudgeResult): string => {
    if (j === 'qualified') return '✓ 合格';
    if (j === 'unqualified') return '✗ 不合格';
    if (j === 'pending') return '⏳ 待检测';
    return '❔ 待判定';
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
                const preview = getItemDisplayJudge(item);
                const autoJudge = judgeInspectionItem(item.standard, item.recheckResult);
                const isUncertain = autoJudge === 'uncertain';
                return (
                  <View
                    key={formIdx}
                    className={classnames(
                      styles.itemCard,
                      item.recheckResult && preview === 'qualified' && styles.rechecked,
                      item.manualOverride && styles.manualMode
                    )}
                  >
                    <View className={styles.itemHeader}>
                      <Text className={styles.itemName}>{item.name}</Text>
                      {item.recheckResult && (
                        <Text className={classnames(styles.previewTag, preview)}>
                          {item.manualOverride ? '（手动）' : ''}{judgeText(preview)}
                        </Text>
                      )}
                    </View>
                    <View className={styles.itemMeta}>
                      <Text>标准：{item.standard || '—'}</Text>
                    </View>
                    <View className={styles.originalResult}>
                      <Text className={styles.label}>初检：</Text>
                      <Text className={classnames(styles.value, item.originalJudge)}>
                        {item.originalResult || '未填写'} · {judgeText(item.originalJudge)}
                      </Text>
                    </View>
                    <Text className={styles.fieldLabel}>复检检测值</Text>
                    <Input
                      className={styles.fieldInput}
                      placeholder="请输入复检检测值"
                      value={item.recheckResult}
                      onInput={(e) => handleItemChange(formIdx, e.detail.value)}
                    />
                    {isUncertain && item.recheckResult && (
                      <View className={styles.uncertainTip}>
                        <Text className={styles.tipIcon}>💡</Text>
                        <Text className={styles.tipText}>文字类指标系统无法自动判定，建议手动选择结果</Text>
                      </View>
                    )}
                    <View className={styles.manualRow}>
                      <Text
                        className={classnames(styles.manualToggle, item.manualOverride && styles.active)}
                        onClick={() => handleToggleManual(formIdx)}
                      >
                        {item.manualOverride ? '✓ 已开启手动判定' : '⚙ 手动判定'}
                      </Text>
                    </View>
                    {item.manualOverride && (
                      <View className={styles.manualOptions}>
                        <View
                          className={classnames(
                            styles.manualOption,
                            item.manualResult === 'qualified' && styles.active,
                            styles.optPass
                          )}
                          onClick={() => handleManualResultChange(formIdx, 'qualified')}
                        >
                          <Text>✓ 判定合格</Text>
                        </View>
                        <View
                          className={classnames(
                            styles.manualOption,
                            item.manualResult === 'unqualified' && styles.active,
                            styles.optFail
                          )}
                          onClick={() => handleManualResultChange(formIdx, 'unqualified')}
                        >
                          <Text>✗ 判定不合格</Text>
                        </View>
                      </View>
                    )}
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
