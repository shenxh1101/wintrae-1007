export type InspectionStatus = 'pending' | 'qualified' | 'unqualified' | 'recheck';

export type RectificationStatus = 'pending' | 'processing' | 'rechecking' | 'completed' | 'closed';

export interface BatchInfo {
  batchNo: string;
  productName: string;
  productSpec: string;
  productionDate: string;
  quantity: number;
  workshop: string;
  productionLine: string;
}

export interface RawMaterialAcceptance {
  id: string;
  batchNo: string;
  materialName: string;
  materialSpec: string;
  supplier: string;
  arrivalTime: string;
  arrivalTemp: number;
  quantity: number;
  unit: string;
  inspector: string;
  inspectionTime: string;
  conclusion: InspectionStatus;
  remark: string;
  photos: string[];
}

export interface ProcessInspection {
  id: string;
  batchNo: string;
  processName: string;
  processIndex: number;
  operator: string;
  inspector: string;
  inspectionTime: string;
  parameters: {
    name: string;
    value: string;
    unit: string;
    standard: string;
    isQualified: boolean;
  }[];
  conclusion: InspectionStatus;
  remark: string;
}

export interface FinishedProductInspection {
  id: string;
  batchNo: string;
  productName: string;
  productSpec?: string;
  sampleCount: number;
  inspector: string;
  inspectionTime: string;
  items: {
    name: string;
    standard: string;
    result: string;
    unit?: string;
    method?: string;
    isQualified: boolean;
  }[];
  conclusion: InspectionStatus;
  remark: string;
}

export type SourceType = 'raw_material' | 'process' | 'finished' | 'customer' | 'audit';
export type LevelType = 'low' | 'medium' | 'high' | 'critical';

export interface RectificationOrder {
  id: string;
  orderNo: string;
  title: string;
  batchNo: string;
  sourceType: SourceType;
  description: string;
  level: LevelType;
  creator?: string;
  createTime?: string;
  createdAt?: string;
  responsiblePerson: string;
  deadline: string;
  status: RectificationStatus;
  processContent?: string;
  processStartTime?: string;
  submitRecheckContent?: string;
  submitRecheckTime?: string;
  recheckResult?: string;
  recheckTime?: string;
  rechecker?: string;
  recheckConclusion?: 'pass' | 'fail';
  remark?: string;
  photos?: string[];
}

export interface TraceInfo {
  batchNo: string;
  productName: string;
  productSpec: string;
  productionDate: string;
  quantity: number;
  rawMaterials: RawMaterialAcceptance[];
  processInspections: ProcessInspection[];
  finishedInspection?: FinishedProductInspection;
  packagingInfo?: {
    packageType: string;
    packageSpec: string;
    packageTime: string;
    operator: string;
  };
  outboundInfo?: {
    outboundNo: string;
    outboundTime: string;
    destination: string;
    receiver: string;
    quantity: number;
  };
}

export interface ScanRecord {
  id: string;
  batchNo: string;
  scanTime: string;
  productName: string;
}
