import type { Material, MaterialLot } from "@/types/work-order";
import { ajaxGet, ajaxPost } from "..";

export async function getMaterialBySap(sap: string) {
  return ajaxGet<Material>(`/api/mes/production/material/${sap}/by-sap`);
}


export async function createMaterialLot(materialId: string, lotNumber: string, workOrderId: string | null) {
  return ajaxPost<MaterialLot>('/api/mes/production/material-lot', {
    materialId,
    lotNumber,
    workOrderId
  });
}


export async function scanLot(lotNumber: string, workOrderId: string) {
  return ajaxGet<MaterialLot>(`/api/mes/production/scan/${lotNumber}`, { workOrderId });

}
