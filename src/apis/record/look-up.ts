import { ajaxGet } from "..";
import { PagedList } from "@/types/index";
import { ProcessedLot, OperationRecord } from "@/types/work-order";

export function getProducedLotByOperationId(operationId: string, filter: object = {}) {
  return ajaxGet<PagedList<ProcessedLot>>(`/api/mes/record-look-up/produced/${operationId}/by-operation`, filter)
}


export function getRecordList(para: object = {}) {
  return ajaxGet<PagedList<OperationRecord>>('/api/mes/record-look-up', para)
}


export function getRecordDetail(id: string) {
  return ajaxGet<OperationRecord>(`/api/mes/record-look-up/${id}`)
}
