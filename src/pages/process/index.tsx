import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { ProcessInspection, InspectionStatus } from '@/types/quality';
import { formatDateTime, getInspectionStatusText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type FilterType = 'all' | InspectionStatus;

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'qualified', label: '合格' },
  { key: 'unqualified', label: '不合格' },
  { key: 'recheck', label: '待复检' }
];

const ProcessPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { processInspectionList } = useQualityStore();

  useDidShow(() => {
  });

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return processInspectionList;
    return processInspectionList.filter(item => item.conclusion === activeFilter);
  }, [processInspectionList, activeFilter]);

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
      url: '/pages/process-add/index'
    });
  };

  const handleCardClick = (item: ProcessInspection) => {
    console.log('[Process] 查看过程检查:', item.id);
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
          filteredList.map(item => (
            <View
              key={item.id}
              className={styles.card}
              onClick={() => handleCardClick(item)}
            >
              <View className={styles.cardHeader}>
                <View className={styles.titleRow}>
                  <View className={styles.processIndex}>{item.processIndex}</View>
                  <Text className={styles.title}>{item.processName}</Text>
                </View>
                <StatusTag
                  text={getInspectionStatusText(item.conclusion)}
                  type={getStatusType(item.conclusion)}
                />
              </View>

              <Text className={styles.cardSubtitle}>批次号：{item.batchNo}</Text>

              <View className={styles.paramsRow}>
                {item.parameters.slice(0, 4).map((param, idx) => (
                  <View
                    key={idx}
                    className={classnames(styles.paramTag, !param.isQualified && styles.fail)}
                  >
                    {param.name}：
                    <Text className={classnames(styles.value, !param.isQualified && styles.fail)}>
                      {param.value}{param.unit}
                    </Text>
                  </View>
                ))}
              </View>

              <View className={styles.cardFooter}>
                <View className={styles.left}>
                  <Text>👤 操作：{item.operator}</Text>
                  <Text>🔬 检验：{item.inspector}</Text>
                </View>
                <Text>{formatDateTime(item.inspectionTime, 'MM-DD HH:mm')}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState text="暂无过程检查记录" icon="🔧" />
        )}
      </ScrollView>

      <Button className={styles.fab} onClick={handleAdd}>+</Button>
    </View>
  );
};

export default ProcessPage;
