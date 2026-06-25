import type { WorkOrderOperation } from "@/types/work-order";
import { ajaxPost } from "..";

export async function feedMaterial(data:
  {
    workOrderOperationId: string,
    materialSap: string,
    materialName: string,
    quantity: number,
    batchNo?: string
  }) {
  return ajaxPost<WorkOrderOperation>('/api/mes/production/feed-material', data);
}
