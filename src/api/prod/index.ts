import type { WorkOrderOperationDefinition } from "@/types/work-order";
import { ajaxPost } from "..";

export async function feedMaterial(data:object) {
  return ajaxPost<WorkOrderOperationDefinition>('/api/mes/production/feed-material', data);
}


export async function recordParameters(oprId:string,payload:object) {
  return ajaxPost<WorkOrderOperationDefinition>(`/api/mes/production/${oprId}/record-parameter`, payload);
}
