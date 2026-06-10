import React, { useState } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockScanRecords } from '@/data/trace';
import type { ScanRecord } from '@/types/quality';
import { formatDateTime } from '@/utils/format';
import EmptyState from '@/components/EmptyState';

const ScanPage: React.FC = () => {
  const [batchNo, setBatchNo] = useState('');
  const [records, setRecords] = useState<ScanRecord[]>(mockScanRecords.slice(0, 5));

  const handleScan = () => {
    Taro.showToast({
      title: '模拟扫码中...',
      icon: 'loading',
      duration: 1000
    });
    setTimeout(() => {
      const randomBatch = mockScanRecords[Math.floor(Math.random() * mockScanRecords.length)];
      setBatchNo(randomBatch.batchNo);
      Taro.showToast({
        title: '扫码成功',
        icon: 'success'
      });
    }, 1000);
  };

  const handleQuery = () => {
    if (!batchNo.trim()) {
      Taro.showToast({
        title: '请输入批次号',
        icon: 'none'
      });
      return;
    }
    const newRecord: ScanRecord = {
      id: Date.now().toString(),
      batchNo: batchNo.trim(),
      scanTime: new Date().toISOString(),
      productName: '查询产品'
    };
    const existIndex = records.findIndex(r => r.batchNo === batchNo.trim());
    if (existIndex > -1) {
      const updated = [...records];
      updated.splice(existIndex, 1);
      setRecords([newRecord, ...updated]);
    } else {
      setRecords([newRecord, ...records.slice(0, 9)]);
    }
    Taro.switchTab({
      url: '/pages/trace/index'
    });
  };

  const handleRecordClick = (record: ScanRecord) => {
    setBatchNo(record.batchNo);
    Taro.switchTab({
      url: '/pages/trace/index'
    });
  };

  const handleClearHistory = () => {
    Taro.showModal({
      title: '提示',
      content: '确定清空历史记录？',
      success: (res) => {
        if (res.confirm) {
          setRecords([]);
        }
      }
    });
  };

  const handleQuickAction = (index: number) => {
    const tabMap = ['acceptance', 'inspection', 'rectification', 'trace'];
    if (index < tabMap.length) {
      Taro.switchTab({
        url: `/pages/${tabMap[index]}/index`
      });
    }
  };

  const quickActions = [
    { icon: '📦', label: '原料验收' },
    { icon: '🔬', label: '过程检验' },
    { icon: '📋', label: '问题整改' },
    { icon: '🔍', label: '追溯查询' }
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
              onClick={() => handleQuickAction(index)}
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
          {records.length > 0 && (
            <Text className={styles.clearBtn} onClick={handleClearHistory}>清空</Text>
          )}
        </View>

        {records.length > 0 ? (
          <View className={styles.recordList}>
            {records.map((record) => (
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
