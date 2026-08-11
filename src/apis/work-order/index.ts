import { ajaxGet } from "..";
import { WorkOrderOperationDefinition } from "@/types/work-order";

export async function getWorkOrderOperations(id: string) {
  return ajaxGet<Array<WorkOrderOperationDefinition>>(`/api/mes/work-order/${id}/operations`);
}
