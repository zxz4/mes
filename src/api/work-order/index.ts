import { ajaxGet,ajaxPut } from "..";
import { WorkOrderOperation} from "@/types/work-order";




export async function configure(id:string, para:any) {
  return ajaxPut(`/api/mes/work-order/${id}/configure`,para);
}

// 更新工单的工序物料需求
export const updateOperationMaterialRequirements = (workOrderId: string, payload: any) => {
  return ajaxPut(`/mes/workOrders/${workOrderId}/operation-material-requirements`,payload)
}

export async function getWorkOrderOperations(id:string) {
  return ajaxGet<Array<WorkOrderOperation>>(`/api/mes/work-order/${id}/operations`);
}
