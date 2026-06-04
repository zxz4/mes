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
