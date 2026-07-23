/**
 * 物料的基本信息和可执行工序信息
 */
export interface ScannedLot {
  /**
   * id
   */
  id: string;
  /**
   * 批次号
   */
  lotNumber: string;
  /**
   * 物料名称
   */
  name: string;
  /**
   * 物料SAP
   */
  sap: string;
  /**
   * 规格
   */
  specification: string;
  /**
   * 物料类型
   */
  materialType: 'CELL' | 'MODULE' | 'PACK' | 'RAW',
  /**
   * 批次状态
   */
  status: 'Created' | 'AwaitNext' | 'Passed' | 'Consumed' | 'Scrapped',
  /**
   * 可执行工序
   */
  availableOperations: Array<AvailableOperation>
}
/**
 * 可执行工序列表
 */
export interface AvailableOperation {
  /**
   * 工序id
   */
  operationId: string,
  /**
   * 工序编码
   */
  operationCode: string,
  /**
   * 工序名称
   */
  operationName: string,
  /**
   * 工序类型
   */
  operationType: 'Produce' | 'Process' | 'Assembly',
  /**
   * 是否可以跳过
   */
  skipEnabled: boolean,
  /**
   * 顺序号
   */
  sequence: number
}
