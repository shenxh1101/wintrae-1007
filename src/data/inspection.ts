import type { ProcessInspection, FinishedProductInspection } from '@/types/quality';

export const mockProcessInspectionList: ProcessInspection[] = [
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
  },
  {
    id: 'proc005',
    batchNo: 'B202406090088',
    processName: '原料预处理',
    processIndex: 1,
    operator: '李师傅',
    inspector: '王质检',
    inspectionTime: '2024-06-09 09:30',
    parameters: [
      { name: '投料温度', value: '5.2', unit: '℃', standard: '2-6℃', isQualified: true },
      { name: '搅拌速度', value: '65', unit: 'rpm', standard: '50-70rpm', isQualified: true },
      { name: '静置时间', value: '35', unit: 'min', standard: '20-40min', isQualified: true }
    ],
    conclusion: 'qualified',
    remark: ''
  },
  {
    id: 'proc006',
    batchNo: 'B202406090088',
    processName: '杀菌处理',
    processIndex: 2,
    operator: '王师傅',
    inspector: '王质检',
    inspectionTime: '2024-06-09 10:20',
    parameters: [
      { name: '杀菌温度', value: '86', unit: '℃', standard: '82-88℃', isQualified: true },
      { name: '保温时间', value: '16', unit: 's', standard: '12-18s', isQualified: true },
      { name: '出口温度', value: '17', unit: '℃', standard: '15-20℃', isQualified: true }
    ],
    conclusion: 'qualified',
    remark: ''
  },
  {
    id: 'proc007',
    batchNo: 'B202406090088',
    processName: '发酵工序',
    processIndex: 3,
    operator: '赵师傅',
    inspector: '张质检',
    inspectionTime: '2024-06-09 14:00',
    parameters: [
      { name: '发酵温度', value: '43', unit: '℃', standard: '40-44℃', isQualified: true },
      { name: '发酵时间', value: '5.5', unit: 'h', standard: '5-7h', isQualified: true },
      { name: '酸度', value: '78', unit: '°T', standard: '70-85°T', isQualified: true }
    ],
    conclusion: 'qualified',
    remark: '发酵状态良好，口感佳'
  },
  {
    id: 'proc008',
    batchNo: 'B202406080056',
    processName: '混合搅拌',
    processIndex: 1,
    operator: '孙师傅',
    inspector: '李质检',
    inspectionTime: '2024-06-08 11:00',
    parameters: [
      { name: '搅拌速度', value: '45', unit: 'rpm', standard: '50-70rpm', isQualified: false },
      { name: '搅拌时间', value: '20', unit: 'min', standard: '15-25min', isQualified: true }
    ],
    conclusion: 'recheck',
    remark: '搅拌速度偏低，需要确认是否影响产品质量'
  }
];

export const mockFinishedInspectionList: FinishedProductInspection[] = [
  {
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
  {
    id: 'fin002',
    batchNo: 'B202406090088',
    productName: '草莓酸奶',
    sampleCount: 15,
    inspector: '李质检',
    inspectionTime: '2024-06-09 18:00',
    items: [
      { name: '感官指标', standard: '色泽均匀，果粒分布均匀', result: '色泽粉红，果粒均匀', isQualified: true },
      { name: '蛋白质含量', standard: '≥2.3%', result: '2.6%', isQualified: true },
      { name: '脂肪含量', standard: '≥2.5%', result: '2.8%', isQualified: true },
      { name: '酸度', standard: '70-110°T', result: '78°T', isQualified: true },
      { name: '乳酸菌数', standard: '≥1×10⁶CFU/g', result: '1.8×10⁷CFU/g', isQualified: true },
      { name: '大肠菌群', standard: '≤10MPN/100g', result: '＜3MPN/100g', isQualified: true },
      { name: '果粒含量', standard: '≥8%', result: '9.5%', isQualified: true }
    ],
    conclusion: 'qualified',
    remark: '产品质量合格，果粒口感良好'
  },
  {
    id: 'fin003',
    batchNo: 'B202406080056',
    productName: '巧克力奶',
    sampleCount: 10,
    inspector: '王质检',
    inspectionTime: '2024-06-08 16:30',
    items: [
      { name: '感官指标', standard: '色泽均匀，巧克力风味纯正', result: '色泽棕褐，风味良好', isQualified: true },
      { name: '蛋白质含量', standard: '≥2.3%', result: '2.5%', isQualified: true },
      { name: '脂肪含量', standard: '≥2.5%', result: '2.7%', isQualified: true },
      { name: '可溶性固形物', standard: '≥10%', result: '11.5%', isQualified: true },
      { name: '菌落总数', standard: '≤30000CFU/g', result: '2800CFU/g', isQualified: false },
      { name: '大肠菌群', standard: '≤10MPN/100g', result: '＜3MPN/100g', isQualified: true }
    ],
    conclusion: 'unqualified',
    remark: '菌落总数超标，需要复检并查明原因'
  },
  {
    id: 'fin004',
    batchNo: 'B202406070101',
    productName: '原味纯牛奶',
    sampleCount: 25,
    inspector: '张质检',
    inspectionTime: '2024-06-07 17:00',
    items: [
      { name: '感官指标', standard: '乳白色，无异味', result: '色泽乳白，气味纯正', isQualified: true },
      { name: '蛋白质含量', standard: '≥3.2%', result: '3.5%', isQualified: true },
      { name: '脂肪含量', standard: '≥3.6%', result: '3.8%', isQualified: true },
      { name: '非脂乳固体', standard: '≥8.1%', result: '8.7%', isQualified: true },
      { name: '酸度', standard: '12-18°T', result: '15°T', isQualified: true },
      { name: '菌落总数', standard: '≤30000CFU/g', result: '1500CFU/g', isQualified: true }
    ],
    conclusion: 'qualified',
    remark: '各项指标均优于国家标准'
  },
  {
    id: 'fin005',
    batchNo: 'B202406070102',
    productName: '香蕉牛奶',
    sampleCount: 12,
    inspector: '李质检',
    inspectionTime: '2024-06-07 15:30',
    items: [
      { name: '感官指标', standard: '色泽均匀，香蕉风味', result: '淡黄，香气自然', isQualified: true },
      { name: '蛋白质含量', standard: '≥2.0%', result: '2.3%', isQualified: true },
      { name: '脂肪含量', standard: '≥2.0%', result: '2.4%', isQualified: true },
      { name: '酸度', standard: '30-60°T', result: '45°T', isQualified: true },
      { name: '菌落总数', standard: '≤30000CFU/g', result: '待检测', isQualified: false }
    ],
    conclusion: 'pending',
    remark: '微生物检测结果待出'
  }
];
