import type { WorkOrderOperation } from "@/types/work-order";
import { ajaxPost } from "..";

export async function feedMaterial(data:object) {
  return ajaxPost<WorkOrderOperation>('/api/mes/production/feed-material', data);
}


export async function recordParameters(data:object) {
  return ajaxPost<WorkOrderOperation>('/api/mes/production/record-parameter', data);
}
