import React, { useState } from 'react';
import { View, Text, Input, Button, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockTraceInfo, mockScanRecords } from '@/data/trace';
import type { TraceInfo, InspectionStatus } from '@/types/quality';
import { formatDate, formatDateTime, getInspectionStatusText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type ExpandedStage = 'material' | 'process' | 'finished' | 'packaging' | 'outbound' | null;

const TracePage: React.FC = () => {
  const [batchNo, setBatchNo] = useState('');
  const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null);
  const [expandedStage, setExpandedStage] = useState<ExpandedStage>('material');

  const quickBatches = mockScanRecords.slice(0, 4).map(r => r.batchNo);

  const handleSearch = () => {
    if (!batchNo.trim()) {
      Taro.showToast({
        title: '请输入批次号',
        icon: 'none'
      });
      return;
    }
    Taro.showLoading({ title: '查询中...' });
    setTimeout(() => {
      setTraceInfo(mockTraceInfo);
      setExpandedStage('material');
      Taro.hideLoading();
    }, 500);
  };

  const handleQuickSearch = (batch: string) => {
    setBatchNo(batch);
    Taro.showLoading({ title: '查询中...' });
    setTimeout(() => {
      setTraceInfo(mockTraceInfo);
      setExpandedStage('material');
      Taro.hideLoading();
    }, 500);
  };

  const toggleStage = (stage: ExpandedStage) => {
    setExpandedStage(expandedStage === stage ? null : stage);
  };

  const getStatusType = (status: InspectionStatus): 'success' | 'warning' | 'error' | 'info' | 'gray' => {
    const map: Record<InspectionStatus, 'success' | 'warning' | 'error' | 'info' | 'gray'> = {
      pending: 'warning',
      qualified: 'success',
      unqualified: 'error',
      recheck: 'info'
    };
    return map[status];
  };

  const getOverallStatus = (): 'success' | 'warning' | 'error' | 'info' => {
    if (!traceInfo) return 'info';
    if (traceInfo.finishedInspection?.conclusion === 'qualified') return 'success';
    if (traceInfo.finishedInspection?.conclusion === 'unqualified') return 'error';
    if (traceInfo.processInspections.some(p => p.conclusion === 'unqualified')) return 'warning';
    return 'info';
  };

  const hasUnqualifiedProcess = traceInfo?.processInspections.some(p => p.conclusion === 'unqualified');
  const hasRecheckProcess = traceInfo?.processInspections.some(p => p.conclusion === 'recheck');

  return (
    <View className={styles.page}>
      <View className={styles.searchSection}>
        <View className={styles.searchRow}>
          <Input
            className={styles.input}
            placeholder="请输入批次号"
            value={batchNo}
            onInput={(e) => setBatchNo(e.detail.value)}
            confirmType="search"
            onConfirm={handleSearch}
          />
          <Button className={styles.btn} onClick={handleSearch}>查询</Button>
        </View>
        <View className={styles.quickSearch}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '24rpx' }}>快捷查询：</Text>
          {quickBatches.map((batch, idx) => (
            <View key={idx} className={styles.chip} onClick={() => handleQuickSearch(batch)}>
              {batch}
            </View>
          ))}
        </View>
      </View>

      <ScrollView scrollY className={styles.content}>
        {!traceInfo ? (
          <View className={styles.emptySearch}>
            <EmptyState text="请输入批次号进行追溯查询" icon="🔍" />
          </View>
        ) : (
          <>
            <View className={styles.overviewCard}>
              <Text className={styles.productName}>{traceInfo.productName}</Text>
              <Text className={styles.batchNo}>批次号：{traceInfo.batchNo}</Text>
              <View className={styles.infoGrid}>
                <View className={styles.infoItem}>
                  <Text className={styles.label}>规格</Text>
                  <Text className={styles.value}>{traceInfo.productSpec}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.label}>生产日期</Text>
                  <Text className={styles.value}>{formatDate(traceInfo.productionDate)}</Text>
                </View>
                <View className={styles.infoItem}>
                  <Text className={styles.label}>数量</Text>
                  <Text className={styles.value}>{traceInfo.quantity}</Text>
                </View>
              </View>
            </View>

            <View className={styles.timeline}>
              <View className={styles.timelineItem}>
                <View className={classnames(styles.dot, styles.success)}></View>
                <View className={classnames(styles.stageCard, expandedStage === 'material' && styles.expanded)}>
                  <View className={styles.stageHeader} onClick={() => toggleStage('material')}>
                    <View className={styles.stageIcon}>📦</View>
                    <View className={styles.stageInfo}>
                      <Text className={styles.stageTitle}>原料验收</Text>
                      <Text className={styles.stageDesc}>
                        {traceInfo.rawMaterials.length} 种原料 · 全部合格
                      </Text>
                    </View>
                    <Text className={classnames(styles.expandIcon, expandedStage === 'material' && styles.expanded)}>▼</Text>
                  </View>
                  {expandedStage === 'material' && (
                    <View className={styles.stageContent}>
                      {traceInfo.rawMaterials.map((material, idx) => (
                        <View key={idx} className={styles.contentSection}>
                          <View className={styles.sectionTitle}>
                            {material.materialName}（{material.materialSpec}）
                          </View>
                          <View className={styles.paramList}>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>供应商</Text>
                              <Text className={styles.paramValue}>{material.supplier}</Text>
                            </View>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>到货时间</Text>
                              <Text className={styles.paramValue}>{formatDateTime(material.arrivalTime)}</Text>
                            </View>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>到货温度</Text>
                              <Text className={styles.paramValue}>{material.arrivalTemp}℃</Text>
                            </View>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>数量</Text>
                              <Text className={styles.paramValue}>{material.quantity} {material.unit}</Text>
                            </View>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>检验员</Text>
                              <Text className={styles.paramValue}>{material.inspector}</Text>
                            </View>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>检验结论</Text>
                              <StatusTag
                                text={getInspectionStatusText(material.conclusion)}
                                type={getStatusType(material.conclusion)}
                              />
                            </View>
                          </View>
                          {material.photos.length > 0 && (
                            <View style={{ marginTop: 24 }}>
                              <View className={styles.sectionTitle}>验收照片</View>
                              <View className={styles.photoList}>
                                {material.photos.map((photo, pIdx) => (
                                  <View key={pIdx} className={styles.photoItem}>
                                    <Image src={photo} mode="aspectFill" />
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                          {material.remark && (
                            <View style={{ marginTop: 16 }}>
                              <View className={styles.sectionTitle}>备注</View>
                              <Text style={{ fontSize: 24, color: '#4E5969' }}>{material.remark}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.dot,
                    hasUnqualifiedProcess ? styles.error : hasRecheckProcess ? styles.warning : styles.success
                  )}
                ></View>
                <View className={classnames(styles.stageCard, expandedStage === 'process' && styles.expanded)}>
                  <View className={styles.stageHeader} onClick={() => toggleStage('process')}>
                    <View className={styles.stageIcon}>🔬</View>
                    <View className={styles.stageInfo}>
                      <Text className={styles.stageTitle}>过程检查</Text>
                      <Text className={styles.stageDesc}>
                        {traceInfo.processInspections.length} 道工序 · 
                        {hasUnqualifiedProcess ? ' 存在不合格' : hasRecheckProcess ? ' 待复检' : ' 全部合格'}
                      </Text>
                    </View>
                    <Text className={classnames(styles.expandIcon, expandedStage === 'process' && styles.expanded)}>▼</Text>
                  </View>
                  {expandedStage === 'process' && (
                    <View className={styles.stageContent}>
                      {traceInfo.processInspections.map((proc, idx) => (
                        <View key={idx} className={styles.contentSection}>
                          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                              工序{proc.processIndex}：{proc.processName}
                            </View>
                            <StatusTag
                              text={getInspectionStatusText(proc.conclusion)}
                              type={getStatusType(proc.conclusion)}
                            />
                          </View>
                          <View className={styles.paramList}>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>操作人员</Text>
                              <Text className={styles.paramValue}>{proc.operator}</Text>
                            </View>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>检验员</Text>
                              <Text className={styles.paramValue}>{proc.inspector}</Text>
                            </View>
                            <View className={styles.paramItem}>
                              <Text className={styles.paramName}>检验时间</Text>
                              <Text className={styles.paramValue}>{formatDateTime(proc.inspectionTime)}</Text>
                            </View>
                          </View>
                          <View style={{ marginTop: 16 }}>
                            <View className={styles.sectionTitle}>关键参数</View>
                            <View className={styles.paramList}>
                              {proc.parameters.map((param, pIdx) => (
                                <View key={pIdx} className={styles.paramItem}>
                                  <Text className={styles.paramName}>{param.name}</Text>
                                  <View style={{ textAlign: 'right' }}>
                                    <Text
                                      className={classnames(styles.paramValue, !param.isQualified && styles.fail)}
                                    >
                                      {param.value}{param.unit}
                                    </Text>
                                    <Text style={{ fontSize: 20, color: '#86909C' }}>
                                      标准：{param.standard}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                          {proc.remark && (
                            <View style={{ marginTop: 12 }}>
                              <Text style={{ fontSize: 24, color: '#4E5969' }}>备注：{proc.remark}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.dot,
                    traceInfo.finishedInspection?.conclusion === 'qualified'
                      ? styles.success
                      : traceInfo.finishedInspection?.conclusion === 'unqualified'
                        ? styles.error
                        : styles.info
                  )}
                ></View>
                <View className={classnames(styles.stageCard, expandedStage === 'finished' && styles.expanded)}>
                  <View className={styles.stageHeader} onClick={() => toggleStage('finished')}>
                    <View className={styles.stageIcon}>✅</View>
                    <View className={styles.stageInfo}>
                      <Text className={styles.stageTitle}>成品抽检</Text>
                      <Text className={styles.stageDesc}>
                        {traceInfo.finishedInspection
                          ? `抽检 ${traceInfo.finishedInspection.sampleCount} 件 · ${getInspectionStatusText(traceInfo.finishedInspection.conclusion)}`
                          : '未抽检'}
                      </Text>
                    </View>
                    <Text className={classnames(styles.expandIcon, expandedStage === 'finished' && styles.expanded)}>▼</Text>
                  </View>
                  {expandedStage === 'finished' && traceInfo.finishedInspection && (
                    <View className={styles.stageContent}>
                      <View className={styles.contentSection}>
                        <View className={styles.sectionTitle}>抽检概况</View>
                        <View className={styles.paramList}>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>产品名称</Text>
                            <Text className={styles.paramValue}>{traceInfo.finishedInspection.productName}</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>抽检数量</Text>
                            <Text className={styles.paramValue}>{traceInfo.finishedInspection.sampleCount} 件</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>检验员</Text>
                            <Text className={styles.paramValue}>{traceInfo.finishedInspection.inspector}</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>检验时间</Text>
                            <Text className={styles.paramValue}>
                              {formatDateTime(traceInfo.finishedInspection.inspectionTime)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className={styles.contentSection}>
                        <View className={styles.sectionTitle}>检验项目</View>
                        {traceInfo.finishedInspection.items.map((item, idx) => (
                          <View key={idx} className={styles.itemCard}>
                            <View className={styles.itemHeader}>
                              <Text className={styles.itemName}>{item.name}</Text>
                              <StatusTag
                                text={item.isQualified ? '合格' : '不合格'}
                                type={item.isQualified ? 'success' : 'error'}
                              />
                            </View>
                            <Text className={styles.itemDetail}>标准：{item.standard}</Text>
                            <Text className={classnames(styles.itemResult, !item.isQualified && styles.fail)}>
                              结果：{item.result}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {traceInfo.finishedInspection.remark && (
                        <View className={styles.contentSection}>
                          <View className={styles.sectionTitle}>备注</View>
                          <Text style={{ fontSize: 24, color: '#4E5969' }}>
                            {traceInfo.finishedInspection.remark}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {traceInfo.packagingInfo && (
                <View className={styles.timelineItem}>
                  <View className={classnames(styles.dot, styles.success)}></View>
                  <View className={classnames(styles.stageCard, expandedStage === 'packaging' && styles.expanded)}>
                    <View className={styles.stageHeader} onClick={() => toggleStage('packaging')}>
                      <View className={styles.stageIcon}>📦</View>
                      <View className={styles.stageInfo}>
                        <Text className={styles.stageTitle}>包装信息</Text>
                        <Text className={styles.stageDesc}>
                          {traceInfo.packagingInfo.packageType} · {traceInfo.packagingInfo.packageSpec}
                        </Text>
                      </View>
                      <Text className={classnames(styles.expandIcon, expandedStage === 'packaging' && styles.expanded)}>▼</Text>
                    </View>
                    {expandedStage === 'packaging' && (
                      <View className={styles.stageContent}>
                        <View className={styles.paramList}>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>包装类型</Text>
                            <Text className={styles.paramValue}>{traceInfo.packagingInfo.packageType}</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>包装规格</Text>
                            <Text className={styles.paramValue}>{traceInfo.packagingInfo.packageSpec}</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>包装时间</Text>
                            <Text className={styles.paramValue}>
                              {formatDateTime(traceInfo.packagingInfo.packageTime)}
                            </Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>包装员</Text>
                            <Text className={styles.paramValue}>{traceInfo.packagingInfo.operator}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {traceInfo.outboundInfo && (
                <View className={styles.timelineItem}>
                  <View className={classnames(styles.dot, styles.success)}></View>
                  <View className={classnames(styles.stageCard, expandedStage === 'outbound' && styles.expanded)}>
                    <View className={styles.stageHeader} onClick={() => toggleStage('outbound')}>
                      <View className={styles.stageIcon}>🚚</View>
                      <View className={styles.stageInfo}>
                        <Text className={styles.stageTitle}>出库信息</Text>
                        <Text className={styles.stageDesc}>
                          {traceInfo.outboundInfo.destination}
                        </Text>
                      </View>
                      <Text className={classnames(styles.expandIcon, expandedStage === 'outbound' && styles.expanded)}>▼</Text>
                    </View>
                    {expandedStage === 'outbound' && (
                      <View className={styles.stageContent}>
                        <View className={styles.paramList}>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>出库单号</Text>
                            <Text className={styles.paramValue}>{traceInfo.outboundInfo.outboundNo}</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>出库时间</Text>
                            <Text className={styles.paramValue}>
                              {formatDateTime(traceInfo.outboundInfo.outboundTime)}
                            </Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>目的地</Text>
                            <Text className={styles.paramValue}>{traceInfo.outboundInfo.destination}</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>接收人</Text>
                            <Text className={styles.paramValue}>{traceInfo.outboundInfo.receiver}</Text>
                          </View>
                          <View className={styles.paramItem}>
                            <Text className={styles.paramName}>出库数量</Text>
                            <Text className={styles.paramValue}>{traceInfo.outboundInfo.quantity} 件</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default TracePage;
