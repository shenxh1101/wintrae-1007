import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { RectificationOrder, RectificationStatus } from '@/types/quality';
import { formatDateTime, getRectificationStatusText, getLevelText, getSourceTypeText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';

type ActionMode = 'view' | 'process' | 'submitRecheck' | 'recheck';

const RectificationDetailPage: React.FC = () => {
  const router = useRouter();
  const { getRectificationById, updateRectificationStatus, rectificationList, addRectificationLog } = useQualityStore();

  const id = router.params.id || '';
  const initialAction = router.params.action || '';

  const [actionMode, setActionMode] = useState<ActionMode>('view');
  const [processContent, setProcessContent] = useState('');
  const [recheckContent, setRecheckContent] = useState('');
  const [recheckResult, setRecheckResult] = useState<'pass' | 'fail' | ''>('');

  const order = useMemo(() => {
    return getRectificationById(id);
  }, [id, rectificationList]);

  useDidShow(() => {
    if (initialAction === '处理') {
      setActionMode('process');
    } else if (initialAction === '提交复查') {
      setActionMode('submitRecheck');
    } else if (initialAction === '复查') {
      setActionMode('recheck');
    }
  });

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: 100, textAlign: 'center', color: '#999' }}>
          整改单不存在
        </View>
      </View>
    );
  }

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

  const getTimelineItems = () => {
    const items: { status: string; title: string; time: string; content: string; active: boolean; done: boolean }[] = [];

    items.push({
      status: 'created',
      title: '创建整改单',
      time: formatDateTime(order.createdAt),
      content: `问题来源：${getSourceTypeText(order.sourceType)}\n责任人：${order.responsiblePerson}`,
      active: false,
      done: true
    });

    if (order.status === 'pending') {
      items.push({
        status: 'pending',
        title: '待处理',
        time: '',
        content: '等待责任人开始处理',
        active: true,
        done: false
      });
    } else {
      items.push({
        status: 'processing',
        title: '整改中',
        time: order.processStartTime ? formatDateTime(order.processStartTime) : '',
        content: order.processContent || '责任人已开始处理',
        active: order.status === 'processing',
        done: true
      });
    }

    if (order.status === 'rechecking' || order.status === 'completed' || order.status === 'closed') {
      items.push({
        status: 'rechecking',
        title: '待复查',
        time: order.submitRecheckTime ? formatDateTime(order.submitRecheckTime) : '',
        content: order.submitRecheckContent || '已提交复查申请',
        active: order.status === 'rechecking',
        done: true
      });
    }

    if (order.status === 'completed' || order.status === 'closed') {
      items.push({
        status: 'completed',
        title: order.status === 'closed' ? '已关闭' : '已完成',
        time: order.recheckTime ? formatDateTime(order.recheckTime) : '',
        content: order.recheckResult || '整改完成',
        active: false,
        done: true
      });
    }

    return items;
  };

  const handleProcess = () => {
    if (!processContent.trim()) {
      Taro.showToast({ title: '请填写整改措施', icon: 'none' });
      return;
    }
    updateRectificationStatus(id, 'processing', {
      processContent: processContent.trim(),
      processStartTime: new Date().toISOString()
    });
    Taro.showToast({ title: '已开始整改', icon: 'success' });
    setActionMode('view');
    setProcessContent('');
  };

  const handleSubmitRecheck = () => {
    if (!processContent.trim()) {
      Taro.showToast({ title: '请填写整改完成说明', icon: 'none' });
      return;
    }
    updateRectificationStatus(id, 'rechecking', {
      submitRecheckContent: processContent.trim(),
      submitRecheckTime: new Date().toISOString()
    });
    Taro.showToast({ title: '已提交复查', icon: 'success' });
    setActionMode('view');
    setProcessContent('');
  };

  const handleRecheck = () => {
    if (!recheckResult) {
      Taro.showToast({ title: '请选择复查结果', icon: 'none' });
      return;
    }
    if (!recheckContent.trim()) {
      Taro.showToast({ title: '请填写复查意见', icon: 'none' });
      return;
    }

    if (recheckResult === 'pass') {
      updateRectificationStatus(id, 'completed', {
        recheckResult: '复查通过：' + recheckContent.trim(),
        recheckTime: new Date().toISOString(),
        recheckConclusion: 'pass'
      });
      Taro.showToast({ title: '复查通过', icon: 'success' });
    } else {
      updateRectificationStatus(id, 'processing', {
        recheckResult: '复查不通过：' + recheckContent.trim(),
        recheckTime: new Date().toISOString(),
        recheckConclusion: 'fail'
      });
      Taro.showToast({ title: '退回整改', icon: 'none' });
    }
    setActionMode('view');
    setRecheckContent('');
    setRecheckResult('');
  };

  const handleClose = () => {
    Taro.showModal({
      title: '确认关闭',
      content: '关闭后将无法再进行操作',
      success: (res) => {
        if (res.confirm) {
          updateRectificationStatus(id, 'closed', {});
          Taro.showToast({ title: '已关闭', icon: 'success' });
        }
      }
    });
  };

  const getActionButtons = () => {
    if (actionMode !== 'view') {
      return (
        <View className={styles.footer}>
          <Button className={styles.secondaryBtn} onClick={() => setActionMode('view')}>取消</Button>
          {actionMode === 'process' && (
            <Button className={styles.primaryBtn} onClick={handleProcess}>确认开始整改</Button>
          )}
          {actionMode === 'submitRecheck' && (
            <Button className={styles.primaryBtn} onClick={handleSubmitRecheck}>提交复查</Button>
          )}
          {actionMode === 'recheck' && (
            <Button className={classnames(styles.primaryBtn, recheckResult === 'pass' ? styles.success : recheckResult === 'fail' ? styles.error : '')} onClick={handleRecheck}>
              提交复查结果
            </Button>
          )}
        </View>
      );
    }

    switch (order.status) {
      case 'pending':
        return (
          <View className={styles.footer}>
            <Button className={styles.primaryBtn} onClick={() => setActionMode('process')}>去处理</Button>
          </View>
        );
      case 'processing':
        return (
          <View className={styles.footer}>
            <Button className={styles.primaryBtn} onClick={() => setActionMode('submitRecheck')}>提交复查</Button>
          </View>
        );
      case 'rechecking':
        return (
          <View className={styles.footer}>
            <Button className={styles.primaryBtn} onClick={() => setActionMode('recheck')}>去复查</Button>
          </View>
        );
      case 'completed':
        return (
          <View className={styles.footer}>
            <Button className={styles.secondaryBtn} onClick={handleClose}>关闭</Button>
            <Button className={styles.primaryBtn} style={{ backgroundColor: '#999' }} disabled>已完成</Button>
          </View>
        );
      case 'closed':
        return null;
      default:
        return null;
    }
  };

  const timelineItems = getTimelineItems();

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.orderNo}>整改单编号：{order.orderNo}</Text>
        <Text className={styles.title}>{order.title}</Text>
        <View className={styles.metaRow}>
          <View className={styles.item}>
            <StatusTag text={getRectificationStatusText(order.status)} type={getStatusType(order.status)} />
          </View>
          <View className={styles.item}>
            <View className={classnames(styles.levelTag, order.level)}>{getLevelText(order.level)}</View>
          </View>
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        <View className={styles.card}>
          <View className={styles.cardTitle}>
            <Text className={styles.icon}>📋</Text>
            <Text>基本信息</Text>
          </View>
          <View className={styles.infoList}>
            <View className={styles.infoRow}>
              <Text className={styles.label}>问题来源</Text>
              <View className={styles.value}>
                <View className={styles.sourceTag}>{getSourceTypeText(order.sourceType)}</View>
              </View>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.label}>关联批次</Text>
              <Text className={styles.value}>{order.batchNo}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.label}>责任人</Text>
              <Text className={styles.value}>{order.responsiblePerson}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.label}>截止时间</Text>
              <Text className={styles.value}>{formatDateTime(order.deadline)}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.label}>创建人</Text>
              <Text className={styles.value}>{order.creator || '系统'}</Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardTitle}>
            <Text className={styles.icon}>📝</Text>
            <Text>问题描述</Text>
          </View>
          <Text style={{ fontSize: 28, color: '#333', lineHeight: 1.6 }}>{order.description}</Text>

          {order.photos && order.photos.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 26, color: '#666', marginBottom: 16 }}>现场照片</Text>
              <View className={styles.photoGrid}>
                {order.photos.map((photo, idx) => (
                  <View key={idx} className={styles.photoItem}>
                    <Image src={photo} mode="aspectFill" />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {actionMode === 'process' && (
          <View className={styles.card}>
            <View className={styles.cardTitle}>
              <Text className={styles.icon}>✏️</Text>
              <Text>填写整改措施</Text>
            </View>
            <Textarea
              className={styles.textarea}
              placeholder="请描述整改措施和计划..."
              value={processContent}
              onInput={(e) => setProcessContent(e.detail.value)}
              maxlength={500}
            />
          </View>
        )}

        {actionMode === 'submitRecheck' && (
          <View className={styles.card}>
            <View className={styles.cardTitle}>
              <Text className={styles.icon}>✅</Text>
              <Text>整改完成说明</Text>
            </View>
            <Textarea
              className={styles.textarea}
              placeholder="请描述整改完成情况..."
              value={processContent}
              onInput={(e) => setProcessContent(e.detail.value)}
              maxlength={500}
            />
          </View>
        )}

        {actionMode === 'recheck' && (
          <View className={styles.card}>
            <View className={styles.cardTitle}>
              <Text className={styles.icon}>🔍</Text>
              <Text>复查</Text>
            </View>
            <View className={styles.resultOptions}>
              <View
                className={classnames(styles.resultOption, recheckResult === 'pass' && styles.active, styles.pass)}
                onClick={() => setRecheckResult('pass')}
              >
                <Text className={styles.icon}>✅</Text>
                <Text className={styles.text}>复查通过</Text>
              </View>
              <View
                className={classnames(styles.resultOption, recheckResult === 'fail' && styles.active, styles.fail)}
                onClick={() => setRecheckResult('fail')}
              >
                <Text className={styles.icon}>❌</Text>
                <Text className={styles.text}>退回整改</Text>
              </View>
            </View>
            <Text className={styles.formLabel}>复查意见</Text>
            <Textarea
              className={styles.textarea}
              placeholder="请填写复查意见..."
              value={recheckContent}
              onInput={(e) => setRecheckContent(e.detail.value)}
              maxlength={500}
            />
          </View>
        )}

        <View className={styles.card}>
          <View className={styles.cardTitle}>
            <Text className={styles.icon}>⏱️</Text>
            <Text>处理进度</Text>
          </View>
          <View className={styles.timeline}>
            {timelineItems.map((item, idx) => (
              <View key={idx} className={styles.timelineItem}>
                <View className={classnames(styles.dot, item.active && styles.active, item.done && !item.active && styles.done)} />
                <Text className={styles.tlTitle}>{item.title}</Text>
                {item.time && <Text className={styles.tlTime}>{item.time}</Text>}
                {item.content && <Text className={styles.tlContent}>{item.content}</Text>}
              </View>
            ))}
          </View>
        </View>

        {order.remark && (
          <View className={styles.card}>
            <View className={styles.cardTitle}>
              <Text className={styles.icon}>💬</Text>
              <Text>备注</Text>
            </View>
            <Text style={{ fontSize: 28, color: '#666', lineHeight: 1.6 }}>{order.remark}</Text>
          </View>
        )}
      </ScrollView>

      {getActionButtons()}
    </View>
  );
};

export default RectificationDetailPage;
