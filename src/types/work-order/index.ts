// 工单列表项（用于列表展示）
export interface WorkOrderListItem {
  id: string
  projectCode: string
  projectName: string
  productName: string
  productSap: string
  planQty: number
  completedQty: number
  unit: string
  status: 'pending_material' | 'in_production' | 'completed'
  hasAnomaly: boolean
}

// 工单详情（用于详情页）
export interface WorkOrderDetail extends WorkOrderListItem {
  productType: string           // 产品类型
  productSpec: string           // 产品规格
  leaderName: string            // 负责人名称
  leaderDept: string            // 负责人部门
  // 可选：物料清单、工序进度等，可继续扩展
  materialList?: MaterialItem[]
  steps?: StepProgress[]
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
  planQty: number            // 该工序计划加工件数
  completedQty: number       // 该工序已完成件数
  consumedMaterials?: {      // 该工序消耗的物料
    materialName: string
    consumedQty: number
    unit: string
  }[]
}
