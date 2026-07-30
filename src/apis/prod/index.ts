import type { Material, Product, OperationRecord } from "@/types/work-order";
import type { ScannedLot } from "@/types/production";

import { ajaxGet, ajaxPost } from "..";

const materialMap = new Map();

export async function getMaterialBySap(sap: string) {
  let material = materialMap.get(sap);
  if (!material) {
    material = await ajaxGet<Material>(`/api/mes/production/material/${sap}/by-sap`);
    materialMap.set(sap, material);
  }
  return Promise.resolve<Material>(material);
}


export async function createMaterialLot(materialId: string, lotNumber: string, workOrderId: string | null) {
  return ajaxPost<Product>('/api/mes/production/material-lot', {
    materialId,
    lotNumber,
    workOrderId
  });
}


export async function scanLot(lotNumber: string, workOrderId: string) {
  return ajaxGet<ScannedLot>(`/api/mes/production/scan/${lotNumber}`, { workOrderId });
}



export async function submitOperationRecord(params: object) {
  return ajaxPost<OperationRecord>('/api/mes/production/operation-record', params);
}
