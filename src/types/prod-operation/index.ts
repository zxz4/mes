
import { InputType } from '@nutui/nutui-taro'

export interface ParamField {
  name: string
  type: InputType
  unit?: string
  required?: boolean
  min?: number
  max?: number
}

export interface ListField {
  name: string
  type: InputType
  required?: boolean
}

export interface ParamLog {
  batchNo: string
  isListMode: boolean
  values?: Array<{ name: string; value: string | number; unit?: string }>
  items?: Array<Record<string, string>>
  timestamp: number
}

export interface AnomalyRecord {
  time: string
  type: string
  description: string
  action: string
}

export interface Task {
  id: string
  processName: string
  productName: string
  batchNo: string
  equipmentName: string
  station: string
  planQty: number
  completedQty: number
  defectQty: number
  status: 'pending' | 'progressing' | 'completed'
  startTimeReal?: number
  paramLogs: ParamLog[]
  anomalies: AnomalyRecord[]
  paramConfig: ParamField[]
  listMode?: boolean
  listFields?: ListField[],
  materialList: MaterialRequirement[]
  materialReady: boolean  // 物料是否齐套
}

// 物料清单项
export interface MaterialRequirement {
  sapCode: string
  materialName: string
  requiredQty: number
  unit: string
  isUniqueCode: boolean  // true: SN单件码, false: 批次码
  consumedItems?: ConsumedItem[]
  consumedQuantity?: number  // 已录入总数量（快捷统计）
}

export interface ConsumedItem {
  code: string
  quantity: number  // 批次模式下一次可录入多个数量，SN模式下固定为1
  type: 'batch' | 'sn'
  timestamp: number
}
