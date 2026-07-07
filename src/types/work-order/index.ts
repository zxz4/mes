import type { InputType } from "@nutui/nutui-taro";


/**
 * 物料基本信息 （包括成品，半成品，载体）
 */
export interface Material{
  /**
   * id
   */
  id:string;
  /**
   * 通过parent确认组装关系
   */
  parentId?:string;
  /**
   * 物料SAP（冗余）
   */
  materialSap:string;
  /**
   * 物料名称（冗余）
   */
  materialName:string;
  /**
   * SN码
   */
  sn?:string;
  /**
   * 是否按SN管理，否则按批次管理（批次即按数量管理）
   * 载体也按SN模式管理
   */
  isSNManaged : boolean;
  /**
   * 数量
   */
  quantity:number;
}

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
  workOrderNo: string;
  /**
   * 工单名称
   */
  workOrderName: string;
  /**
   * 产品名称
   */
  materialName: string;
  /**
   * 产品SAP
   */
  materialSap: string;
  /**
   * 计划生产数量
   */
  plannedQty: number;
  /**
   * 完成数量
   */
  completedQty: number;
  /**
   * 工艺id
   */
  processId: string;
  /**
   * 工单状态
   */
  status: 'Pending' | 'Processing' | 'Completed';
}
/**
 * 工单详情
 */
export interface WorkOrderDetail extends WorkOrderListItem {
  /**
   * 工序定义
   */
  operationDefinitions: WorkOrderOperationDefinition[];
}

/**
 * 工单工序配置
 */
export interface WorkOrderOperationDefinition {
  /**
   * id
   */
  id: string;
  /**
   * 工序编码
   */
  operationCode: string;
  /**
   * 工序名称
   */
  operationName: string;
  /**
   * 工序顺序
   */
  sequence: number;
  /**
  * 是否开启记录参数
   */
  isParameterRecordEnabled: boolean;
  /**
   * 工序参数输入模板
   */
  parameterDefinitions: ParameterDefinition[];
  /**
   * 工序需求物料配置
   */
  materialDefinitions: MaterialDefinition[];
}

/**
 * 工单工序参数定义
 */
export interface ParameterDefinition {
  /**
   * id
   */
  id: string;
  /**
   * 参数名
   */
  parameterName: string;
  /**
   * 参数类型
   */
  parameterType: InputType;
  /**
   * 参数单位
   */
  unit: string;
  /**
   * 参数下限值（只能校验数值类型）
   */
  minValue?: number;
  /**
   * 参数上限值（只能校验数值类型）
   */
  maxValue?: number;
}

/**
 * 工单工序投料配置
 */
export interface MaterialDefinition {
  /**
   * 工单工序投料配置id
   */
  id: string;
  /**
   * 物料类型 （物料 / 载体）
   */
  materialType: 'MATERIAL' | 'CARRIER';
  /**
   * 物料名称
   */
  materialName: string;
  /**
   * 物料SAP编码（载体类型时可为空），如果是物料则需要核验SAP，仅第一次核验
   */
  materialSap: string;
  /**
  * 是否按SN管理，false按批次管理
  */
  isSNManaged: boolean;
  /**
   * 投料顺序，扫码时按顺序执行
   */
  sequence: number;
}

/**
 * 工单批次信息
 */
export interface Batch {
  /**
   * id
   */
  id: string;
  /**
   * 产品名称（冗余）
   */
  materialName: string;
  /**
   * 产品SAP（冗余）
   */
  materialSap: string;
  /**
   * 批次号
   */
  batchNo: string;
  /**
   * 批次执行信息
   */
  operation: WorkOrderOperation[]
  /**
   * 开始时间
   */
  startAt: string;
  /**
   * 完成时间
   */
  endAt?: string;
}

/**
 * 工序执行实例
 */
export interface WorkOrderOperation {
  /**
   * id
   */
  id: string;
  /**
   * 批次id
   */
  batchId: string;
  /**
 * 工序编码（冗余）
 */
  operationCode: string;
  /**
   * 工序名称（冗余）
   */
  operationName: string;
  /**
   * 工序编号（冗余）
   */
  sequence: number;
  /**
   * 投料信息
   */
  inputs?: OperationInput[];
  /**
   * 参数记录信息
   */
  parameters?: OperationParameter[];
  /**
   * 异常记录信息
   */
  anomalies?: OperationAnomaly[];
  /**
   * 产出信息
   */
  outputs?: OperationOutput[];
    /**
   * 物料 SAP 核验状态
   */
  sapCheckStatus?: 'NOT_CHECKED' | 'PASS' | 'FAIL';
  /**
   * 核验时间
   */
  sapCheckTime?: string;
}

/**
 * 工单工序投料记录
 */
export interface OperationInput {
  /**
   * id
   */
  id: string;
  /**
   * 关联工序执行实例id
   */
  workOrderOperationId: string;
  /**
   * 投料后会根据SAP和SN/LOT创建一条物料记录
   */
  materialId:string;
  /**
   * 绑定的父载体或物料id
   */
  parentMaterialId?: string;
    /**
  * 物料名称(冗余)
  */
  materialName: string;
  /**
   * 物料SAP编码
   */
  materialSap: string;
  /**
   * 物料编码 SN/或SN 取决于投料类型(冗余)
   */
  materialCode?: string;
  /**
   * 消耗数量
   */
  quantity: number;
  /**
  * 参数记录信息(物料级)
  */
  parameters?: OperationParameter[];
}

/**
 * 参数记录
 */
export interface OperationParameter {
  /**
   * id
   */
  id: string;
  /**
   * 工序实例id
   */
  workOrderOperationId: string;
  /**
   * 物料id(如果该id存在意味着参数为物料级别参数否则则为工序级别参数)
   */
  materialInputId?: string;
  /**
   * 参数名称
   */
  parameterName: string;
  /**
   * 参数值
   */
  value: string | number;
  /**
   * 单位
   */
  unit: string;
  /**
   * 是否异常
   */
  isAbnormal: boolean;
  /**
   * 记录时间
   */
  recordedAt: string;
}

/**
 * 异常信息
 */
export interface OperationAnomaly {
  /**
   * id
   */
  id: string;
  /**
   * 指示关联到那一道工序
   */
  workOrderOperationId: string;
  /**
   * 问题类型
   * Material:来料异常：包括物料短缺、物料损坏、规格不符等
   * Design:包括图纸错误、BOM错误、工艺设计缺陷等
   */
  anomalyType: 'Material' | 'Design' ;
  /**
   *  问题描述
   */
  description: string;
  /**
   * 临时措施
   */
  action?: string;
  /**
   * 发生时间
   */
  recordedAt: string;
}

/**
 * 产出信息
 */
export interface OperationOutput {
  /**
   * id
   */
  id: string;
   /**
   * 物料SAP（冗余）
   */
  materialSap:string;
  /**
   * 物料名称（冗余）
   */
  materialName:string;
  /**
   * SN码
   */
  sn?:string;
  /**
   * 数量
   */
  quantity:number;
  /**
   * 产出的时间
   */
  outputAt: string;
  /**
   * 输出的物料信息
   */
  materialInputs: Array<OperationInput>;
}
