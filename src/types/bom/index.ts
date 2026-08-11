export interface BomItem {
  id: string;
  componentCode: string;
  componentName: string;
  sap: string;
  specificationDescription: string;
  quantity: number;
  unit: string | null;
  hasChildren: boolean;
  children: BomItem[];
}
