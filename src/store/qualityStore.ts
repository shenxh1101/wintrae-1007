import { create } from 'zustand';
import type {
  RawMaterialAcceptance,
  ProcessInspection,
  FinishedProductInspection,
  RectificationOrder,
  ScanRecord,
  InspectionStatus,
  RectificationStatus
} from '@/types/quality';
import { generateId, generateOrderNo } from '@/utils/format';
import { mockAcceptanceList } from '@/data/acceptance';
import { mockProcessInspectionList, mockFinishedInspectionList } from '@/data/inspection';
import { mockRectificationList } from '@/data/rectification';
import { mockScanRecords, mockTraceInfo } from '@/data/trace';

interface QualityState {
  scanRecords: ScanRecord[];
  acceptanceList: RawMaterialAcceptance[];
  processInspectionList: ProcessInspection[];
  finishedInspectionList: FinishedProductInspection[];
  rectificationList: RectificationOrder[];

  addScanRecord: (batchNo: string, productName: string) => void;
  addAcceptance: (data: Omit<RawMaterialAcceptance, 'id' | 'inspectionTime'>) => void;
  addProcessInspection: (data: Omit<ProcessInspection, 'id' | 'inspectionTime'>) => void;
  addFinishedInspection: (data: Omit<FinishedProductInspection, 'id' | 'inspectionTime'>) => void;
  addRectification: (data: Omit<RectificationOrder, 'id' | 'orderNo' | 'createTime' | 'status' | 'createdAt'>) => void;
  updateRectificationStatus: (id: string, status: RectificationStatus, extra?: Partial<RectificationOrder>) => void;
  getRectificationById: (id: string) => RectificationOrder | undefined;

  getAcceptanceByBatch: (batchNo: string) => RawMaterialAcceptance[];
  getProcessByBatch: (batchNo: string) => ProcessInspection[];
  getFinishedByBatch: (batchNo: string) => FinishedProductInspection | undefined;
  getRectificationByBatch: (batchNo: string) => RectificationOrder[];

  getTraceInfo: (batchNo: string) => any;
}

const productNames: Record<string, string> = {
  'B202406100123': '原味酸奶',
  'B202406090088': '草莓酸奶',
  'B202406080056': '巧克力奶',
  'B202406070101': '原味纯牛奶',
  'B202406100124': '白砂糖',
  'B202406090089': '全脂乳粉',
  'B202406070102': '香蕉牛奶'
};

export const useQualityStore = create<QualityState>((set, get) => ({
  scanRecords: [...mockScanRecords],
  acceptanceList: [...mockAcceptanceList],
  processInspectionList: [...mockProcessInspectionList],
  finishedInspectionList: [...mockFinishedInspectionList],
  rectificationList: [...mockRectificationList],

  addScanRecord: (batchNo: string, productName: string) => {
    const records = get().scanRecords;
    const existIndex = records.findIndex(r => r.batchNo === batchNo);
    const newRecord: ScanRecord = {
      id: generateId(),
      batchNo,
      scanTime: new Date().toISOString(),
      productName: productName || productNames[batchNo] || '未知产品'
    };
    if (existIndex > -1) {
      const updated = [...records];
      updated.splice(existIndex, 1);
      set({ scanRecords: [newRecord, ...updated].slice(0, 20) });
    } else {
      set({ scanRecords: [newRecord, ...records].slice(0, 20) });
    }
  },

  addAcceptance: (data) => {
    const newItem: RawMaterialAcceptance = {
      ...data,
      id: generateId(),
      inspectionTime: new Date().toISOString()
    };
    set(state => ({
      acceptanceList: [newItem, ...state.acceptanceList]
    }));
    const productName = productNames[data.batchNo] || data.materialName;
    get().addScanRecord(data.batchNo, productName);
  },

  addProcessInspection: (data) => {
    const newItem: ProcessInspection = {
      ...data,
      id: generateId(),
      inspectionTime: new Date().toISOString()
    };
    set(state => ({
      processInspectionList: [newItem, ...state.processInspectionList]
    }));
    const productName = productNames[data.batchNo] || '产品';
    get().addScanRecord(data.batchNo, productName);
  },

  addFinishedInspection: (data) => {
    const newItem: FinishedProductInspection = {
      ...data,
      id: generateId(),
      inspectionTime: new Date().toISOString()
    };
    set(state => ({
      finishedInspectionList: [newItem, ...state.finishedInspectionList]
    }));
    const productName = productNames[data.batchNo] || data.productName;
    get().addScanRecord(data.batchNo, productName);
  },

  addRectification: (data) => {
    const newItem: RectificationOrder = {
      ...data,
      id: generateId(),
      orderNo: generateOrderNo('ZG'),
      createTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    set(state => ({
      rectificationList: [newItem, ...state.rectificationList]
    }));
  },

  updateRectificationStatus: (id, status, extra = {}) => {
    set(state => ({
      rectificationList: state.rectificationList.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status,
            ...extra
          };
        }
        return item;
      })
    }));
  },

  getRectificationById: (id) => {
    return get().rectificationList.find(r => r.id === id);
  },

  getAcceptanceByBatch: (batchNo) => {
    return get().acceptanceList.filter(a => a.batchNo === batchNo);
  },

  getProcessByBatch: (batchNo) => {
    return get().processInspectionList.filter(p => p.batchNo === batchNo);
  },

  getFinishedByBatch: (batchNo) => {
    return get().finishedInspectionList.find(f => f.batchNo === batchNo);
  },

  getRectificationByBatch: (batchNo) => {
    return get().rectificationList.filter(r => r.batchNo === batchNo);
  },

  getTraceInfo: (batchNo) => {
    const acceptance = get().getAcceptanceByBatch(batchNo);
    const processList = get().getProcessByBatch(batchNo);
    const finished = get().getFinishedByBatch(batchNo);
    const rectifications = get().getRectificationByBatch(batchNo);

    if (acceptance.length === 0 && processList.length === 0 && !finished) {
      return null;
    }

    const productName = finished?.productName
      || acceptance[0]?.materialName
      || productNames[batchNo]
      || '未知产品';

    return {
      batchNo,
      productName,
      productSpec: finished?.productName ? '标准包装' : '标准规格',
      productionDate: finished?.inspectionTime
        ? new Date(finished.inspectionTime).toISOString().split('T')[0]
        : acceptance[0]?.arrivalTime
          ? new Date(acceptance[0].arrivalTime).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      quantity: finished?.sampleCount || 0,
      rawMaterials: acceptance,
      processInspections: processList,
      finishedInspection: finished,
      rectifications,
      packagingInfo: finished ? {
        packageType: '盒装',
        packageSpec: '标准规格',
        packageTime: finished.inspectionTime,
        operator: '自动包装线'
      } : undefined,
      outboundInfo: undefined
    };
  }
}));
