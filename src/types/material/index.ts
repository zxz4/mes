/**
 * 物料项（BOM物料节点）
 * @description 表示一个物料节点，可以是单层物料或具有子节点的复合物料
 */
export interface MaterialItem {
  /** 组件编码（如：CA-0070） */
  componentCode: string
  /** 组件名称（如：方形三元） */
  componentName: string
  /** SAP物料编号（可能为空字符串） */
  sap: string
  /** 规格描述（如：_22V_220mAh，可能为空字符串） */
  specificationDescription: string
  /** 当前节点的需求数量（若为复合节点，该字段可能为0或无意义） */
  quantity: number
  /** 单位（如：EA、each、个等） */
  unit: string
  /** 是否包含子节点（用于判断是否为复合物料） */
  hasChildren: boolean
  /** 子物料列表（若 hasChildren 为 true，则此处至少为一个数组） */
  children: MaterialItem[]
  /** 【前端扩展字段】用户实际领用数量，仅对叶子节点有效 */
  pickedQuantity?: number
}

/**
 * 物料领用记录
 * @description 提交领用时构造的数据结构
 */
export interface PickRecord {
  /** 组件编码 */
  componentCode: string
  /** 组件名称 */
  componentName: string
  /** 需求数量（BOM中定义的数量） */
  requiredQty: number
  /** 实际领用数量（用户填写） */
  pickedQty: number
  /** 单位 */
  unit: string
  /** SAP物料编号 */
  sap: string
}

/**
 * 领用提交参数
 * @description 最终提交到后端的领用数据格式
 */
export interface PickSubmitParams {
  /** 项目ID */
  projectId: string
  /** 项目编码 */
  projectCode: string
  /** 领用明细列表 */
  records: PickRecord[]
  /** 领用时间戳（前端生成，用于本地记录） */
  pickTime: number
}
