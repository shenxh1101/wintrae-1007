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
  updateFinishedInspection: (id: string, patch: Partial<FinishedProductInspection> & { items?: FinishedProductInspection['items'] }) => void;
  addRectification: (data: Omit<RectificationOrder, 'id' | 'orderNo' | 'createTime' | 'status' | 'createdAt'>) => void;
  updateRectificationStatus: (id: string, status: RectificationStatus, extra?: Partial<RectificationOrder>) => void;
  getRectificationById: (id: string) => RectificationOrder | undefined;

  getAcceptanceByBatch: (batchNo: string) => RawMaterialAcceptance[];
  getProcessByBatch: (batchNo: string) => ProcessInspection[];
  getFinishedByBatch: (batchNo: string) => FinishedProductInspection | undefined;
  getRectificationByBatch: (batchNo: string) => RectificationOrder[];

  getTraceInfo: (batchNo: string) => any;
}

const packagingData: Record<string, { packageType: string; packageSpec: string; packageTime: string; operator: string }> = {
  'B202406100123': { packageType: '纸盒装', packageSpec: '250g/盒 × 24盒/箱', packageTime: '2024-06-10T18:00:00.000Z', operator: '钱包装' },
  'B202406090088': { packageType: '纸盒装', packageSpec: '200g/盒 × 24盒/箱', packageTime: '2024-06-09T18:30:00.000Z', operator: '孙包装' },
  'B202406080056': { packageType: '利乐包', packageSpec: '250ml/盒 × 24盒/箱', packageTime: '2024-06-08T17:30:00.000Z', operator: '钱包装' },
  'B202406070101': { packageType: '利乐包', packageSpec: '250ml/盒 × 24盒/箱', packageTime: '2024-06-07T17:30:00.000Z', operator: '赵包装' },
  'B202406070102': { packageType: '塑料瓶装', packageSpec: '300ml/瓶 × 24瓶/箱', packageTime: '2024-06-07T16:00:00.000Z', operator: '孙包装' }
};

const outboundData: Record<string, { outboundNo: string; outboundTime: string; destination: string; receiver: string; quantity: number }> = {
  'B202406100123': { outboundNo: 'CK20240610001', outboundTime: '2024-06-11T08:30:00.000Z', destination: '上海家乐福超市', receiver: '王经理', quantity: 200 },
  'B202406090088': { outboundNo: 'CK20240609002', outboundTime: '2024-06-10T09:00:00.000Z', destination: '北京物美超市', receiver: '刘经理', quantity: 150 },
  'B202406070101': { outboundNo: 'CK20240607001', outboundTime: '2024-06-08T08:00:00.000Z', destination: '广州永辉超市', receiver: '陈经理', quantity: 300 },
  'B202406070102': { outboundNo: 'CK20240607003', outboundTime: '2024-06-08T10:00:00.000Z', destination: '深圳华润万家', receiver: '张经理', quantity: 120 }
};

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

  updateFinishedInspection: (id, patch) => {
    set(state => ({
      finishedInspectionList: state.finishedInspectionList.map(item => {
        if (item.id === id) {
          return { ...item, ...patch };
        }
        return item;
      })
    }));
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
    const list = get().finishedInspectionList.filter(f => f.batchNo === batchNo);
    return list.length > 0 ? list[0] : undefined;
  },

  getRectificationByBatch: (batchNo) => {
    return get().rectificationList.filter(r => r.batchNo === batchNo);
  },

  getTraceInfo: (batchNo) => {
    const acceptance = get().getAcceptanceByBatch(batchNo);
    const processList = get().getProcessByBatch(batchNo);
    const finished = get().getFinishedByBatch(batchNo);
    const rectifications = get().getRectificationByBatch(batchNo);
    const packaging = packagingData[batchNo];
    const outbound = outboundData[batchNo];

    if (acceptance.length === 0 && processList.length === 0 && !finished && !packaging && !outbound) {
      return null;
    }

    const productName = finished?.productName
      || acceptance[0]?.materialName
      || productNames[batchNo]
      || '未知产品';

    return {
      batchNo,
      productName,
      productSpec: finished?.productSpec || (finished?.productName ? '标准包装' : '标准规格'),
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
      packagingInfo: packaging,
      outboundInfo: outbound
    };
  }
}));
