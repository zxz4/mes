import type { Batch } from "@/types/work-order";
import { ajaxGet } from "..";


export async function getListByBatchNo(batchNo: string) {
  return ajaxGet<Batch[]>(`/api/mes/production-look-up/by-batch/${batchNo}`);
}
