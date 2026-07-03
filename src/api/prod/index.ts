import type { WorkOrderOperation } from "@/types/work-order";
import { ajaxPost } from "..";

export async function feedMaterial(data:object) {
  return ajaxPost<WorkOrderOperation>('/api/mes/production/feed-material', data);
}


export async function recordParameters(oprId:string,payload:object) {
  return ajaxPost<WorkOrderOperation>(`/api/mes/production/${oprId}/record-parameter`, payload);
}
