import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { FinishedProductInspection, InspectionStatus } from '@/types/quality';
import { formatDateTime, getInspectionStatusText } from '@/utils/format';
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

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return finishedInspectionList;
    return finishedInspectionList.filter(item => item.conclusion === activeFilter);
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

  const getQualifiedCount = (items: { isQualified: boolean }[]) => {
    return items.filter(i => i.isQualified).length;
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
            const qualified = getQualifiedCount(item.items);
            const total = item.items.length;
            const isAllPass = qualified === total;
            return (
              <View
                key={item.id}
                className={styles.card}
                onClick={() => handleCardClick(item)}
              >
                <View className={styles.cardHeader}>
                  <Text className={styles.title}>{item.productName}</Text>
                  <StatusTag
                    text={getInspectionStatusText(item.conclusion)}
                    type={getStatusType(item.conclusion)}
                  />
                </View>

                <Text className={styles.cardSubtitle}>批次号：{item.batchNo}</Text>

                <View className={styles.sampleInfo}>
                  <View className={styles.item}>
                    <Text className={styles.num}>{item.sampleCount}</Text>
                    <Text className={styles.label}>抽检数量</Text>
                  </View>
                  <View className={classnames(styles.item, isAllPass ? styles.success : styles.error)}>
                    <Text className={styles.num}>{qualified}/{total}</Text>
                    <Text className={styles.label}>合格项数</Text>
                  </View>
                </View>

                <View className={styles.cardFooter}>
                  <Text>🔬 检验：{item.inspector}</Text>
                  <Text>{formatDateTime(item.inspectionTime, 'MM-DD HH:mm')}</Text>
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
