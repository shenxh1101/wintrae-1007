import React, { useState } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { ScanRecord } from '@/types/quality';
import { formatDateTime } from '@/utils/format';
import EmptyState from '@/components/EmptyState';

const productNames: Record<string, string> = {
  'B202406100123': '原味酸奶',
  'B202406090088': '草莓酸奶',
  'B202406080056': '巧克力奶',
  'B202406070101': '原味纯牛奶',
  'B202406100124': '白砂糖',
  'B202406090089': '全脂乳粉',
  'B202406070102': '香蕉牛奶'
};

const ScanPage: React.FC = () => {
  const [batchNo, setBatchNo] = useState('');
  const { scanRecords, addScanRecord } = useQualityStore();

  useDidShow(() => {
  });

  const handleScan = () => {
    Taro.showToast({
      title: '模拟扫码中...',
      icon: 'loading',
      duration: 1000
    });
    setTimeout(() => {
      const mockBatches = Object.keys(productNames);
      const randomBatch = mockBatches[Math.floor(Math.random() * mockBatches.length)];
      setBatchNo(randomBatch);
      Taro.showToast({
        title: '扫码成功',
        icon: 'success'
      });
      setTimeout(() => {
        goToTrace(randomBatch);
      }, 500);
    }, 1000);
  };

  const goToTrace = (batch: string) => {
    const productName = productNames[batch] || '产品';
    addScanRecord(batch, productName);
    Taro.navigateTo({
      url: `/pages/trace/index?batchNo=${batch}`
    });
  };

  const handleQuery = () => {
    if (!batchNo.trim()) {
      Taro.showToast({
        title: '请输入批次号',
        icon: 'none'
      });
      return;
    }
    goToTrace(batchNo.trim());
  };

  const handleRecordClick = (record: ScanRecord) => {
    setBatchNo(record.batchNo);
    goToTrace(record.batchNo);
  };

  const handleClearHistory = () => {
    Taro.showModal({
      title: '提示',
      content: '确定清空历史记录？',
      success: (res) => {
        if (res.confirm) {
          useQualityStore.setState({ scanRecords: [] });
        }
      }
    });
  };

  const handleQuickAction = (type: string) => {
    const pageMap: Record<string, string> = {
      acceptance: '/pages/acceptance/index',
      process: '/pages/process/index',
      finished: '/pages/finished/index',
      rectification: '/pages/rectification/index'
    };
    const url = pageMap[type];
    if (url) {
      Taro.switchTab({ url });
    }
  };

  const quickActions = [
    { icon: '📦', label: '原料验收', type: 'acceptance' },
    { icon: '🔧', label: '过程检查', type: 'process' },
    { icon: '✅', label: '成品抽检', type: 'finished' },
    { icon: '📋', label: '问题整改', type: 'rectification' }
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>批次扫码</Text>
        <Text className={styles.subtitle}>扫码录入批次，快速追溯质量信息</Text>
      </View>

      <View className={styles.scanSection}>
        <View className={styles.scanBtn} onClick={handleScan}>
          <Text className={styles.icon}>📷</Text>
          <Text className={styles.text}>扫一扫</Text>
        </View>

        <View className={styles.inputRow}>
          <Input
            className={styles.input}
            placeholder="请输入或扫码批次号"
            value={batchNo}
            onInput={(e) => setBatchNo(e.detail.value)}
            confirmType="search"
            onConfirm={handleQuery}
          />
          <Button className={styles.btn} onClick={handleQuery}>查询</Button>
        </View>

        <View className={styles.quickActions}>
          {quickActions.map((item, index) => (
            <View
              key={index}
              className={styles.quickItem}
              onClick={() => handleQuickAction(item.type)}
            >
              <View className={styles.iconBox}>{item.icon}</View>
              <Text className={styles.label}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.historySection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>历史记录</Text>
          {scanRecords.length > 0 && (
            <Text className={styles.clearBtn} onClick={handleClearHistory}>清空</Text>
          )}
        </View>

        {scanRecords.length > 0 ? (
          <View className={styles.recordList}>
            {scanRecords.map((record) => (
              <View
                key={record.id}
                className={styles.recordItem}
                onClick={() => handleRecordClick(record)}
              >
                <View className={styles.batchInfo}>
                  <Text className={styles.batchNo}>{record.batchNo}</Text>
                  <Text className={styles.productName}>{record.productName}</Text>
                </View>
                <Text className={styles.scanTime}>{formatDateTime(record.scanTime, 'MM-DD HH:mm')}</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState text="暂无扫码记录" icon="📋" />
        )}
      </View>
    </ScrollView>
  );
};

export default ScanPage;
