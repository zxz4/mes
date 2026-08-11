import { ajaxGet } from "..";
import type { BomItem } from '@/types/bom';

export async function getMaterialTree(sap: string) {
  return ajaxGet<BomItem>(`https://10.100.1.74:9142/api/mes/boms-look-up/${sap}/by-sap-with-children`);
}

