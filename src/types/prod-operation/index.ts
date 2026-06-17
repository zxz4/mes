import { InputType } from "@nutui/nutui-taro"
/**
 * 生产执行页面相关的类型定义
 * 支持工序管理、物料录入、参数采集、中间件依赖等业务场景
 */

/**
 * 参数配置字段（用于工序中需要录入的工艺参数）
 */
export interface ParamField {
  /** 参数名称，如 "电芯电压"、"锁付扭矩" */
  name: string
  /** 参数类型：数值或文本 */
  type: InputType
  /** 单位，如 "V"、"N·m" */
  unit?: string
  /** 是否必填 */
  required?: boolean
  /** 数值类型的最小值（仅当 type='number' 时有效） */
  min?: number
  /** 数值类型的最大值（仅当 type='number' 时有效） */
  max?: number
}

/**
 * 列表模式字段（用于多物料录入时，每一行的字段定义）
 */
export interface ListField {
  /** 字段名称，如 "电芯二维码"、"绝缘片批次码" */
  name: string
  /** 字段类型：数值或文本 */
  type: InputType
  /** 是否必填 */
  required?: boolean
}

/**
 * 普通模式的参数记录（单次录入一个批次的多组参数值）
 */
export interface ParamLogNormal {
  /** 产品批次号 */
  batchNo: string
  /** 固定为 false，表示普通模式 */
  isListMode: false
  /** 参数名称与值的数组 */
  values: Array<{
    name: string
    value: string | number
    unit?: string
  }>
  /** 录入时间戳 */
  timestamp: number
}

/**
 * 列表模式的参数记录（一次录入多行物料，每行有多个字段）
 */
export interface ParamLogList {
  /** 产品批次号 */
  batchNo: string
  /** 固定为 true，表示列表模式 */
  isListMode: true
  /** 每行物料的数据，每个物料对象包含所有字段的值 */
  items: Record<string, string>[]
  /** 录入时间戳 */
  timestamp: number
}

/**
 * 参数记录联合类型
 */
export type ParamLog = ParamLogNormal | ParamLogList

/**
 * 异常记录
 */
export interface AnomalyRecord {
  /** 发生时间（字符串格式） */
  time: string
  /** 异常类型，如 "设备故障"、"参数超标" */
  type: string
  /** 详细描述 */
  description: string
  /** 处理措施 */
  action: string
}

/**
 * 物料需求（新投入物料，需要领料）
 */
export interface MaterialRequirement {
  /** 物料SAP编码 */
  materialSap: string
  /** 物料名称 */
  materialName: string
  /** 本工序对该物料的需求数量（每加工一件需要的数量） */
  requiredQty: number
  /** 单位，如 "个"、"套"、"片" */
  unit: string
  /** 是否为唯一码（true：单件SN；false：批次码） */
  isUniqueCode: boolean
  /** 已消耗的物料项（前端记录） */
  consumedItems?: ConsumedItem[]
  /** 已消耗的总数量（自动计算） */
  consumedQuantity?: number
}

/**
 * 已消耗的物料项（扫码/手动录入的具体编码）
 */
export interface ConsumedItem {
  /** SN码 或 批次号 */
  code: string
  /** 本次录入的数量（批次模式下可能一次录入多个） */
  quantity: number
  /** 录入时间戳 */
  timestamp: number
}

/**
 * 中间件依赖（来自前序工序的产出）
 */
export interface IntermediateDependency {
  /** 依赖的工序ID，如 "OP1010" */
  sourceProcessId: string
  /** 每加工一个当前工序所需的前工序产出的数量 */
  requiredPerUnit: number
  /** 当前可用的数量（前端动态计算，不存储） */
  availableQty?: number
}

/**
 * 本工序的产出定义
 */
export interface Output {
  /** 产出中间件的标识，如 "CELL_RAW"、"GLUED_STACK" */
  intermediateId: string
  /** 每加工一件产出的数量（通常为1） */
  qtyPerUnit: number
}

/**
 * 工序（工艺）核心实体
 * 表示一个具体的生产工序，包含基本信息、物料需求、参数配置、产出依赖等
 */
export interface Process {
  /** 工序ID，如 "OP1010" */
  id: string
  /** 工序名称，如 "电芯上线" */
  processName: string
  /** 产品名称（当前工序加工的产品或半成品名称） */
  productName: string
  /** 批次号（前端自动生成，格式 BT+年月+工序ID+序列号） */
  batchNo: string
  /** 设备名称 */
  equipmentName: string
  /** 工位号 */
  station: string
  /** 计划加工数量 */
  planQty: number
  /** 已完成数量 */
  completedQty: number
  /** 合格品数量 */
  goodQty: number
  /** 不良品数量 */
  defectQty: number
  /** 工序状态：待处理/加工中/已完成 */
  status: 'pending' | 'progressing' | 'completed'
  /** 优先级（可选） */
  priority?: 'normal' | 'urgent'
  /** 开始加工的时间戳（毫秒） */
  startTimeReal: number | null
  /** 参数记录列表 */
  paramLogs: ParamLog[]
  /** 异常记录列表 */
  anomalies: AnomalyRecord[]
  /** 参数配置（需要录入的参数列表） */
  paramConfig?: ParamField[]
  /** 是否使用列表模式（多物料录入） */
  listMode?: boolean
  /** 列表模式的字段定义 */
  listFields?: ListField[]
  /** 新物料需求（需领料） */
  materialList: MaterialRequirement[]
  /** 中间件依赖（来自前序工序） */
  intermediateDeps: IntermediateDependency[]
  /** 本工序的产出定义 */
  output?: Output
  /** 是否为自动完成工序（无需录入参数，扫码即完成） */
  autoComplete?: boolean
  /** 新物料是否齐套（前端计算） */
  materialReady: boolean
  /** 中间件是否满足数量要求（前端计算） */
  intermediateReady: boolean
  /** 工序进度百分比（0-100） */
  progress:number
}
