import { ajaxGet } from "..";
import { PagedList } from "@/types/index";
import { ProcessedLot } from "@/types/work-order";

export function getProducedLotByOperationId(operationId: string, filter: object = {}) {
  return ajaxGet<PagedList<ProcessedLot>>(`/api/mes/record-look-up/produced/${operationId}/by-operation`, filter)
}
