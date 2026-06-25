import { ajaxGet } from "..";
import { PagedList } from "@/types/index";
import { WorkOrderListItem , WorkOrderDetail } from "@/types/work-order";


export async function getLWorkOrderList() {
  return ajaxGet<PagedList<WorkOrderListItem>>('/api/mes/work-order-look-up');
}

export async function getWorkOrderDetail(id:string) {
  return ajaxGet<WorkOrderDetail>(`/api/mes/work-order-look-up/${id}`);
}
