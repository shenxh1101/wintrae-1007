import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { RawMaterialAcceptance, InspectionStatus } from '@/types/quality';
import { formatDateTime, getInspectionStatusText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type FilterType = 'all' | InspectionStatus;

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待检验' },
  { key: 'qualified', label: '合格' },
  { key: 'unqualified', label: '不合格' },
  { key: 'recheck', label: '待复检' }
];

const AcceptancePage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { acceptanceList } = useQualityStore();

  useDidShow(() => {
  });

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return acceptanceList;
    return acceptanceList.filter(item => item.conclusion === activeFilter);
  }, [acceptanceList, activeFilter]);

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
      url: '/pages/acceptance-add/index'
    });
  };

  const handleCardClick = (item: RawMaterialAcceptance) => {
    console.log('[Acceptance] 查看验收单:', item.id);
    Taro.navigateTo({
      url: `/pages/trace/index?batchNo=${item.batchNo}`
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.filterBar}>
        <ScrollView scrollX className={styles.filterTabs}>
          {filters.map(filter => (
            <View
              key={filter.key}
              className={classnames(styles.tabItem, activeFilter === filter.key && styles.active)}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView scrollY className={styles.listContainer}>
        {filteredList.length > 0 ? (
          filteredList.map(item => (
            <View
              key={item.id}
              className={styles.card}
              onClick={() => handleCardClick(item)}
            >
              <View className={styles.cardHeader}>
                <Text className={styles.materialName}>{item.materialName}</Text>
                <StatusTag
                  text={getInspectionStatusText(item.conclusion)}
                  type={getStatusType(item.conclusion)}
                />
              </View>

              <View className={styles.cardInfo}>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>批次号：</Text>
                  <Text className={styles.value}>{item.batchNo}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>供应商：</Text>
                  <Text className={styles.value}>{item.supplier}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>规格数量：</Text>
                  <Text className={styles.value}>{item.materialSpec} × {item.quantity}{item.unit}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.label}>到货温度：</Text>
                  <Text className={classnames(styles.value, styles.tempHighlight)}>
                    {item.arrivalTemp}℃
                  </Text>
                </View>
              </View>

              {item.photos && item.photos.length > 0 && (
                <View className={styles.photos}>
                  {item.photos.slice(0, 4).map((photo, idx) => (
                    <View key={idx} className={styles.photoItem}>
                      <Image src={photo} mode="aspectFill" />
                    </View>
                  ))}
                </View>
              )}

              <View className={styles.cardFooter}>
                <View className={styles.inspector}>
                  <Text>🧑‍🔬 </Text>
                  <Text>{item.inspector}</Text>
                </View>
                <Text>{formatDateTime(item.inspectionTime)}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState text="暂无验收记录" icon="📦" />
        )}
      </ScrollView>

      <Button className={styles.fab} onClick={handleAdd}>+</Button>
    </View>
  );
};

export default AcceptancePage;
