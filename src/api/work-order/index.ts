import { ajaxGet,ajaxPut } from "..";
import { PagedList } from "@/types/index";
import { WorkOrderListItem , WorkOrderDetail , WorkOrderOperation} from "@/types/work-order";



export async function getLWorkOrderList() {
  return ajaxGet<PagedList<WorkOrderListItem>>('/api/mes/work-order');
}

export async function getWorkOrderDetail(id:string) {
  return ajaxGet<WorkOrderDetail>(`/api/mes/work-order/${id}`);
}

export async function configure(id:string,para:{
  processRouteId:string,
  materialRequirements:Array<{
      materialSap:string,
      materialName:string,
      pickedQty:number,
      requiredQty:number
  }>;
  operations:Array<{
    routeStepId:string,
    materialRequirements:Array<{
      materialSap:string,
      materialName:string,
      isSNManaged:boolean,
      requiredQty:number
    }>
  }>
}) {
  return ajaxPut(`/api/mes/work-order/${id}/configure`,para);
}

// 更新工单的工序物料需求
export const updateOperationMaterialRequirements = (workOrderId: string, payload: any) => {
  return ajaxPut(`/mes/workOrders/${workOrderId}/operation-material-requirements`,payload)
}

export async function getWorkOrderOperations(id:string) {
  return ajaxGet<Array<WorkOrderOperation>>(`/api/mes/work-order/${id}/operations`);
}
