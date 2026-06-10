import dayjs from 'dayjs';
import type { InspectionStatus, RectificationStatus } from '@/types/quality';

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

export const getLevelText = (level: 'general' | 'important' | 'critical'): string => {
  const map = {
    general: '一般',
    important: '重要',
    critical: '严重'
  };
  return map[level];
};

export const getLevelColor = (level: 'general' | 'important' | 'critical'): string => {
  const map = {
    general: '#165DFF',
    important: '#FF7D00',
    critical: '#F53F3F'
  };
  return map[level];
};

export const getSourceTypeText = (type: 'material' | 'process' | 'finished'): string => {
  const map = {
    material: '原料验收',
    process: '过程检查',
    finished: '成品抽检'
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
