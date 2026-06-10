import type { TraceInfo, ScanRecord } from '@/types/quality';

export const mockTraceInfo: TraceInfo = {
  batchNo: 'B202406100123',
  productName: '原味酸奶',
  productSpec: '250g/盒',
  productionDate: '2024-06-10',
  quantity: 5000,
  rawMaterials: [
    {
      id: 'acc001',
      batchNo: 'B202406100123',
      materialName: '鲜牛奶',
      materialSpec: '25L/桶',
      supplier: '内蒙古蒙牛乳业股份有限公司',
      arrivalTime: '2024-06-10 08:30',
      arrivalTemp: 4.2,
      quantity: 50,
      unit: '桶',
      inspector: '张质检',
      inspectionTime: '2024-06-10 09:15',
      conclusion: 'qualified',
      remark: '原料新鲜，温度符合要求，验收通过',
      photos: ['https://picsum.photos/id/292/300/300']
    },
    {
      id: 'acc002',
      batchNo: 'B202406100123',
      materialName: '白砂糖',
      materialSpec: '50kg/袋',
      supplier: '广西南宁糖业集团',
      arrivalTime: '2024-06-10 09:45',
      arrivalTemp: 25.8,
      quantity: 20,
      unit: '袋',
      inspector: '李质检',
      inspectionTime: '2024-06-10 10:30',
      conclusion: 'qualified',
      remark: '包装完好，质量合格',
      photos: ['https://picsum.photos/id/431/300/300']
    }
  ],
  processInspections: [
    {
      id: 'proc001',
      batchNo: 'B202406100123',
      processName: '原料预处理',
      processIndex: 1,
      operator: '李师傅',
      inspector: '张质检',
      inspectionTime: '2024-06-10 10:00',
      parameters: [
        { name: '投料温度', value: '4.5', unit: '℃', standard: '2-6℃', isQualified: true },
        { name: '搅拌速度', value: '60', unit: 'rpm', standard: '50-70rpm', isQualified: true },
        { name: '静置时间', value: '30', unit: 'min', standard: '20-40min', isQualified: true }
      ],
      conclusion: 'qualified',
      remark: '各项参数正常，符合工艺要求'
    },
    {
      id: 'proc002',
      batchNo: 'B202406100123',
      processName: '杀菌处理',
      processIndex: 2,
      operator: '王师傅',
      inspector: '张质检',
      inspectionTime: '2024-06-10 10:45',
      parameters: [
        { name: '杀菌温度', value: '85', unit: '℃', standard: '82-88℃', isQualified: true },
        { name: '保温时间', value: '15', unit: 's', standard: '12-18s', isQualified: true },
        { name: '出口温度', value: '18', unit: '℃', standard: '15-20℃', isQualified: true }
      ],
      conclusion: 'qualified',
      remark: '杀菌效果良好'
    },
    {
      id: 'proc003',
      batchNo: 'B202406100123',
      processName: '发酵工序',
      processIndex: 3,
      operator: '赵师傅',
      inspector: '李质检',
      inspectionTime: '2024-06-10 14:30',
      parameters: [
        { name: '发酵温度', value: '42', unit: '℃', standard: '40-44℃', isQualified: true },
        { name: '发酵时间', value: '6', unit: 'h', standard: '5-7h', isQualified: true },
        { name: '酸度', value: '75', unit: '°T', standard: '70-85°T', isQualified: true }
      ],
      conclusion: 'qualified',
      remark: '发酵状态良好'
    },
    {
      id: 'proc004',
      batchNo: 'B202406100123',
      processName: '冷却灌装',
      processIndex: 4,
      operator: '孙师傅',
      inspector: '李质检',
      inspectionTime: '2024-06-10 16:00',
      parameters: [
        { name: '冷却温度', value: '6', unit: '℃', standard: '2-8℃', isQualified: true },
        { name: '灌装量', value: '250', unit: 'g', standard: '245-255g', isQualified: true },
        { name: '封口温度', value: '180', unit: '℃', standard: '170-190℃', isQualified: false }
      ],
      conclusion: 'unqualified',
      remark: '封口温度偏高，需要调整设备参数'
    }
  ],
  finishedInspection: {
    id: 'fin001',
    batchNo: 'B202406100123',
    productName: '原味酸奶',
    sampleCount: 20,
    inspector: '张质检',
    inspectionTime: '2024-06-10 17:30',
    items: [
      { name: '感官指标', standard: '色泽均匀，无异味', result: '色泽乳白，香气纯正', isQualified: true },
      { name: '蛋白质含量', standard: '≥2.9%', result: '3.2%', isQualified: true },
      { name: '脂肪含量', standard: '≥3.1%', result: '3.5%', isQualified: true },
      { name: '酸度', standard: '70-110°T', result: '85°T', isQualified: true },
      { name: '乳酸菌数', standard: '≥1×10⁶CFU/g', result: '2.5×10⁷CFU/g', isQualified: true },
      { name: '大肠菌群', standard: '≤10MPN/100g', result: '＜3MPN/100g', isQualified: true },
      { name: '净含量偏差', standard: '±3%', result: '+1.2%', isQualified: true }
    ],
    conclusion: 'qualified',
    remark: '各项指标均符合标准，产品质量优良'
  },
  packagingInfo: {
    packageType: '纸盒装',
    packageSpec: '250g/盒 × 24盒/箱',
    packageTime: '2024-06-10 18:00',
    operator: '钱包装'
  },
  outboundInfo: {
    outboundNo: 'CK20240610001',
    outboundTime: '2024-06-11 08:30',
    destination: '上海家乐福超市',
    receiver: '王经理',
    quantity: 200
  }
};

export const mockScanRecords: ScanRecord[] = [
  {
    id: 'scan001',
    batchNo: 'B202406100123',
    scanTime: '2024-06-10 17:30',
    productName: '原味酸奶'
  },
  {
    id: 'scan002',
    batchNo: 'B202406090088',
    scanTime: '2024-06-09 18:00',
    productName: '草莓酸奶'
  },
  {
    id: 'scan003',
    batchNo: 'B202406080056',
    scanTime: '2024-06-08 16:30',
    productName: '巧克力奶'
  },
  {
    id: 'scan004',
    batchNo: 'B202406070101',
    scanTime: '2024-06-07 17:00',
    productName: '原味纯牛奶'
  },
  {
    id: 'scan005',
    batchNo: 'B202406100124',
    scanTime: '2024-06-10 10:30',
    productName: '白砂糖'
  },
  {
    id: 'scan006',
    batchNo: 'B202406090089',
    scanTime: '2024-06-09 15:10',
    productName: '全脂乳粉'
  }
];
