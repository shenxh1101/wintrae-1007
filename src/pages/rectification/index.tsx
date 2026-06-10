import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockRectificationList } from '@/data/rectification';
import type { RectificationOrder, RectificationStatus } from '@/types/quality';
import { formatDateTime, getRectificationStatusText, getLevelText, getSourceTypeText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type FilterType = 'all' | RectificationStatus;

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '整改中' },
  { key: 'rechecking', label: '待复查' },
  { key: 'completed', label: '已完成' },
  { key: 'closed', label: '已关闭' }
];

const RectificationPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [list] = useState<RectificationOrder[]>(mockRectificationList);

  const filteredList = useMemo(() => {
    if (activeFilter === 'all') return list;
    return list.filter(item => item.status === activeFilter);
  }, [list, activeFilter]);

  const getStatusType = (status: RectificationStatus): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'purple' | 'gray' => {
    const map: Record<RectificationStatus, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'purple' | 'gray'> = {
      pending: 'warning',
      processing: 'info',
      rechecking: 'purple',
      completed: 'success',
      closed: 'gray'
    };
    return map[status];
  };

  const handleCardClick = (item: RectificationOrder) => {
    console.log('[Rectification] 查看整改单:', item.id);
    Taro.showToast({
      title: `查看 ${item.title}`,
      icon: 'none'
    });
  };

  const handleAdd = () => {
    Taro.showToast({
      title: '创建整改单',
      icon: 'none'
    });
  };

  const handleAction = (action: string, item: RectificationOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[Rectification] 操作:', action, item.id);
    Taro.showToast({
      title: `${action}操作`,
      icon: 'none'
    });
  };

  const isDeadlineUrgent = (deadline: string): boolean => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours < 24 && diffHours > 0;
  };

  const getActionButton = (item: RectificationOrder) => {
    switch (item.status) {
      case 'pending':
        return <Button className={styles.btnSmall} onClick={(e) => handleAction('处理', item, e)}>去处理</Button>;
      case 'processing':
        return <Button className={styles.btnSmall} onClick={(e) => handleAction('提交复查', item, e)}>提交复查</Button>;
      case 'rechecking':
        return <Button className={styles.btnSmall} onClick={(e) => handleAction('复查', item, e)}>去复查</Button>;
      default:
        return null;
    }
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
                <Text className={styles.title}>{item.title}</Text>
                <View className={classnames(styles.levelTag, item.level)}>
                  {getLevelText(item.level)}
                </View>
              </View>

              <View className={styles.metaRow}>
                <View className={styles.metaItem}>
                  <Text className={styles.sourceTag}>{getSourceTypeText(item.sourceType)}</Text>
                </View>
                <View className={styles.metaItem}>
                  <Text className={styles.icon}>📦</Text>
                  <Text>{item.batchNo}</Text>
                </View>
              </View>

              <Text className={styles.description}>{item.description}</Text>

              {item.status !== 'completed' && item.status !== 'closed' && (
                <View className={classnames(styles.deadline, !isDeadlineUrgent(item.deadline) && styles.normal)}>
                  <Text>⏰</Text>
                  <Text>截止：{formatDateTime(item.deadline, 'MM-DD HH:mm')}</Text>
                </View>
              )}

              <View className={styles.cardFooter}>
                <View>
                  <Text>责任人：{item.responsiblePerson}</Text>
                </View>
                <View className={styles.actionBtns}>
                  <StatusTag
                    text={getRectificationStatusText(item.status)}
                    type={getStatusType(item.status)}
                  />
                  {getActionButton(item)}
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState text="暂无整改记录" icon="📋" />
        )}
      </ScrollView>

      <Button className={styles.fab} onClick={handleAdd}>+</Button>
    </View>
  );
};

export default RectificationPage;
