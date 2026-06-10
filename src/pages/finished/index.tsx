import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { FinishedProductInspection, InspectionStatus } from '@/types/quality';
import {
  formatDateTime,
  getInspectionStatusText,
  computeInspectionConclusion,
  getItemFinalQualified
} from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type FilterType = 'all' | InspectionStatus;

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待检验' },
  { key: 'qualified', label: '合格' },
  { key: 'unqualified', label: '不合格' }
];

const FinishedPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { finishedInspectionList } = useQualityStore();

  useDidShow(() => {
  });

  const computeStats = (inspection: FinishedProductInspection) => {
    let qualified = 0;
    const total = inspection.items.length;
    let hasRecheck = false;
    let pendingOrUncertain = 0;
    inspection.items.forEach(it => {
      if (it.recheckResult) hasRecheck = true;
      if (getItemFinalQualified(it)) {
        qualified++;
      } else {
        const finalResult = it.recheckResult || it.result || '';
        if (!finalResult || /^[—\-–_·\.。]+$/.test(finalResult) || /^(未检|待检|待检测|未填写|未填|无结果|暂无)$/i.test(finalResult)) {
          pendingOrUncertain++;
        }
      }
    });
    return { qualified, total, allPass: qualified === total, hasRecheck, pendingOrUncertain };
  };

  const computeConclusion = (inspection: FinishedProductInspection): InspectionStatus => {
    return computeInspectionConclusion(inspection.items);
  };

  const filteredList = useMemo(() => {
    const list = finishedInspectionList.map(it => ({ ...it, _conclusion: computeConclusion(it) }));
    if (activeFilter === 'all') return list;
    return list.filter(item => item._conclusion === activeFilter);
  }, [finishedInspectionList, activeFilter]);

  const getStatusType = (status: InspectionStatus): 'success' | 'warning' | 'error' | 'info' | 'gray' => {
    const map: Record<InspectionStatus, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
      pending: 'warning',
      qualified: 'success',
      unqualified: 'error',
      recheck: 'info'
    };
    return map[status];
  };

  const handleAdd = () => {
    Taro.navigateTo({
      url: '/pages/finished-add/index'
    });
  };

  const handleCardClick = (item: FinishedProductInspection) => {
    console.log('[Finished] 查看成品抽检:', item.id);
    Taro.navigateTo({
      url: `/pages/trace/index?batchNo=${item.batchNo}`
    });
  };

  const handleRecheck = (item: FinishedProductInspection, e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/finished-recheck/index?id=${item.id}`
    });
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.filterBar}>
        <View className={styles.filterTabs}>
          {filters.map(filter => (
            <View
              key={filter.key}
              className={classnames(styles.tabItem, activeFilter === filter.key && styles.active)}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView scrollY className={styles.listContainer}>
        {filteredList.length > 0 ? (
          filteredList.map(item => {
            const { qualified, total, allPass, hasRecheck } = computeStats(item);
            const conclusion = computeConclusion(item);
            const needRecheck = !allPass;
            return (
              <View
                key={item.id}
                className={styles.card}
                onClick={() => handleCardClick(item)}
              >
                <View className={styles.cardHeader}>
                  <Text className={styles.title}>{item.productName}</Text>
                  <StatusTag
                    text={getInspectionStatusText(conclusion)}
                    type={getStatusType(conclusion)}
                  />
                </View>

                <Text className={styles.cardSubtitle}>批次号：{item.batchNo}</Text>

                <View className={styles.sampleInfo}>
                  <View className={styles.item}>
                    <Text className={styles.num}>{item.sampleCount}</Text>
                    <Text className={styles.label}>抽检数量</Text>
                  </View>
                  <View className={classnames(styles.item, allPass ? styles.success : styles.error)}>
                    <Text className={styles.num}>{qualified}/{total}</Text>
                    <Text className={styles.label}>合格项数{hasRecheck ? '（含复检）' : ''}</Text>
                  </View>
                </View>

                <View className={styles.cardFooter}>
                  <Text>🔬 检验：{item.inspector}</Text>
                  <View style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Text>{formatDateTime(item.inspectionTime, 'MM-DD HH:mm')}</Text>
                    {needRecheck && (
                      <Button className={styles.recheckBtn} onClick={(e) => handleRecheck(item, e)}>
                        去复检
                      </Button>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState text="暂无成品抽检记录" icon="✅" />
        )}
      </ScrollView>

      <Button className={styles.fab} onClick={handleAdd}>+</Button>
    </View>
  );
};

export default FinishedPage;
