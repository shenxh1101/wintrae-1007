import dayjs from 'dayjs';
import type { InspectionStatus, RectificationStatus, SourceType, LevelType } from '@/types/quality';

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const getInspectionStatusText = (status: InspectionStatus): string => {
  const map: Record<InspectionStatus, string> = {
    pending: '待检验',
    qualified: '合格',
    unqualified: '不合格',
    recheck: '待复检'
  };
  return map[status];
};

export const getInspectionStatusColor = (status: InspectionStatus): string => {
  const map: Record<InspectionStatus, string> = {
    pending: '#FF7D00',
    qualified: '#00B42A',
    unqualified: '#F53F3F',
    recheck: '#165DFF'
  };
  return map[status];
};

export const getRectificationStatusText = (status: RectificationStatus): string => {
  const map: Record<RectificationStatus, string> = {
    pending: '待处理',
    processing: '整改中',
    rechecking: '待复查',
    completed: '已完成',
    closed: '已关闭'
  };
  return map[status];
};

export const getRectificationStatusColor = (status: RectificationStatus): string => {
  const map: Record<RectificationStatus, string> = {
    pending: '#FF7D00',
    processing: '#165DFF',
    rechecking: '#722ED1',
    completed: '#00B42A',
    closed: '#86909C'
  };
  return map[status];
};

export const getLevelText = (level: LevelType): string => {
  const map: Record<LevelType, string> = {
    low: '一般',
    medium: '中等',
    high: '严重',
    critical: '紧急'
  };
  return map[level];
};

export const getLevelColor = (level: LevelType): string => {
  const map: Record<LevelType, string> = {
    low: '#165DFF',
    medium: '#FF9F43',
    high: '#F53F3F',
    critical: '#F53F3F'
  };
  return map[level];
};

export const getSourceTypeText = (type: SourceType): string => {
  const map: Record<SourceType, string> = {
    raw_material: '原料验收',
    process: '过程检查',
    finished: '成品抽检',
    customer: '客诉反馈',
    audit: '内审发现'
  };
  return map[type];
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const generateBatchNo = (): string => {
  const now = dayjs();
  const dateStr = now.format('YYYYMMDD');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `B${dateStr}${random}`;
};

export const generateOrderNo = (prefix: string): string => {
  const now = dayjs();
  const dateStr = now.format('YYYYMMDD');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${dateStr}${random}`;
};

export type JudgeResult = 'qualified' | 'unqualified' | 'pending' | 'uncertain';

const SENSORY_QUALIFIED_KEYWORDS = [
  '合格', '正常', '符合', '良好', '优', '良', '好', '无异常', '无异',
  '无异味', '无杂质', '无破损', '无变形', '正常色泽', '色泽正常',
  '口感正常', '气味正常', '外观正常', '合格。', '正常。'
];
const SENSORY_UNQUALIFIED_KEYWORDS = [
  '不合格', '异常', '异味', '杂质', '破损', '变形', '变色', '发霉',
  '变质', '酸败', '结块', '潮', '不合格。', '异常。', '有异味', '有杂质'
];

const isEmptyResult = (result: string): boolean => {
  if (!result) return true;
  const trimmed = result.trim();
  if (trimmed === '') return true;
  if (/^[—\-–_·\.。]+$/.test(trimmed)) return true;
  if (/^(未检|待检|待检测|未填写|未填|无结果|暂无)$/i.test(trimmed)) return true;
  return false;
};

const tryParseNumber = (val: string): number | null => {
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  return num;
};

export const judgeInspectionItem = (standard: string, result: string): JudgeResult => {
  const std = standard?.trim() || '';
  const res = result?.trim() || '';

  if (isEmptyResult(res)) return 'pending';
  if (!std) return 'uncertain';

  const resNum = tryParseNumber(res);

  const rangeMatch = std.match(/([\d.]+)\s*[~～\-–到至]\s*([\d.]+)/);
  if (rangeMatch && resNum !== null) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return resNum >= min && resNum <= max ? 'qualified' : 'unqualified';
  }

  if ((std.includes('≤') || std.includes('<=')) && resNum !== null) {
    const m = std.match(/([<≤]=?)\s*([\d.]+)/);
    if (m) {
      const stdNum = parseFloat(m[2]);
      const hasEqual = m[1].includes('=') || m[1].includes('≤');
      if (hasEqual) {
        return resNum <= stdNum ? 'qualified' : 'unqualified';
      } else {
        return resNum < stdNum ? 'qualified' : 'unqualified';
      }
    }
  }

  if ((std.includes('≥') || std.includes('>=')) && resNum !== null) {
    const m = std.match(/([>≥]=?)\s*([\d.]+)/);
    if (m) {
      const stdNum = parseFloat(m[2]);
      const hasEqual = m[1].includes('=') || m[1].includes('≥');
      if (hasEqual) {
        return resNum >= stdNum ? 'qualified' : 'unqualified';
      } else {
        return resNum > stdNum ? 'qualified' : 'unqualified';
      }
    }
  }

  if (std.includes('±') && resNum !== null) {
    const m = std.match(/([\d.]+)\s*[±+]\s*([\d.]+)/);
    if (m) {
      const base = parseFloat(m[1]);
      const tolerance = parseFloat(m[2]);
      return Math.abs(resNum - base) <= tolerance ? 'qualified' : 'unqualified';
    }
    const m2 = std.match(/[±+]\s*([\d.]+)/);
    if (m2 && resNum !== null) {
      const tolerance = parseFloat(m2[1]);
      return resNum <= tolerance ? 'qualified' : 'unqualified';
    }
  }

  if (/^(合格|正常|符合要求|达标)$/.test(std)) {
    for (const kw of SENSORY_QUALIFIED_KEYWORDS) {
      if (res.includes(kw)) return 'qualified';
    }
    for (const kw of SENSORY_UNQUALIFIED_KEYWORDS) {
      if (res.includes(kw)) return 'unqualified';
    }
    return 'uncertain';
  }

  if (/^[<≤≥>=±\-~～\d.\s]+$/.test(std) && resNum === null) {
    return 'uncertain';
  }

  if (resNum !== null) {
    const onlyNum = std.match(/^[\d.]+$/);
    if (onlyNum) return 'uncertain';
  }

  const lowerStd = std.toLowerCase();
  const lowerRes = res.toLowerCase();
  if (lowerStd && lowerRes && lowerStd === lowerRes) return 'qualified';

  return 'uncertain';
};

export const computeInspectionConclusion = (
  items: { isQualified: boolean; isRecheckQualified?: boolean; result?: string; recheckResult?: string }[]
): InspectionStatus => {
  if (!items || items.length === 0) return 'pending';
  let hasFail = false;
  let hasPending = false;
  items.forEach(it => {
    const finalOk = typeof it.isRecheckQualified === 'boolean' ? it.isRecheckQualified : it.isQualified;
    if (finalOk) return;
    const finalResult = it.recheckResult || it.result || '';
    if (isEmptyResult(finalResult)) {
      hasPending = true;
    } else {
      hasFail = true;
    }
  });
  if (hasFail) return 'unqualified';
  if (hasPending) return 'pending';
  return 'qualified';
};

export const getItemFinalQualified = (item: {
  isQualified: boolean;
  isRecheckQualified?: boolean;
}): boolean => {
  if (typeof item.isRecheckQualified === 'boolean') return item.isRecheckQualified;
  return item.isQualified;
};

