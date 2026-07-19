/**
 * 物料基本信息 （包括成品，半成品，载体）
 */
export interface Material {
  /**
   * id
   */
  id: string;
  /**
   * 物料SAP（冗余）
   */
  sapCode: string;
  /**
   * 物料名称（冗余）
   */
  name: string;
  /**
 * 物料类型
 */
  materialType: 'CELL' | 'MODULE' | 'PACK' | 'RAW';
  /**
   * 规格信息
   */
  specification: string;
}

/**
 * 物料批次信息
 */
export interface MaterialLot {
  /**
   * id
   */
  id: string;
  /**
   * 批次号/序列号
   */
  lotNumber: string;
  /**
   * 物料id
   */
  materialId: string;
  /**
   * 物料类型
   */
  materialType: string;
  /**
   * 物料名称
   */
  materialName: string;
  /**
   * 实物状态
   */
  status: 'Created' | 'InProcess' | 'AwaitNext' | 'Passed' | 'Scrapped';
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
  code: string;
  /**
   * 工单名称
   */
  name: string;
  /**
   * 产品名称
   */
  productName: string;
  /**
   * 产品SAP
   */
  productSap: string;
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
  status: 'PENDING' | 'Processing' | 'Completed';
}
/**
 * 工单详情
 */
export interface WorkOrderWithOperationDetail extends WorkOrderListItem {
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
   * 工单id
   */
  workOrderId: string;
  /**
   * 工序编码
   */
  operationCode: string;
  /**
   * 工序名称
   */
  operationName: string;
  /**
   * 类型标签
   */
  applicableMaterialType: 'CELL' | 'MODULE' | 'PACK' | 'RAW';
  /**
   * Produce:产出新物料实例（如电芯上料、模组堆叠、Pack总装）
   * Process:仅加工处理实物，不改变标识
   */
  operationType: 'Produce' | 'Process',
  /**
   * 是否可以跳过
   */
  skipEnabled: boolean;
  /**
   * 工序顺序
   */
  sequence: number;
  /**
  * 是否启用记录参数
   */
  isParameterRecordEnabled: boolean;
  /**
   * 工序参数输入模板
   */
  parameterDefinitions: ParameterDefinition[];
}

/**
 * 工序参数定义
 */
export interface ParameterDefinition {
  /**
   * 参数名
   */
  parameterName: string;
  /**
   * 参数类型（这里后端会自动将类型转换为框架支持的input type）
   */
  parameterType: 'text' | 'digit';
  /**
   * 定义该参数是否必填
   */
  isRequired: boolean;
  /**
   * 参数单位
   */
  unit: string;
  /**
   * 参数下限值（只能校验数值类型）
   */
  minValue: number | null;
  /**
   * 参数上限值（只能校验数值类型）
   */
  maxValue: number | null;
}

export interface OperationRecord {
  /**
   * id
   */
  id: string;
  /**
   * 工单id
   */
  workOrderId: string;
  /**
  * 工序id
  */
  operationId: string;
  /**
  * 加工物料id
  */
  processedLotNumber: string;
  /**
  * 产出物料id
  */
  outputLotNumber: string;
  /**
   * 开始时间
   */
  startTime: string;

  /**
   * 结束时间
   */
  endTime: string;
  /**
   * 是否异常
   */
  isAbnormal: boolean;
  /**
   * 参数记录
   */
  parameters: Array<ParameterRecord>
  /**
   * 辅料信息
   */
  materialUsages: Array<OperationMaterialUsage>
}

export interface ParameterRecord {
  /**
   * 参数名称
   */
  parameterName: string;
  /**
   * 单位
   */
  unit: string | null;
  /**
   * 值
   */
  value: string | null;
  /**
   * 是否异常
   */
  isAbnormal: boolean
}

export interface OperationMaterialUsage {
  /**
   * 批次/sn号
   */
  lotNumber: string;
  /**
   * 数量
   */
  quantity: number;
}
