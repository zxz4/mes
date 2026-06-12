import { ajaxGet } from "..";
import type { Component } from '@/types/bom/component';

// 获取BOM根节点
export async function getBom(bomId: string) {
  return ajaxGet<Component>(`http://10.100.1.74:9102/api/mes/boms-look-up/${bomId}`);
}

export async function getBomRoot() {
  return ajaxGet<Array<Component>>('http://10.100.1.74:9102/api/mes/boms-look-up/root');
}

// 获取指定节点的子节点
export async function getBomChildren(nodeId: string) {
  return ajaxGet<Array<Component>>(`http://10.100.1.74:9102/api/mes/boms-look-up/${nodeId}/children`);
}
