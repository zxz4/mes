export interface WorkOrder {
  id: string
  orderNo: string
  productName: string
  productCode: string
  planQty: number
  completedQty: number
  unit: string
  status: 'pending_material' | 'in_production' | 'completed'
  planStartTime: string
  planEndTime: string
  progress: number
  hasAnomaly: boolean
}

export interface WorkOrderDetail extends WorkOrder {
  // 可扩展更多字段，如实际开始时间、负责人等
}

export interface MaterialItem {
  materialName: string
  materialCode: string
  requiredQty: number
  unit: string
  pickedQty?: number
}

export interface StepProgress {
  id: number
  stepName: string
  status: 'pending' | 'in-progress' | 'completed' | 'anomaly'
  statusLabel: string
  statusClass: string
  equipmentName?: string
}
