
/**
 * 工单状态文本映射
 */
const OrderStatusText: Record<string, string> = {
  ['PENDING']: '待处理',
  ['Processing']: '生产中',
  ['Completed']: '已完成'
};
/**
 * 工序状态文本映射
 */
export const OperationStatusText: Record<string, string> = {
  ['Pending']: '待处理',
  ['Processing']: '生产中',
  ['Completed']: '已完成'
};
/**
 * 生产状态文本映射
 */
const ProductionStatusText: Record<string, string> = {
  ['FEEDING']: '投料作业中',
  ['RECORDING']: '数据采集中',
  ['ABNORMAL']: '生产异常',
  ['COMPLETED']: '工序完工'
};

/**
 * 获取工单状态文本，如果状态不存在，返回默认值
 * @param status - 订单状态键
 * @param defaultValue - 可选的自定义默认值，默认为 '未知状态'
 */
export const getOrderStatusText = (status: string, defaultValue: string = '未知状态'): string => {
  return OrderStatusText[status] ?? defaultValue;
};

/**
 * 获取工序状态文本，如果状态不存在，返回默认值
 * @param status - 订单状态键
 * @param defaultValue - 可选的自定义默认值，默认为 '未知状态'
 */
export const getOperationStatusText = (status: string, defaultValue: string = '未知状态'): string => {
  return OperationStatusText[status] ?? defaultValue;
};

/**
 * 获取生产状态文本，如果状态不存在，返回默认值
 * @param status - 订单状态键
 * @param defaultValue - 可选的自定义默认值，默认为 '未知状态'
 */
export const getProductionStatusText = (status: string, defaultValue: string = '未知状态'): string => {
  return ProductionStatusText[status] ?? defaultValue;
};


