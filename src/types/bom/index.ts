// 组件基础接口
export interface ComponentBase {
  id: string;
  componentCode: string;
  componentName: string;
  sap: string;
  specificationDescription: string;
  category: string;
  revision: string;
  quantity: number;
  unit: string;
  hasChildren: boolean;
}

// 完整的组件类型（可能包含子组件）
export interface Component extends ComponentBase {
  children?: Component[];  // 改为可选，因为某些接口不返回children
}

// BOM 树节点（扩展，用于UI展示）
export interface BomTreeNode extends ComponentBase {
  children: BomTreeNode[];
  level: number;
  expanded: boolean;
  checked: boolean;
  parentId: string | null;
  isLeaf: boolean;
  isLoading: boolean;
  isLoaded: boolean;
}
