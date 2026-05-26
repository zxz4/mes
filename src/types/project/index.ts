/**
 * 项目信息
 * @description 生产项目的基本信息，用于物料领用业务
 */
export interface ProjectInfo {
  /** 项目唯一标识ID（内部使用，不展示） */
  projectId: string
  /** 项目编码，用于展示（如：PJ_1208） */
  projectCode: string
  /** 项目完整名称（如：PT043D-280-R2.1_215.04kWh_南阳金冠） */
  projectName: string
  /** SAP物料编码，也是最终生成的产品编码 */
  sap: string
  /** 产品名称（如：PT043D-280-R2.1） */
  productName: string
  /** 产品代码（如：ES-0746） */
  productCode: string
  /** 该项目需要生产的SAP产品数量 */
  quantity: number
}
