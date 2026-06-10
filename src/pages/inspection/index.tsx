import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockProcessInspectionList, mockFinishedInspectionList } from '@/data/inspection';
import type { ProcessInspection, FinishedProductInspection, InspectionStatus } from '@/types/quality';
import { formatDateTime, getInspectionStatusText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type TabType = 'process' | 'finished';
type FilterType = 'all' | InspectionStatus;

const processFilters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'qualified', label: '合格' },
  { key: 'unqualified', label: '不合格' },
  { key: 'recheck', label: '待复检' }
];

const finishedFilters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待检验' },
  { key: 'qualified', label: '合格' },
  { key: 'unqualified', label: '不合格' }
];

const InspectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('process');
  const [processFilter, setProcessFilter] = useState<FilterType>('all');
  const [finishedFilter, setFinishedFilter] = useState<FilterType>('all');
  const [processList] = useState<ProcessInspection[]>(mockProcessInspectionList);
  const [finishedList] = useState<FinishedProductInspection[]>(mockFinishedInspectionList);

  const filteredProcessList = useMemo(() => {
    if (processFilter === 'all') return processList;
    return processList.filter(item => item.conclusion === processFilter);
  }, [processList, processFilter]);

  const filteredFinishedList = useMemo(() => {
    if (finishedFilter === 'all') return finishedList;
    return finishedList.filter(item => item.conclusion === finishedFilter);
  }, [finishedList, finishedFilter]);

  const getStatusType = (status: InspectionStatus): 'success' | 'warning' | 'error' | 'info' | 'gray' => {
    const map: Record<InspectionStatus, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
      pending: 'warning',
      qualified: 'success',
      unqualified: 'error',
      recheck: 'info'
    };
    return map[status];
  };

  const handleProcessClick = (item: ProcessInspection) => {
    console.log('[Inspection] 查看过程检查:', item.id);
    Taro.showToast({
      title: `查看 ${item.processName}`,
      icon: 'none'
    });
  };

  const handleFinishedClick = (item: FinishedProductInspection) => {
    console.log('[Inspection] 查看成品抽检:', item.id);
    Taro.showToast({
      title: `查看 ${item.productName}`,
      icon: 'none'
    });
  };

  const handleAdd = () => {
    Taro.showActionSheet({
      itemList: ['新增过程检查', '新增成品抽检'],
      success: (res) => {
        const type = res.tapIndex === 0 ? '过程检查' : '成品抽检';
        Taro.showToast({
          title: `新增${type}`,
          icon: 'none'
        });
      }
    });
  };

  const getQualifiedCount = (items: { isQualified: boolean }[]) => {
    return items.filter(i => i.isQualified).length;
  };

  const filters = activeTab === 'process' ? processFilters : finishedFilters;
  const activeFilter = activeTab === 'process' ? processFilter : finishedFilter;
  const setActiveFilter = activeTab === 'process' ? setProcessFilter : setFinishedFilter;

  return (
    <View className={styles.page}>
      <View className={styles.tabBar}>
        <View
          className={classnames(styles.tabItem, activeTab === 'process' && styles.active)}
          onClick={() => setActiveTab('process')}
        >
          过程检查
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'finished' && styles.active)}
          onClick={() => setActiveTab('finished')}
        >
          成品抽检
        </View>
      </View>

      <ScrollView scrollX className={styles.filterBar}>
        {filters.map(filter => (
          <View
            key={filter.key}
            className={classnames(styles.filterChip, activeFilter === filter.key && styles.active)}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.listContainer}>
        {activeTab === 'process' ? (
          filteredProcessList.length > 0 ? (
            filteredProcessList.map(item => (
              <View
                key={item.id}
                className={styles.card}
                onClick={() => handleProcessClick(item)}
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
            <EmptyState text="暂无过程检查记录" icon="🔬" />
          )
        ) : (
          filteredFinishedList.length > 0 ? (
            filteredFinishedList.map(item => {
              const qualified = getQualifiedCount(item.items);
              const total = item.items.length;
              const isAllPass = qualified === total;
              return (
                <View
                  key={item.id}
                  className={styles.card}
                  onClick={() => handleFinishedClick(item)}
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
            <EmptyState text="暂无成品抽检记录" icon="📋" />
          )
        )}
      </ScrollView>

      <Button className={styles.fab} onClick={handleAdd}>+</Button>
    </View>
  );
};

export default InspectionPage;
