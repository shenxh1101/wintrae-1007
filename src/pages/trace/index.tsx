import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Input, Button, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { InspectionStatus } from '@/types/quality';
import { formatDate, formatDateTime, getInspectionStatusText, getRectificationStatusText } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import EmptyState from '@/components/EmptyState';

type ExpandedStage = 'material' | 'process' | 'finished' | 'rectification' | 'packaging' | 'outbound' | null;
type ViewMode = 'timeline' | 'report';

interface StageComplete {
  key: ExpandedStage;
  label: string;
  icon: string;
  hasData: boolean;
  summary: string;
  addEntry?: () => void;
}

const TracePage: React.FC = () => {
  const router = useRouter();
  const [batchNo, setBatchNo] = useState(router.params.batchNo || '');
  const [traceInfo, setTraceInfo] = useState<any>(null);
  const [expandedStage, setExpandedStage] = useState<ExpandedStage>('material');
  const [expandedReport, setExpandedReport] = useState<ExpandedStage>('material');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const { getTraceInfo, addScanRecord } = useQualityStore();
  const lastLoadedBatch = useRef('');

  const loadTraceInfo = (batch: string) => {
    if (!batch.trim()) return;
    if (lastLoadedBatch.current === batch.trim() && traceInfo) return;
    Taro.showLoading({ title: '查询中...' });
    setTimeout(() => {
      const info = getTraceInfo(batch.trim());
      setTraceInfo(info);
      setExpandedStage('material');
      setExpandedReport('material');
      lastLoadedBatch.current = batch.trim();
      if (info) {
        addScanRecord(batch.trim(), info.productName);
      }
      Taro.hideLoading();
    }, 300);
  };

  useDidShow(() => {
    const paramBatch = router.params.batchNo || '';
    if (paramBatch) {
      setBatchNo(paramBatch);
      lastLoadedBatch.current = '';
      loadTraceInfo(paramBatch);
    } else if (lastLoadedBatch.current) {
      lastLoadedBatch.current = '';
      loadTraceInfo(batchNo);
    }
  });

  useEffect(() => {
    const paramBatch = router.params.batchNo || '';
    if (paramBatch) {
      loadTraceInfo(paramBatch);
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
    lastLoadedBatch.current = '';
    loadTraceInfo(batchNo);
  };

  const toggleStage = (stage: ExpandedStage) => {
    if (viewMode === 'timeline') {
      setExpandedStage(expandedStage === stage ? null : stage);
    } else {
      setExpandedReport(expandedReport === stage ? null : stage);
    }
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

  const stageCompleteness: StageComplete[] = useMemo(() => {
    if (!traceInfo) return [];
    return [
      {
        key: 'material',
        label: '原料验收',
        icon: '📦',
        hasData: traceInfo.rawMaterials?.length > 0,
        summary: traceInfo.rawMaterials?.length ? `${traceInfo.rawMaterials.length} 种原料` : '未登记',
        addEntry: goToAddAcceptance
      },
      {
        key: 'process',
        label: '过程检查',
        icon: '🔧',
        hasData: traceInfo.processInspections?.length > 0,
        summary: traceInfo.processInspections?.length ? `${traceInfo.processInspections.length} 道工序` : '未登记',
        addEntry: goToAddProcess
      },
      {
        key: 'finished',
        label: '成品抽检',
        icon: '✅',
        hasData: !!traceInfo.finishedInspection,
        summary: (() => {
          const f = traceInfo.finishedInspection;
          if (!f) return '未抽检';
          const total = f.items?.length || 0;
          let q = 0;
          let hasR = false;
          f.items?.forEach((it: any) => {
            if (it.recheckResult) hasR = true;
            const ok = typeof it.isRecheckQualified === 'boolean' ? it.isRecheckQualified : it.isQualified;
            if (ok) q++;
          });
          return `${q}/${total} 合格${hasR ? '（含复检）' : ''}`;
        })(),
        addEntry: goToAddFinished
      },
      {
        key: 'rectification',
        label: '问题整改',
        icon: '⚠️',
        hasData: traceInfo.rectifications?.length > 0,
        summary: traceInfo.rectifications?.length ? `${traceInfo.rectifications.length} 条整改` : '无异常',
        addEntry: goToAddRectification
      },
      {
        key: 'packaging',
        label: '包装信息',
        icon: '📦',
        hasData: !!traceInfo.packagingInfo,
        summary: traceInfo.packagingInfo ? traceInfo.packagingInfo.packageType : '未包装'
      },
      {
        key: 'outbound',
        label: '出库信息',
        icon: '🚚',
        hasData: !!traceInfo.outboundInfo,
        summary: traceInfo.outboundInfo ? `${traceInfo.outboundInfo.quantity} 箱` : '未出库'
      }
    ];
  }, [traceInfo, batchNo]);

  const completenessPercent = useMemo(() => {
    if (stageCompleteness.length === 0) return 0;
    const done = stageCompleteness.filter(s => s.hasData).length;
    return Math.round((done / stageCompleteness.length) * 100);
  }, [stageCompleteness]);

  const buildReportText = (): string => {
    if (!traceInfo) return '';
    const lines: string[] = [];
    lines.push(`【批次追溯报告】`);
    lines.push(`产品名称：${traceInfo.productName}`);
    lines.push(`批次号：${traceInfo.batchNo}`);
    lines.push(`规格：${traceInfo.productSpec || '—'}`);
    lines.push(`生产日期：${formatDate(traceInfo.productionDate)}`);
    lines.push(`数量：${traceInfo.quantity || 0}`);
    lines.push('');

    lines.push(`【1. 原料验收】${traceInfo.rawMaterials?.length || 0} 种`);
    if (traceInfo.rawMaterials?.length) {
      traceInfo.rawMaterials.forEach((m: any, i: number) => {
        lines.push(`  ${i + 1}. ${m.materialName}（${m.materialSpec}）`);
        lines.push(`     供应商：${m.supplier} | 到货温度：${m.arrivalTemp}℃`);
        lines.push(`     检验结论：${getInspectionStatusText(m.conclusion)}`);
      });
    } else {
      lines.push('  （无记录）');
    }
    lines.push('');

    lines.push(`【2. 过程检查】${traceInfo.processInspections?.length || 0} 道工序`);
    if (traceInfo.processInspections?.length) {
      traceInfo.processInspections.forEach((p: any, i: number) => {
        const failCount = p.parameters?.filter((x: any) => !x.isQualified).length || 0;
        lines.push(`  ${i + 1}. 工序${p.processIndex}：${p.processName}`);
        lines.push(`     操作：${p.operator} | 检验：${p.inspector} | 结论：${getInspectionStatusText(p.conclusion)}`);
        if (failCount > 0) lines.push(`     ⚠ 异常参数 ${failCount} 项`);
      });
    } else {
      lines.push('  （无记录）');
    }
    lines.push('');

    lines.push(`【3. 成品抽检】`);
    if (traceInfo.finishedInspection) {
      const f = traceInfo.finishedInspection;
      const total = f.items?.length || 0;
      let qual = 0;
      f.items?.forEach((it: any) => {
        const ok = typeof it.isRecheckQualified === 'boolean' ? it.isRecheckQualified : it.isQualified;
        if (ok) qual++;
      });
      const allPass = qual === total && total > 0;
      lines.push(`  抽检数量：${f.sampleCount} 件 | 检验员：${f.inspector}`);
      lines.push(`  合格项：${qual}/${total} | 结论：${allPass ? '合格' : (qual < total && qual > 0 ? '部分合格' : f.conclusion === 'pending' ? '待检验' : '不合格')}`);
      f.items?.forEach((it: any, i: number) => {
        const finalOk = typeof it.isRecheckQualified === 'boolean' ? it.isRecheckQualified : it.isQualified;
        lines.push(`    ${i + 1}. ${it.name}：初检=${it.result || '未填'}${it.unit || ''}（标准：${it.standard}）${it.isQualified ? '✓' : '✗'}`);
        if (it.recheckResult) {
          lines.push(`       复检=${it.recheckResult}${it.unit || ''}（${it.rechecker || '复检人'}）${it.isRecheckQualified ? '✓' : '✗'}`);
        }
      });
    } else {
      lines.push('  （未抽检）');
    }
    lines.push('');

    lines.push(`【4. 问题整改】${traceInfo.rectifications?.length || 0} 条`);
    if (traceInfo.rectifications?.length) {
      traceInfo.rectifications.forEach((r: any, i: number) => {
        lines.push(`  ${i + 1}. ${r.title}`);
        lines.push(`     单号：${r.orderNo} | 责任人：${r.responsiblePerson}`);
        lines.push(`     状态：${getRectificationStatusText(r.status)}`);
        if (r.recheckResult) {
          lines.push(`     复查意见[${r.rechecker || '—'}]：${r.recheckResult}`);
        }
      });
    } else {
      lines.push('  （无异常）');
    }
    lines.push('');

    lines.push(`【5. 包装信息】`);
    if (traceInfo.packagingInfo) {
      const p = traceInfo.packagingInfo;
      lines.push(`  类型：${p.packageType} | 规格：${p.packageSpec}`);
      lines.push(`  时间：${formatDateTime(p.packageTime)} | 操作：${p.operator}`);
    } else {
      lines.push('  （未包装）');
    }
    lines.push('');

    lines.push(`【6. 出库信息】`);
    if (traceInfo.outboundInfo) {
      const o = traceInfo.outboundInfo;
      lines.push(`  单号：${o.outboundNo} | 数量：${o.quantity} 箱`);
      lines.push(`  目的地：${o.destination} | 收货人：${o.receiver}`);
      lines.push(`  出库时间：${formatDateTime(o.outboundTime)}`);
    } else {
      lines.push('  （未出库）');
    }
    lines.push('');
    lines.push(`报告生成时间：${formatDateTime(new Date().toISOString())}`);
    return lines.join('\n');
  };

  const handleCopyReport = () => {
    const text = buildReportText();
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({ title: '报告已复制', icon: 'success' });
      }
    });
  };

  const handleExportReport = () => {
    const text = buildReportText();
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showModal({
          title: '批次报告已复制',
          content: '报告文本已复制到剪贴板，可粘贴到微信/邮件等发给主管查看。',
          showCancel: false
        });
      }
    });
  };

  const hasUnqualifiedProcess = traceInfo?.processInspections?.some(
    (p: any) => p.conclusion === 'unqualified'
  );
  const hasRecheckProcess = traceInfo?.processInspections?.some(
    (p: any) => p.conclusion === 'recheck'
  );

  const finishedStats = useMemo(() => {
    if (!traceInfo?.finishedInspection) return null;
    const f = traceInfo.finishedInspection;
    const total = f.items?.length || 0;
    let qualified = 0;
    let unqualified = 0;
    let pending = 0;
    let hasRecheck = false;
    f.items?.forEach((it: any) => {
      if (it.recheckResult) hasRecheck = true;
      const finalOk = typeof it.isRecheckQualified === 'boolean' ? it.isRecheckQualified : it.isQualified;
      if (finalOk) {
        qualified++;
      } else if (it.result || it.recheckResult) {
        unqualified++;
      } else {
        pending++;
      }
    });
    const allPass = qualified === total && total > 0;
    let conclusionLabel: string;
    let dotColor: 'success' | 'error' | 'warning' | 'info';
    if (allPass) {
      conclusionLabel = '合格';
      dotColor = 'success';
    } else if (unqualified > 0) {
      conclusionLabel = pending > 0 ? '部分不合格' : '不合格';
      dotColor = 'error';
    } else {
      conclusionLabel = '待检验';
      dotColor = 'warning';
    }
    return {
      total,
      qualified,
      unqualified,
      pending,
      hasRecheck,
      allPass,
      conclusionLabel,
      dotColor,
      sampleCount: f.sampleCount
    };
  }, [traceInfo?.finishedInspection]);

  const hasFinishedRecheck = !!traceInfo?.finishedInspection?.items?.some(
    (it: any) => it.recheckResult
  );

  const renderTimelineStage = (key: ExpandedStage, icon: string, title: string, descNode: React.ReactNode, dotClass: string, contentNode: React.ReactNode) => {
    const isExpanded = expandedStage === key;
    return (
      <View className={styles.timelineItem}>
        <View className={classnames(styles.dot, dotClass)}></View>
        <View className={classnames(styles.stageCard, isExpanded && styles.expanded)}>
          <View className={styles.stageHeader} onClick={() => toggleStage(key)}>
            <View className={styles.stageIcon}>{icon}</View>
            <View className={styles.stageInfo}>
              <Text className={styles.stageTitle}>{title}</Text>
              <Text className={styles.stageDesc}>{descNode}</Text>
            </View>
            <Text className={classnames(styles.expandIcon, isExpanded && styles.expanded)}>▼</Text>
          </View>
          {isExpanded && (
            <View className={styles.stageContent}>
              {contentNode}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMaterialContent = () => {
    if (traceInfo.rawMaterials?.length > 0) {
      return traceInfo.rawMaterials.map((material: any, idx: number) => (
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
      ));
    }
    return <View className={styles.addEntry} onClick={goToAddAcceptance}>+ 新增原料验收记录</View>;
  };

  const renderProcessContent = () => {
    if (traceInfo.processInspections?.length > 0) {
      return traceInfo.processInspections.map((proc: any, idx: number) => (
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
      ));
    }
    return <View className={styles.addEntry} onClick={goToAddProcess}>+ 新增过程检查记录</View>;
  };

  const renderFinishedContent = () => {
    if (traceInfo.finishedInspection) {
      const f = traceInfo.finishedInspection;
      const total = f.items?.length || 0;
      let finalQualified = 0;
      let hasRecheck = false;
      f.items?.forEach((it: any) => {
        if (it.recheckResult) hasRecheck = true;
        const ok = typeof it.isRecheckQualified === 'boolean' ? it.isRecheckQualified : it.isQualified;
        if (ok) finalQualified++;
      });
      return (
        <>
          <View className={styles.contentSection}>
            <View className={styles.sectionTitle}>抽检概况</View>
            <View className={styles.paramList}>
              <View className={styles.paramItem}>
                <Text className={styles.paramName}>产品名称</Text>
                <Text className={styles.paramValue}>{f.productName}</Text>
              </View>
              <View className={styles.paramItem}>
                <Text className={styles.paramName}>抽检数量</Text>
                <Text className={styles.paramValue}>{f.sampleCount} 件</Text>
              </View>
              <View className={styles.paramItem}>
                <Text className={styles.paramName}>合格项数</Text>
                <Text className={classnames(styles.paramValue, finalQualified !== total && styles.fail)}>
                  {finalQualified}/{total}{hasRecheck ? '（含复检）' : ''}
                </Text>
              </View>
              <View className={styles.paramItem}>
                <Text className={styles.paramName}>检验员</Text>
                <Text className={styles.paramValue}>{f.inspector}</Text>
              </View>
              <View className={styles.paramItem}>
                <Text className={styles.paramName}>检验时间</Text>
                <Text className={styles.paramValue}>{formatDateTime(f.inspectionTime)}</Text>
              </View>
            </View>
          </View>
          <View className={styles.contentSection}>
            <View className={styles.sectionTitle}>检验项目</View>
            {f.items?.map((item: any, idx: number) => {
              const finalQualified = typeof item.isRecheckQualified === 'boolean'
                ? item.isRecheckQualified
                : item.isQualified;
              return (
                <View key={idx} className={styles.itemCard}>
                  <View className={styles.itemHeader}>
                    <Text className={styles.itemName}>{item.name}</Text>
                    <StatusTag
                      text={finalQualified ? '合格' : '不合格'}
                      type={finalQualified ? 'success' : 'error'}
                    />
                  </View>
                  <Text className={styles.itemDetail}>标准：{item.standard}</Text>
                  <Text className={classnames(styles.itemResult, !item.isQualified && styles.fail)}>
                    初检：{item.result || '未填写'}
                  </Text>
                  {item.recheckResult && (
                    <>
                      <Text className={classnames(styles.itemResult, !item.isRecheckQualified && styles.fail)} style={{ marginTop: 8 }}>
                        复检：{item.recheckResult}（{item.rechecker || '复检人'} · {formatDateTime(item.recheckTime, 'MM-DD HH:mm') || '—'}）
                      </Text>
                    </>
                  )}
                </View>
              );
            })}
          </View>
          {f.remark && (
            <View className={styles.contentSection}>
              <View className={styles.sectionTitle}>备注</View>
              <Text style={{ fontSize: 24, color: '#4E5969' }}>{f.remark}</Text>
            </View>
          )}
        </>
      );
    }
    return <View className={styles.addEntry} onClick={goToAddFinished}>+ 新增成品抽检记录</View>;
  };

  const renderRectificationContent = () => {
    if (traceInfo.rectifications?.length > 0) {
      return traceInfo.rectifications.map((rect: any, idx: number) => (
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
                text={getRectificationStatusText(rect.status)}
                type={rect.status === 'pending' ? 'warning' : rect.status === 'processing' ? 'info' : rect.status === 'rechecking' ? 'primary' : rect.status === 'completed' ? 'success' : 'gray'}
              />
            </View>
            {rect.recheckResult && (
              <>
                <View className={styles.paramItem}>
                  <Text className={styles.paramName}>复查结论</Text>
                  <StatusTag
                    text={rect.recheckConclusion === 'pass' ? '复查通过' : '复查不通过'}
                    type={rect.recheckConclusion === 'pass' ? 'success' : 'error'}
                  />
                </View>
                <View className={styles.paramItem}>
                  <Text className={styles.paramName}>复查人</Text>
                  <Text className={styles.paramValue}>{rect.rechecker || '—'}</Text>
                </View>
                <View className={styles.paramItem}>
                  <Text className={styles.paramName}>复查意见</Text>
                  <Text className={styles.paramValue} style={{ textAlign: 'right' }}>{rect.recheckResult}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      ));
    }
    return <View className={styles.addEntry} onClick={goToAddRectification}>+ 创建整改单</View>;
  };

  const renderPackagingContent = () => {
    if (traceInfo.packagingInfo) {
      const p = traceInfo.packagingInfo;
      return (
        <View className={styles.contentSection}>
          <View className={styles.paramList}>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>包装类型</Text>
              <Text className={styles.paramValue}>{p.packageType}</Text>
            </View>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>包装规格</Text>
              <Text className={styles.paramValue}>{p.packageSpec}</Text>
            </View>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>包装时间</Text>
              <Text className={styles.paramValue}>{formatDateTime(p.packageTime)}</Text>
            </View>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>操作人员</Text>
              <Text className={styles.paramValue}>{p.operator}</Text>
            </View>
          </View>
        </View>
      );
    }
    return <View className={styles.contentSection}><Text style={{ fontSize: 24, color: '#86909C' }}>暂无包装信息</Text></View>;
  };

  const renderOutboundContent = () => {
    if (traceInfo.outboundInfo) {
      const o = traceInfo.outboundInfo;
      return (
        <View className={styles.contentSection}>
          <View className={styles.paramList}>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>出库单号</Text>
              <Text className={styles.paramValue}>{o.outboundNo}</Text>
            </View>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>出库时间</Text>
              <Text className={styles.paramValue}>{formatDateTime(o.outboundTime)}</Text>
            </View>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>目的地</Text>
              <Text className={styles.paramValue}>{o.destination}</Text>
            </View>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>收货人</Text>
              <Text className={styles.paramValue}>{o.receiver}</Text>
            </View>
            <View className={styles.paramItem}>
              <Text className={styles.paramName}>出库数量</Text>
              <Text className={styles.paramValue}>{o.quantity} 箱</Text>
            </View>
          </View>
        </View>
      );
    }
    return <View className={styles.contentSection}><Text style={{ fontSize: 24, color: '#86909C' }}>暂未出库</Text></View>;
  };

  const renderReportSection = (stage: StageComplete, renderBody: () => React.ReactNode) => {
    const isExpanded = expandedReport === stage.key;
    return (
      <View className={classnames(styles.reportSection, isExpanded && styles.expanded)}>
        <View className={styles.reportHeader} onClick={() => toggleStage(stage.key)}>
          <Text className={styles.reportIcon}>{stage.icon}</Text>
          <View className={styles.reportTitleBox}>
            <Text className={styles.reportTitle}>{stage.label}</Text>
            <Text className={styles.reportDesc}>{stage.summary}</Text>
          </View>
          {stage.hasData ? (
            <Text className={styles.reportStatusOk}>✓</Text>
          ) : stage.addEntry ? (
            <Text className={styles.reportStatusMiss} onClick={(e) => { e.stopPropagation(); stage.addEntry && stage.addEntry(); }}>+ 补录</Text>
          ) : (
            <Text className={styles.reportStatusNone}>—</Text>
          )}
          <Text className={classnames(styles.expandIcon, isExpanded && styles.expanded)}>▼</Text>
        </View>
        {isExpanded && <View className={styles.reportBody}>{renderBody()}</View>}
      </View>
    );
  };

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

            <View className={styles.completenessCard}>
              <View className={styles.compHeader}>
                <Text className={styles.compTitle}>📊 数据完整度</Text>
                <Text className={styles.compPercent}>{completenessPercent}%</Text>
              </View>
              <View className={styles.compBar}>
                <View className={styles.compBarFill} style={{ width: `${completenessPercent}%` }}></View>
              </View>
              <View className={styles.compGrid}>
                {stageCompleteness.map((stage) => (
                  <View
                    key={stage.key}
                    className={classnames(styles.compNode, stage.hasData && styles.hasData, !stage.hasData && stage.addEntry && styles.canAdd)}
                    onClick={() => { if (!stage.hasData && stage.addEntry) stage.addEntry(); }}
                  >
                    <Text className={styles.compIcon}>{stage.icon}</Text>
                    <Text className={styles.compLabel}>{stage.label}</Text>
                    <Text className={classnames(styles.compDot, stage.hasData ? styles.ok : styles.miss)}>
                      {stage.hasData ? '✓' : stage.addEntry ? '+' : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.modeSwitch}>
              <View
                className={classnames(styles.modeTab, viewMode === 'timeline' && styles.active)}
                onClick={() => setViewMode('timeline')}
              >
                🕒 时间线
              </View>
              <View
                className={classnames(styles.modeTab, viewMode === 'report' && styles.active)}
                onClick={() => setViewMode('report')}
              >
                📄 批次报告
              </View>
            </View>

            {viewMode === 'report' && (
              <View className={styles.reportActions}>
                <Button className={styles.reportBtn} onClick={handleCopyReport}>📋 复制报告</Button>
                <Button className={classnames(styles.reportBtn, styles.primary)} onClick={handleExportReport}>📤 导出给主管</Button>
              </View>
            )}

            {viewMode === 'timeline' ? (
              <View className={styles.timeline}>
                {renderTimelineStage(
                  'material',
                  '📦',
                  '原料验收',
                  <>
                    {traceInfo.rawMaterials?.length || 0} 种原料
                    {traceInfo.rawMaterials?.length > 0 &&
                      (traceInfo.rawMaterials.every((m: any) => m.conclusion === 'qualified')
                        ? ' · 全部合格'
                        : ' · 存在异常')}
                  </>,
                  traceInfo.rawMaterials?.length > 0
                    ? traceInfo.rawMaterials.every((m: any) => m.conclusion === 'qualified')
                      ? 'success'
                      : 'warning'
                    : 'info',
                  renderMaterialContent()
                )}

                {renderTimelineStage(
                  'process',
                  '🔧',
                  '过程检查',
                  <>
                    {traceInfo.processInspections?.length || 0} 道工序
                    {traceInfo.processInspections?.length > 0 &&
                      (hasUnqualifiedProcess
                        ? ' · 存在不合格'
                        : hasRecheckProcess
                          ? ' · 待复检'
                          : ' · 全部合格')}
                  </>,
                  traceInfo.processInspections?.length > 0
                    ? hasUnqualifiedProcess
                      ? 'error'
                      : hasRecheckProcess
                        ? 'warning'
                        : 'success'
                    : 'info',
                  renderProcessContent()
                )}

                {renderTimelineStage(
                  'finished',
                  '✅',
                  '成品抽检',
                  finishedStats
                    ? `抽检 ${finishedStats.sampleCount} 件 · ${finishedStats.conclusionLabel}${finishedStats.hasRecheck ? '（含复检）' : ''}`
                    : '未抽检',
                  finishedStats ? finishedStats.dotColor : 'info',
                  renderFinishedContent()
                )}

                {renderTimelineStage(
                  'rectification',
                  '⚠️',
                  '问题整改',
                  <>
                    {traceInfo.rectifications?.length || 0} 条整改记录
                    {traceInfo.rectifications?.length > 0 &&
                      (traceInfo.rectifications.some((r: any) => r.status === 'completed')
                        ? ' · 部分已完成'
                        : ' · 进行中')}
                  </>,
                  traceInfo.rectifications?.length > 0 ? 'warning' : 'info',
                  renderRectificationContent()
                )}

                {renderTimelineStage(
                  'packaging',
                  '📦',
                  '包装信息',
                  traceInfo.packagingInfo ? traceInfo.packagingInfo.packageType : '未包装',
                  traceInfo.packagingInfo ? 'success' : 'info',
                  renderPackagingContent()
                )}

                {renderTimelineStage(
                  'outbound',
                  '🚚',
                  '出库信息',
                  traceInfo.outboundInfo ? `${traceInfo.outboundInfo.destination} · ${traceInfo.outboundInfo.quantity}箱` : '未出库',
                  traceInfo.outboundInfo ? 'success' : 'info',
                  renderOutboundContent()
                )}
              </View>
            ) : (
              <View className={styles.reportWrap}>
                {renderReportSection(stageCompleteness[0], renderMaterialContent)}
                {renderReportSection(stageCompleteness[1], renderProcessContent)}
                {renderReportSection(stageCompleteness[2], renderFinishedContent)}
                {renderReportSection(stageCompleteness[3], renderRectificationContent)}
                {renderReportSection(stageCompleteness[4], renderPackagingContent)}
                {renderReportSection(stageCompleteness[5], renderOutboundContent)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default TracePage;
