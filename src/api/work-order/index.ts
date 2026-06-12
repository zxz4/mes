import { ajaxGet,ajaxPut } from "..";
import { PagedList } from "@/types/index";
import { WorkOrderListItem , WorkOrderDetail ,StartWorkOrderPara} from "@/types/work-order";

export async function getLWorkOrderList() {
  return ajaxGet<PagedList<WorkOrderListItem>>('/api/mes/work-order');
}

export async function getWorkOrder(id:string) {
  return ajaxGet<WorkOrderDetail>(`/api/mes/work-order/${id}`);
}

export async function startWorking(id:string,para: StartWorkOrderPara) {
  return ajaxPut(`/api/mes/work-order/${id}/start`,para);
}
