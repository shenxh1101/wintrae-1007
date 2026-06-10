import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { InspectionStatus } from '@/types/quality';
import { formatDate, formatDateTime, getInspectionStatusText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type ExpandedStage = 'material' | 'process' | 'finished' | 'rectification' | null;

const TracePage: React.FC = () => {
  const router = useRouter();
  const [batchNo, setBatchNo] = useState(router.params.batchNo || '');
  const [traceInfo, setTraceInfo] = useState<any>(null);
  const [expandedStage, setExpandedStage] = useState<ExpandedStage>('material');
  const { getTraceInfo, addScanRecord } = useQualityStore();

  const loadTraceInfo = (batch: string) => {
    if (!batch.trim()) return;
    Taro.showLoading({ title: '查询中...' });
    setTimeout(() => {
      const info = getTraceInfo(batch.trim());
      setTraceInfo(info);
      setExpandedStage('material');
      if (info) {
        addScanRecord(batch.trim(), info.productName);
      }
      Taro.hideLoading();
    }, 300);
  };

  useEffect(() => {
    if (router.params.batchNo) {
      loadTraceInfo(router.params.batchNo);
    }
  }, [router.params.batchNo]);

  const handleSearch = () => {
    if (!batchNo.trim()) {
      Taro.showToast({
        title: '请输入批次号',
        icon: 'none'
      });
      return;
    }
    loadTraceInfo(batchNo);
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

  const goToAddAcceptance = () => {
    Taro.navigateTo({
      url: `/pages/acceptance-add/index?batchNo=${batchNo}`
    });
  };

  const goToAddProcess = () => {
    Taro.navigateTo({
      url: `/pages/process-add/index?batchNo=${batchNo}`
    });
  };

  const goToAddFinished = () => {
    Taro.navigateTo({
      url: `/pages/finished-add/index?batchNo=${batchNo}`
    });
  };

  const goToAddRectification = () => {
    Taro.navigateTo({
      url: `/pages/rectification-add/index?batchNo=${batchNo}`
    });
  };

  const hasUnqualifiedProcess = traceInfo?.processInspections?.some(
    (p: any) => p.conclusion === 'unqualified'
  );
  const hasRecheckProcess = traceInfo?.processInspections?.some(
    (p: any) => p.conclusion === 'recheck'
  );

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
                  <Text className={styles.value}>{traceInfo.quantity || '-'}</Text>
                </View>
              </View>
            </View>

            <View className={styles.timeline}>
              <View className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.dot,
                    traceInfo.rawMaterials?.length > 0
                      ? traceInfo.rawMaterials.every((m: any) => m.conclusion === 'qualified')
                        ? styles.success
                        : styles.warning
                      : styles.info
                  )}
                ></View>
                <View className={classnames(styles.stageCard, expandedStage === 'material' && styles.expanded)}>
                  <View className={styles.stageHeader} onClick={() => toggleStage('material')}>
                    <View className={styles.stageIcon}>📦</View>
                    <View className={styles.stageInfo}>
                      <Text className={styles.stageTitle}>原料验收</Text>
                      <Text className={styles.stageDesc}>
                        {traceInfo.rawMaterials?.length || 0} 种原料
                        {traceInfo.rawMaterials?.length > 0 &&
                          (traceInfo.rawMaterials.every((m: any) => m.conclusion === 'qualified')
                            ? ' · 全部合格'
                            : ' · 存在异常')}
                      </Text>
                    </View>
                    <Text className={classnames(styles.expandIcon, expandedStage === 'material' && styles.expanded)}>▼</Text>
                  </View>
                  {expandedStage === 'material' && (
                    <View className={styles.stageContent}>
                      {traceInfo.rawMaterials?.length > 0 ? (
                        traceInfo.rawMaterials.map((material: any, idx: number) => (
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
                            {material.photos?.length > 0 && (
                              <View style={{ marginTop: 24 }}>
                                <View className={styles.sectionTitle}>验收照片</View>
                                <View className={styles.photoList}>
                                  {material.photos.map((photo: string, pIdx: number) => (
                                    <View key={pIdx} className={styles.photoItem}>
                                      <Image src={photo} mode="aspectFill" />
                                    </View>
                                  ))}
                                </View>
                              </View>
                            )}
                            {material.remark && (
                              <View style={{ marginTop: 12 }}>
                                <Text style={{ fontSize: 24, color: '#4E5969' }}>备注：{material.remark}</Text>
                              </View>
                            )}
                          </View>
                        ))
                      ) : (
                        <View className={styles.addEntry} onClick={goToAddAcceptance}>
                          + 新增原料验收记录
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.dot,
                    traceInfo.processInspections?.length > 0
                      ? hasUnqualifiedProcess
                        ? styles.error
                        : hasRecheckProcess
                          ? styles.warning
                          : styles.success
                      : styles.info
                  )}
                ></View>
                <View className={classnames(styles.stageCard, expandedStage === 'process' && styles.expanded)}>
                  <View className={styles.stageHeader} onClick={() => toggleStage('process')}>
                    <View className={styles.stageIcon}>🔧</View>
                    <View className={styles.stageInfo}>
                      <Text className={styles.stageTitle}>过程检查</Text>
                      <Text className={styles.stageDesc}>
                        {traceInfo.processInspections?.length || 0} 道工序
                        {traceInfo.processInspections?.length > 0 &&
                          (hasUnqualifiedProcess
                            ? ' · 存在不合格'
                            : hasRecheckProcess
                              ? ' · 待复检'
                              : ' · 全部合格')}
                      </Text>
                    </View>
                    <Text className={classnames(styles.expandIcon, expandedStage === 'process' && styles.expanded)}>▼</Text>
                  </View>
                  {expandedStage === 'process' && (
                    <View className={styles.stageContent}>
                      {traceInfo.processInspections?.length > 0 ? (
                        traceInfo.processInspections.map((proc: any, idx: number) => (
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
                                {proc.parameters?.map((param: any, pIdx: number) => (
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
                        ))
                      ) : (
                        <View className={styles.addEntry} onClick={goToAddProcess}>
                          + 新增过程检查记录
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.dot,
                    traceInfo.finishedInspection
                      ? traceInfo.finishedInspection.conclusion === 'qualified'
                        ? styles.success
                        : traceInfo.finishedInspection.conclusion === 'unqualified'
                          ? styles.error
                          : styles.warning
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
                  {expandedStage === 'finished' && (
                    <View className={styles.stageContent}>
                      {traceInfo.finishedInspection ? (
                        <>
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
                            {traceInfo.finishedInspection.items?.map((item: any, idx: number) => (
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
                        </>
                      ) : (
                        <View className={styles.addEntry} onClick={goToAddFinished}>
                          + 新增成品抽检记录
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.dot,
                    traceInfo.rectifications?.length > 0 ? styles.warning : styles.info
                  )}
                ></View>
                <View className={classnames(styles.stageCard, expandedStage === 'rectification' && styles.expanded)}>
                  <View className={styles.stageHeader} onClick={() => toggleStage('rectification')}>
                    <View className={styles.stageIcon}>⚠️</View>
                    <View className={styles.stageInfo}>
                      <Text className={styles.stageTitle}>问题整改</Text>
                      <Text className={styles.stageDesc}>
                        {traceInfo.rectifications?.length || 0} 条整改记录
                        {traceInfo.rectifications?.length > 0 &&
                          (traceInfo.rectifications.some((r: any) => r.status === 'completed')
                            ? ' · 部分已完成'
                            : ' · 进行中')}
                      </Text>
                    </View>
                    <Text className={classnames(styles.expandIcon, expandedStage === 'rectification' && styles.expanded)}>▼</Text>
                  </View>
                  {expandedStage === 'rectification' && (
                    <View className={styles.stageContent}>
                      {traceInfo.rectifications?.length > 0 ? (
                        traceInfo.rectifications.map((rect: any, idx: number) => (
                          <View key={idx} className={styles.contentSection}>
                            <View className={styles.paramList}>
                              <View className={styles.paramItem}>
                                <Text className={styles.paramName}>整改单号</Text>
                                <Text className={styles.paramValue}>{rect.orderNo}</Text>
                              </View>
                              <View className={styles.paramItem}>
                                <Text className={styles.paramName}>问题描述</Text>
                                <Text className={styles.paramValue}>{rect.title}</Text>
                              </View>
                              <View className={styles.paramItem}>
                                <Text className={styles.paramName}>责任人</Text>
                                <Text className={styles.paramValue}>{rect.responsiblePerson}</Text>
                              </View>
                              <View className={styles.paramItem}>
                                <Text className={styles.paramName}>状态</Text>
                                <StatusTag
                                  text={rect.status === 'pending' ? '待处理' : rect.status === 'processing' ? '整改中' : rect.status === 'rechecking' ? '待复查' : rect.status === 'completed' ? '已完成' : '已关闭'}
                                  type={rect.status === 'pending' ? 'warning' : rect.status === 'processing' ? 'info' : rect.status === 'rechecking' ? 'primary' : rect.status === 'completed' ? 'success' : 'gray'}
                                />
                              </View>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View className={styles.addEntry} onClick={goToAddRectification}>
                          + 创建整改单
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default TracePage;
