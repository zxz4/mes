import type { ProductionOperation } from "@/types/work-order";
import { ajaxGet } from "..";


export async function getListByBatchNo(batchNo: string) {
  return ajaxGet<ProductionOperation[]>(`/api/mes/production-look-up/by-batch/${batchNo}`);
}
