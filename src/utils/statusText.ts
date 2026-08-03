
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
 * 产品状态文本映射
 */
export const ProductStatusText: Record<string, string> = {
  ['Created']: '已上线',
  ['AwaitNext']: '生产中',
  ['Passed']: '已完工',
  ['Consumed']: '已装配',
  ['Scrapped']: '已报废'
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
export const getProductStatusText = (status: string, defaultValue: string = '未知状态'): string => {
  return ProductStatusText[status] ?? defaultValue;
};




