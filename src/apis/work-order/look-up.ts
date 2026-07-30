import { ajaxGet } from "..";
import { PagedList } from "@/types/index";
import { WorkOrderListItem, WorkOrderOperationDefinition, WorkOrderWithOperationDetail } from "@/types/work-order";


export async function getLWorkOrderList(para: object = {}) {
  return ajaxGet<PagedList<WorkOrderListItem>>('/api/mes/work-order-look-up', para);
}

export async function getOperation(operationId: string) {
  return ajaxGet<WorkOrderOperationDefinition>(`/api/mes/work-order-look-up/${operationId}/operation`);
}

export async function getWithOperation(id: string) {
  return ajaxGet<WorkOrderWithOperationDetail>(`/api/mes/work-order-look-up/${id}/with-operations`);
}
