// 工单列表项（用于列表展示）
export interface WorkOrderListItem {
  id: string
  workOrderNo: string
  workOrderName: string
  productName: string
  productSap: string
  plannedQty: number
  completedQty: number
  processRouteId:string
  status: 'Pending' | 'Processing' | 'Completed'
  hasAnomaly: boolean
}

// 工单详情（用于详情页）
export interface WorkOrderDetail extends WorkOrderListItem {
  productType: string           // 产品类型
  productSpec: string           // 产品规格
  leaderName: string            // 负责人名称
  leaderDept: string            // 负责人部门
  // 可选：物料清单、工序进度等，可继续扩展
  materialRequirements : MaterialRequirement[]
  steps?: StepProgress[]
}


export interface StartWorkOrderPara{
  processRouteId:string
  workOrderMaterialReq:Array<MaterialRequirement>
}

export interface MaterialRequirement {
  materialName: string
  materialCode: string
  requiredQty: number
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
