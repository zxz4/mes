import type { ProductionOperation } from '@/types/work-order';

// ===== 工序概要 MOCK =====
export const mockOperationSummary = {
  totalBatches: 156,
  completedBatches: 150,
  processingBatches: 4,
  anomalyBatches: 2,
  totalInputQuantity: 312,
  totalOutputQuantity: 298,
};

// ===== 批次列表 MOCK =====
export const mockOperationBatches: ProductionOperation[] = [
  {
    id: 'batch-001',
    batchNo: 'BT20260625OP1010-0156',
    sequence: 156,
    status: 'Completed',
    inputs: [
      { id: 'in-001', workOrderId: 'WO-001', workOrderOperationId: 'OP-001', productionId: 'batch-001', lotCode: 'lot-001', materialName: '电芯', materialSap: 'MAT-001', quantity: 1 },
      { id: 'in-002', workOrderId: 'WO-001', workOrderOperationId: 'OP-001', productionId: 'batch-001', lotCode: 'lot-002', materialName: '端板', materialSap: 'MAT-002', quantity: 1 },
    ],
    parameters: [
      { id: 'param-001', parameterName: '电压', value: 3.25, unit: 'V', isAbnormal: false, recordedAt: '2026-06-25T14:30:00' },
      { id: 'param-002', parameterName: '内阻', value: 0.08, unit: 'mΩ', isAbnormal: false, recordedAt: '2026-06-25T14:30:00' },
    ],
    anomalies: [],
    outputs: [
      { id: 'out-001', materialName: '电芯半成品', materialSap: 'SEMI-001', quantity: 1, unit: '件', outputAt: '2026-06-25T14:30:00', materialInputs: [] },
    ],
    startAt: '2026-06-25T14:20:00',
    endAt: '2026-06-25T14:30:00',
  },
  {
    id: 'batch-002',
    batchNo: 'BT20260625OP1010-0155',
    sequence: 155,
    status: 'Completed',
    inputs: [
      { id: 'in-003', workOrderId: 'WO-001', workOrderOperationId: 'OP-001', productionId: 'batch-002', lotCode: 'lot-003', materialName: '电芯', materialSap: 'MAT-001', quantity: 1 },
    ],
    parameters: [
      { id: 'param-003', parameterName: '电压', value: 3.28, unit: 'V', isAbnormal: true, recordedAt: '2026-06-25T14:15:00' },
      { id: 'param-004', parameterName: '内阻', value: 0.09, unit: 'mΩ', isAbnormal: false, recordedAt: '2026-06-25T14:15:00' },
    ],
    anomalies: [
      { id: 'anom-001', type: '参数超标', description: '电压3.28V超出上限3.275V，已让步放行', action: '让步放行', recordedAt: '2026-06-25T14:16:00' },
    ],
    outputs: [
      { id: 'out-002', materialName: '电芯半成品', materialSap: 'SEMI-001', quantity: 1, unit: '件', outputAt: '2026-06-25T14:15:00', materialInputs: [] },
    ],
    startAt: '2026-06-25T14:05:00',
    endAt: '2026-06-25T14:15:00',
  },
  {
    id: 'batch-003',
    batchNo: 'BT20260625OP1010-0154',
    sequence: 154,
    status: 'Feeding',
    inputs: [
      { id: 'in-004', workOrderId: 'WO-001', workOrderOperationId: 'OP-001', productionId: 'batch-003', lotCode: 'lot-004', materialName: '电芯', materialSap: 'MAT-001', quantity: 1 },
    ],
    parameters: [],
    anomalies: [],
    outputs: [],
    startAt: '2026-06-25T14:45:00',
    endAt: undefined,
  },
  {
    id: 'batch-004',
    batchNo: 'BT20260625OP1010-0153',
    sequence: 153,
    status: 'Completed',
    inputs: [
      { id: 'in-005', workOrderId: 'WO-001', workOrderOperationId: 'OP-001', productionId: 'batch-004', lotCode: 'lot-005', materialName: '电芯', materialSap: 'MAT-001', quantity: 1 },
      { id: 'in-006', workOrderId: 'WO-001', workOrderOperationId: 'OP-001', productionId: 'batch-004', lotCode: 'lot-006', materialName: '端板', materialSap: 'MAT-002', quantity: 1 },
    ],
    parameters: [
      { id: 'param-005', parameterName: '电压', value: 3.24, unit: 'V', isAbnormal: false, recordedAt: '2026-06-25T13:50:00' },
      { id: 'param-006', parameterName: '内阻', value: 0.07, unit: 'mΩ', isAbnormal: false, recordedAt: '2026-06-25T13:50:00' },
      { id: 'param-007', parameterName: '温度', value: 25, unit: '℃', isAbnormal: false, recordedAt: '2026-06-25T13:50:00' },
    ],
    anomalies: [],
    outputs: [
      { id: 'out-003', materialName: '电芯半成品', materialSap: 'SEMI-001', quantity: 1, unit: '件', outputAt: '2026-06-25T13:50:00', materialInputs: [] },
    ],
    startAt: '2026-06-25T13:40:00',
    endAt: '2026-06-25T13:50:00',
  },
  {
    id: 'batch-005',
    batchNo: 'BT20260625OP1010-0152',
    sequence: 152,
    status: 'Completed',
    inputs: [
      { id: 'in-007', workOrderId: 'WO-001', workOrderOperationId: 'OP-001', productionId: 'batch-005', lotCode: 'lot-007', materialName: '电芯', materialSap: 'MAT-001', quantity: 1 },
    ],
    parameters: [
      { id: 'param-008', parameterName: '电压', value: 3.26, unit: 'V', isAbnormal: false, recordedAt: '2026-06-25T13:25:00' },
    ],
    anomalies: [],
    outputs: [
      { id: 'out-004', materialName: '电芯半成品', materialSap: 'SEMI-001', quantity: 1, unit: '件', outputAt: '2026-06-25T13:25:00', materialInputs: [] },
    ],
    startAt: '2026-06-25T13:15:00',
    endAt: '2026-06-25T13:25:00',
  },
];
