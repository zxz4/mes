import { ajaxGet } from "..";
import type { Component } from '@/types/bom';

// 获取BOM根节点
export async function getBom(bomId: string) {
  return ajaxGet<Component>(`http://10.100.1.74:9102/api/mes/boms-look-up/${bomId}`);
}

export async function getBomNodeBySap(sap:string) {
    return ajaxGet<Component>(`http://10.100.1.74:9102/api/mes/boms-look-up/${sap}/by-sap`);
}

export async function getBomNodeBySapWithChildren(sap:string) {
    return ajaxGet<Component>(`http://10.100.1.74:9102/api/mes/boms-look-up/${sap}/by-sap-with-children`);
}

export async function getBomRoot() {
  return ajaxGet<Array<Component>>('http://10.100.1.74:9102/api/mes/boms-look-up/root');
}

// 获取指定节点的子节点
export async function getBomChildren(nodeId: string) {
  return ajaxGet<Array<Component>>(`http://10.100.1.74:9102/api/mes/boms-look-up/${nodeId}/children`);
}

