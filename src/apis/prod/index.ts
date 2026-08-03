import type { Material, Product, TraceTreeNode, OperationRecord } from "@/types/work-order";
import type { ScannedLot } from "@/types/production";
import { PagedList } from "@/types/index";

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


export async function scanLot(lotNumber: string, workOrderId: string) {
  return ajaxGet<ScannedLot>(`/api/mes/production/scan/${lotNumber}`, { workOrderId });
}

export async function submitOperationRecord(params: object) {
  return ajaxPost<OperationRecord>('/api/mes/production/operation-record', params);
}

/**
 * 产品全链路追溯（给定 id，返回树形结构）
 */
export const getProductTrace = (id: string) => {
  return ajaxGet<TraceTreeNode>(`/api/mes/product-look-up/${id}/trace`,);
}

export const getProductList = (params: object = {}) => {
  return ajaxGet<PagedList<Product>>('/api/mes/product-look-up', params);
}
