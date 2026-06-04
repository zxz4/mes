// import { InputType } from "@nutui/nutui-taro"

// // 参数配置字段
// export interface ParamField {
//   name: string
//   type: InputType
//   unit?: string
//   required?: boolean
//   min?: number
//   max?: number
// }

// // 列表模式字段（用于多物料录入）
// export interface ListField {
//   name: string
//   type: InputType
//   required?: boolean
// }

// // 参数记录 - 普通模式
// export interface ParamLogNormal {
//   batchNo: string
//   isListMode: false
//   values: Array<{ name: string; value: string | number; unit?: string }>
//   timestamp: number
// }

// // 参数记录 - 列表模式
// export interface ParamLogList {
//   batchNo: string
//   isListMode: true
//   items: Record<string, string>[]
//   timestamp: number
// }

// export type ParamLog = ParamLogNormal | ParamLogList

// // 异常记录
// export interface AnomalyRecord {
//   time: string
//   type: string
//   description: string
//   action: string
// }

// // 任务数据
// export interface Task {
//   id: string
//   processName: string
//   productName: string
//   batchNo: string
//   equipmentName?: string
//   station?: string
//   planQty: number
//   completedQty: number
//   defectQty: number
//   status: 'pending' | 'progressing' | 'completed'
//   // priority?: 'normal' | 'urgent'
//   startTimeReal?: number
//   paramLogs: ParamLog[]
//   anomalies: AnomalyRecord[]
//   paramConfig: ParamField[]
//   listMode: boolean
//   listFields?: ListField[]
// }
