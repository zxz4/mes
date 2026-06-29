import type { InputType } from "@nutui/nutui-taro";

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
   * 产品类型
   */
  productType: string;
  /**
  * 产品规格
  */
  productSpec: string;
  /**
   * 负责人名称
   */
  leaderName: string;
  /**
   * 负责人部门
   */
  leaderDept: string;
  /**
   * 工单领料信息
  */
  materialDefinitions: WorkOrderOperationMaterialDefinition[];
  /**
   * 工单工序信息
   */
  operations: WorkOrderOperation[];
}
/**
 * 工单工序实例
 */
export interface WorkOrderOperation {
  /**
   * 工单工序id
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
   * 工单工序状态
   */
  status: 'Pending' | 'Processing' | 'Completed' ;
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
  materialDefinitions: WorkOrderOperationMaterialDefinition[];
  /**
   * 工序执行信息
   */
  productions?: ProductionOperation[],
  /**
   * 当前工序生产信息
   */
  currentProduction?: ProductionOperation;
  /**
   * 该工序预计完成数量(与工单数量一致)
   */
  plannedQty: number;
  /**
   * 该工序实际完成数量
   */
  completedQty: number;
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
 * 工单物料配置信息
 */
export interface WorkOrderOperationMaterialDefinition {
  /**
   * 物料名称
   */
  materialName: string;
  /**
   * SAP
   */
  materialSap: string;
  /**
   * BOM标准数量
   */
  standardQty: number;
  /**
   * 实际领取数量
   */
  pickedQty?: number;
}



/**
 * 工单工序投料配置
 */
export interface WorkOrderOperationMaterialDefinition {
  /**
   * 工单工序投料配置id
   */
  id: string;
  /**
   * 工单工序id
   */
  workOrderOperationId: string;
  /**
   * 物料id
   */
  materialId: string;
  /**
   * 物料名称
   */
  materialName: string;
  /**
   * 物料SAP编码
   */
  materialSap: string;
  /**
   * 工序所需物料标准用量
   */
  standardQty: number;
  /**
   * 工序实际消耗数量
   */
  consumedQty: number;
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
 * 工序执行批次信息
 */
export interface ProductionOperation {
  /**
   * id
   */
  id: string;
  /**
   * 批次号
   */
  batchNo: string;
  /**
   * 工序编号（冗余）
   */
  sequence: number;
  /**
   * 批次状态
   */
  status: 'FEEDING' | 'RECORDING' | 'ABNORMAL' | 'COMPLETED';

  /**
   * 投料信息
   */
  inputs?: OperationInput[];
  /**
   * 参数记录信息
   */
  parameters?: ProductionParameter[];
  /**
   * 异常记录信息
   */
  anomalies?: OperationAnomaly[];
  /**
   * 产出信息
   */
  outputs?: OperationOutput[];
  /**
   * 开始时间
   */
  startAt: string;
  /**
   * 完成时间
   */
  endAt?: string;
}



// ========== 参数记录 ==========
export interface ProductionParameter {
  /**
   * id
   */
  id: string;
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
  unit?: string;
  /**
   * 是否异常
   */
  isAbnormal?: boolean;

  /**
   * 记录时间
   */
  recordedAt: string;
}

// ========== 异常记录 ==========
export interface OperationAnomaly {
  id: string;
  type: string;
  description: string;
  action?: string;
  recordedAt: string;
}

// ========== 产出记录 ==========
export interface OperationOutput {
  id: string;
  materialName: string;
  materialSap: string;
  quantity: number;
  unit: string;
  outputAt: string;
  materialInputs: Array<OperationInput>;
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
   * 工单id
   */
  workOrderId: string;
  /**
   * 关联工序工单id
   */
  workOrderOperationId: string;
  /**
   * 关联的批次id
   */
  productionId: string;
  /**
   * 使用的LOTID
   */
  materialLotId: string;
  /**
 * 物料名称
 */
  materialName: string;
  /**
   * 物料SAP编码
   */
  materialSap: string;
  /**
   * 消耗数量
   */
  quantity: number;
}
