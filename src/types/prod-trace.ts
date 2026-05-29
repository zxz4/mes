export interface StepParam {
  name: string
  value: string
  unit: string
  isAbnormal: boolean
}

export interface AnomalyRecord {
  time: string
  action: string
  result: string
  description: string
}

export interface Step {
  id: number
  stepName: string
  status: 'completed' | 'in-progress' | 'anomaly' | 'pending'
  startTime: string | null
  endTime: string | null
  operator: string | null
  equipment?: string
  equipmentName?: string
  station: string
  hasAnomaly: boolean
  params: StepParam[]
  inspection: string | null
  anomalyRecords: AnomalyRecord[]
}

export interface ProductInfo {
  productName: string
  sap: string
  batchNo: string
  productCode: string
  spec: string
  status: 'done' | 'abnormal' | 'processing'
}
