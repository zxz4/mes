/**
 *  工单列表项
 */
export interface WorkOrderListItem {
  /**
   * 工单id
   */
  id: string;
  /**
   * 工单编号
   */
  workOrderNo: string
  /**
   * 工单名称
   */
  workOrderName: string
  /**
   * 产品名称
   */
  productName: string
  /**
   * 产品SAP
   */
  productSap: string
  /**
   * 计划生产数量
   */
  plannedQty: number
  /**
   * 完成数量
   */
  completedQty: number
  /**
   * 工艺id
   */
  processRouteId:string
  /**
   * 工单状态
   */
  status: 'Pending' | 'Processing' | 'Completed'
}
/**
 * 工单详情
 */
export interface WorkOrderDetail extends WorkOrderListItem {
  /**
   * 产品类型
   */
  productType: string
  /**
  * 产品规格
  */
  productSpec: string
  /**
   * 负责人名称
   */
  leaderName: string
  /**
   * 负责人部门
   */
  leaderDept: string
  /**
   * 工单领料信息
  */
  materialRequirements : WorkOrderMaterialRequirement[]
  /**
   * 工单工序信息
   */
  operations?: WorkOrderOperation[]
}

/**
 * 工单物料信息
 */
export interface WorkOrderMaterialRequirement {
  /**
   * 物料名称
   */
  materialName: string;
  /**
   * SAP
   */
  materialSap: string;
  /**
   * 需求数量
   */
  requiredQty: number;
  /**
   * 实际领取数量
   */
  pickedQty?: number
}

export interface WorkOrderOperation {
  /**
   * 工单工序id
   */
  id: string;
  /**
   * 工序id
   */
  routeStepId:string,
  /**
   * 工序编码
   */
  operationCode: string;
  /**
   * 工序名称
   */
  operationName: string;
  /**
   * 工单工序状态
   */
  status: 'Pending' | 'Processing' | 'Completed';
  /**
   * 工序需求物料信息
   */
  materialInputRequirements:MaterialInputRequirement[],
  /**
   * 预计数量
   */
  planQty: number
  /**
   * 实际完成数量
   */
  completedQty: number
}


/**
 * 工单工序投料配置
 */
export interface MaterialInputRequirement{
  /**
   * 工单工序需求物料id
   */
  id : string;
  /**
   * 工单工序id
   */
  workOrderOperationId:string;
  /**
   * 物料id
   */
  materialId:string;
  /**
   * 物料名称
   */
  materialName:string;
  /**
   * 物料SAP编码
   */
  materialSap:string;
  /**
   * 工序所需物料数量
   */
  plannedQty:number;
  /**
   * 工序实际消耗数量
   */
  consumedQty:number;
   /**
   * 是否按SN管理
   */
  isSNManaged:boolean;
  /**
   * 投料顺序，扫码时按顺序执行
   */
  sequence:number;

  /**
   * 投料信息
   */
  materialInputs:MaterialInput[]
}

/**
 * 工单工序投料记录
 */
export interface MaterialInput{
  /**
   * id
   */
  id:string;
  /**
   * 工序工单id
   */
  WorkOrderOperationId:string;
  /**
   * 使用的LOTID
   */
  materialLotId:string;
    /**
   * 物料名称
   */
  materialName:string;
  /**
   * 物料SAP编码
   */
  materialSap:string;
  /**
   * 消耗数量
   */
  quantity:number;
}



