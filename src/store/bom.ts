import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getBomRoot, getBom, getBomChildren } from '@/api/bom';
import type { Component, ComponentBase, BomTreeNode } from '@/types/bom';

export const useBomStore = defineStore('bom', () => {
  // ============ 状态 ============

  // 顶层BOM节点列表
  const rootNodes = ref<Component[]>([]);

  // BOM节点详情缓存 (nodeId -> Component)
  const nodeDetailCache = ref<Map<string, Component>>(new Map());

  // BOM子节点缓存 (nodeId -> children[])
  const childrenCache = ref<Map<string, Component[]>>(new Map());

  // 当前视图模式：'full' 完整树 或 'partial' 子树
  const viewMode = ref<'full' | 'partial'>('full');

  // 当前查看的子树根节点ID（partial模式）
  const currentRootId = ref<string | null>(null);

  // 是否已初始化完整树
  const fullTreeInitialized = ref(false);

  // 加载状态
  const loading = ref(false);
  const loadingNodes = ref<Set<string>>(new Set());

  // 错误信息
  const error = ref<string | null>(null);

  // 所有节点的展开/折叠状态
  const expandedNodes = ref<Set<string>>(new Set());

  // 选中节点集合
  const checkedNodes = ref<Set<string>>(new Set());

  // 搜索关键词
  const searchKeyword = ref('');

  // 扁平化的节点映射
  const flatNodesMap = ref<Map<string, BomTreeNode>>(new Map());

  // ============ 计算属性 ============

  // 当前显示的根节点（根据视图模式）
  const displayRootNodes = computed<Component[]>(() => {
    if (viewMode.value === 'partial' && currentRootId.value) {
      const rootNode = nodeDetailCache.value.get(currentRootId.value);
      if (rootNode) {
        return [rootNode];
      }
      return [];
    }
    return rootNodes.value;
  });

  // 获取完整的树形结构
  const bomTree = computed<BomTreeNode[]>(() => {
    return buildTreeFromCache(displayRootNodes.value, 0, null);
  });

  // 获取过滤后的树
  const filteredBomTree = computed<BomTreeNode[]>(() => {
    if (!searchKeyword.value.trim()) {
      return bomTree.value;
    }
    return filterTree(bomTree.value, searchKeyword.value.toLowerCase());
  });

  // 获取选中的节点
  const selectedNodes = computed<BomTreeNode[]>(() => {
    return Array.from(checkedNodes.value)
      .map(id => flatNodesMap.value.get(id))
      .filter((node): node is BomTreeNode => node !== undefined);
  });

  // 获取所有叶子节点
  const leafNodes = computed<BomTreeNode[]>(() => {
    return Array.from(flatNodesMap.value.values())
      .filter(node => node.isLeaf);
  });

  // ============ 方法 ============

  /**
   * 初始化完整树 - 加载顶层BOM节点
   */
  async function initFullTree(forceRefresh = false): Promise<void> {
    if (fullTreeInitialized.value && !forceRefresh) {
      return;
    }

    loading.value = true;
    error.value = null;
    viewMode.value = 'full';
    currentRootId.value = null;

    try {
      const data = await getBomRoot();
      rootNodes.value = data;
      fullTreeInitialized.value = true;

      // 清空缓存
      nodeDetailCache.value.clear();
      childrenCache.value.clear();

      // 将根节点加入详情缓存
      data.forEach((node: Component) => {
        nodeDetailCache.value.set(node.id, node);
      });

      // 重建扁平化映射
      rebuildFlatMap();

      // 默认展开有子节点的第一层
      expandedNodes.value.clear();
      data.forEach((item: Component) => {
        if (item.hasChildren) {
          expandedNodes.value.add(item.id);
        }
      });

    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载BOM根节点失败';
      console.error('Failed to init full BOM tree:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载指定节点的子树（局部模式）
   */
  async function loadSubTree(nodeId: string): Promise<Component> {
    loading.value = true;
    error.value = null;

    try {
      // 获取节点详情
      const nodeDetail: Component = await getBom(nodeId);

      // 确保节点详情有效
      if (!nodeDetail || !nodeDetail.id) {
        throw new Error('Invalid node detail returned');
      }

      // 切换到局部视图
      viewMode.value = 'partial';
      currentRootId.value = nodeId;

      // 清空旧的缓存
      nodeDetailCache.value = new Map<string, Component>();
      childrenCache.value = new Map<string, Component[]>();

      // 将当前节点加入缓存
      nodeDetailCache.value.set(nodeId, nodeDetail);

      // 重建扁平化映射
      rebuildFlatMap();

      // 展开当前节点（如果它有子节点）
      expandedNodes.value.clear();
      if (nodeDetail.hasChildren) {
        expandedNodes.value.add(nodeId);
        // 自动加载第一层子节点
        await fetchChildren(nodeId);
      }

      return nodeDetail;
    } catch (err) {
      error.value = err instanceof Error ? err.message : `加载节点 ${nodeId} 失败`;
      console.error(`Failed to load sub tree for node ${nodeId}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 切换到完整树视图
   */
  async function switchToFullTree(): Promise<void> {
    if (!fullTreeInitialized.value) {
      await initFullTree();
    } else {
      viewMode.value = 'full';
      currentRootId.value = null;
      // 保留已有的缓存，重建扁平化映射
      rebuildFlatMap();
      // 重置展开状态
      expandedNodes.value.clear();
      rootNodes.value.forEach((item: Component) => {
        if (item.hasChildren) {
          expandedNodes.value.add(item.id);
        }
      });
    }
  }

  /**
   * 获取节点详情
   */
  async function fetchNodeDetail(nodeId: string): Promise<Component> {
    // 从缓存中获取
    const cached = nodeDetailCache.value.get(nodeId);
    if (cached) {
      return cached;
    }

    loadingNodes.value.add(nodeId);

    try {
      const detail: Component = await getBom(nodeId);

      if (!detail || !detail.id) {
        throw new Error('Invalid node detail returned');
      }

      nodeDetailCache.value.set(nodeId, detail);

      // 更新扁平化映射中的节点信息
      updateNodeInFlatMap(nodeId, detail);

      return detail;
    } catch (err) {
      console.error(`Failed to fetch node detail ${nodeId}:`, err);
      throw err;
    } finally {
      loadingNodes.value.delete(nodeId);
    }
  }

  /**
   * 加载子节点
   */
  async function fetchChildren(nodeId: string): Promise<Component[]> {
    // 如果已经在加载中
    if (loadingNodes.value.has(nodeId)) {
      const cached = childrenCache.value.get(nodeId);
      return cached || [];
    }

    // 如果已经加载过
    const cachedChildren = childrenCache.value.get(nodeId);
    if (cachedChildren) {
      return cachedChildren;
    }

    loadingNodes.value.add(nodeId);

    try {
      const children: Component[] = await getBomChildren(nodeId);

      if (!Array.isArray(children)) {
        throw new Error('Invalid children data returned');
      }

      childrenCache.value.set(nodeId, children);

      // 将子节点加入详情缓存
      children.forEach((child: Component) => {
        if (child && child.id) {
          nodeDetailCache.value.set(child.id, child);
        }
      });

      // 更新扁平化映射
      updateFlatMapForChildren(nodeId, children);

      return children;
    } catch (err) {
      console.error(`Failed to fetch children for node ${nodeId}:`, err);
      throw err;
    } finally {
      loadingNodes.value.delete(nodeId);
    }
  }

  /**
   * 从缓存构建树节点
   */
  function buildTreeFromCache(
    components: Component[],
    level: number,
    parentId: string | null
  ): BomTreeNode[] {
    return components.map((comp: Component) => {
      const cachedChildren = childrenCache.value.get(comp.id);
      const hasLoadedChildren = childrenCache.value.has(comp.id);
      const isExpanded = expandedNodes.value.has(comp.id);
      const isLeaf = !comp.hasChildren;

      const node: BomTreeNode = {
        id: comp.id,
        componentCode: comp.componentCode,
        componentName: comp.componentName,
        sap: comp.sap,
        specificationDescription: comp.specificationDescription,
        category: comp.category,
        revision: comp.revision,
        quantity: comp.quantity,
        unit: comp.unit,
        hasChildren: comp.hasChildren,
        level,
        expanded: isExpanded,
        checked: checkedNodes.value.has(comp.id),
        parentId,
        isLeaf,
        isLoading: loadingNodes.value.has(comp.id),
        isLoaded: hasLoadedChildren || false,
        children: []
      };

      // 更新扁平化映射
      flatNodesMap.value.set(comp.id, node);

      // 如果已展开且已加载子节点，递归构建子树
      if (isExpanded && cachedChildren) {
        node.children = buildTreeFromCache(cachedChildren, level + 1, comp.id);
      }

      return node;
    });
  }

  /**
   * 重建整个扁平化映射
   */
  function rebuildFlatMap(): void {
    flatNodesMap.value.clear();

    const traverse = (components: Component[], level: number, parentId: string | null): void => {
      components.forEach((comp: Component) => {
        const cachedChildren = childrenCache.value.get(comp.id);

        const node: BomTreeNode = {
          id: comp.id,
          componentCode: comp.componentCode,
          componentName: comp.componentName,
          sap: comp.sap,
          specificationDescription: comp.specificationDescription,
          category: comp.category,
          revision: comp.revision,
          quantity: comp.quantity,
          unit: comp.unit,
          hasChildren: comp.hasChildren,
          level,
          expanded: expandedNodes.value.has(comp.id),
          checked: checkedNodes.value.has(comp.id),
          parentId,
          isLeaf: !comp.hasChildren,
          isLoading: loadingNodes.value.has(comp.id),
          isLoaded: childrenCache.value.has(comp.id),
          children: []
        };

        flatNodesMap.value.set(comp.id, node);

        // 递归处理已加载的子节点
        if (cachedChildren) {
          traverse(cachedChildren, level + 1, comp.id);
        }
      });
    };

    traverse(displayRootNodes.value, 0, null);
  }

  /**
   * 更新扁平化映射中的单个节点
   */
  function updateNodeInFlatMap(nodeId: string, detail: Component): void {
    const existingNode = flatNodesMap.value.get(nodeId);
    if (existingNode) {
      const updatedNode: BomTreeNode = {
        id: detail.id,
        componentCode: detail.componentCode,
        componentName: detail.componentName,
        sap: detail.sap,
        specificationDescription: detail.specificationDescription,
        category: detail.category,
        revision: detail.revision,
        quantity: detail.quantity,
        unit: detail.unit,
        hasChildren: detail.hasChildren,
        level: existingNode.level,
        expanded: existingNode.expanded,
        checked: existingNode.checked,
        parentId: existingNode.parentId,
        isLeaf: !detail.hasChildren,
        isLoading: existingNode.isLoading,
        isLoaded: existingNode.isLoaded,
        children: existingNode.children,
      };

      flatNodesMap.value.set(nodeId, updatedNode);
    }
  }

  /**
   * 加载子节点后更新扁平化映射
   */
  function updateFlatMapForChildren(parentId: string, children: Component[]): void {
    const parentNode = flatNodesMap.value.get(parentId);
    if (!parentNode) return;

    const childLevel = parentNode.level + 1;

    children.forEach((child: Component) => {
      if (!child || !child.id) return;

      const hasLoadedGrandchildren = childrenCache.value.has(child.id);

      const node: BomTreeNode = {
        id: child.id,
        componentCode: child.componentCode,
        componentName: child.componentName,
        sap: child.sap,
        specificationDescription: child.specificationDescription,
        category: child.category,
        revision: child.revision,
        quantity: child.quantity,
        unit: child.unit,
        hasChildren: child.hasChildren,
        level: childLevel,
        expanded: expandedNodes.value.has(child.id),
        checked: checkedNodes.value.has(child.id),
        parentId,
        isLeaf: !child.hasChildren,
        isLoading: false,
        isLoaded: hasLoadedGrandchildren,
        children: []
      };

      flatNodesMap.value.set(child.id, node);

      // 如果子节点的子节点也已经加载，递归更新
      if (hasLoadedGrandchildren) {
        const grandchildren = childrenCache.value.get(child.id) || [];
        updateFlatMapForChildren(child.id, grandchildren);
      }
    });
  }

  /**
   * 切换节点展开/折叠（懒加载模式）
   */
  async function toggleNode(nodeId: string): Promise<void> {
    const node = flatNodesMap.value.get(nodeId);
    if (!node) return;

    if (expandedNodes.value.has(nodeId)) {
      // 折叠
      expandedNodes.value.delete(nodeId);
    } else {
      // 展开
      expandedNodes.value.add(nodeId);

      // 如果节点有子节点且未加载，则加载
      if (node.hasChildren && !childrenCache.value.has(nodeId)) {
        try {
          await fetchChildren(nodeId);
        } catch (err) {
          // 加载失败时取消展开
          expandedNodes.value.delete(nodeId);
          throw err;
        }
      }
    }
  }

  /**
   * 展开节点（带懒加载）
   */
  async function expandNode(nodeId: string): Promise<void> {
    const node = flatNodesMap.value.get(nodeId);
    if (!node || expandedNodes.value.has(nodeId)) return;

    expandedNodes.value.add(nodeId);

    if (node.hasChildren && !childrenCache.value.has(nodeId)) {
      try {
        await fetchChildren(nodeId);
      } catch (err) {
        expandedNodes.value.delete(nodeId);
        throw err;
      }
    }
  }

  /**
   * 递归展开节点及其所有子节点
   */
  async function expandNodeRecursively(nodeId: string): Promise<void> {
    await expandNode(nodeId);

    const children = childrenCache.value.get(nodeId) || [];
    for (const child of children) {
      if (child.hasChildren) {
        await expandNodeRecursively(child.id);
      }
    }
  }

  /**
   * 展开所有节点（仅当前视图）
   */
  async function expandAll(): Promise<void> {
    const expandRecursive = async (components: Component[]): Promise<void> => {
      for (const comp of components) {
        expandedNodes.value.add(comp.id);

        if (comp.hasChildren) {
          // 加载子节点
          if (!childrenCache.value.has(comp.id)) {
            await fetchChildren(comp.id);
          }

          const children = childrenCache.value.get(comp.id) || [];
          await expandRecursive(children);
        }
      }
    };

    await expandRecursive(displayRootNodes.value);
  }

  /**
   * 折叠节点及其所有子节点
   */
  function collapseNode(nodeId: string): void {
    expandedNodes.value.delete(nodeId);

    // 递归折叠所有子节点
    const collapseRecursive = (parentId: string): void => {
      const children = childrenCache.value.get(parentId) || [];
      children.forEach((child: Component) => {
        expandedNodes.value.delete(child.id);
        if (childrenCache.value.has(child.id)) {
          collapseRecursive(child.id);
        }
      });
    };

    collapseRecursive(nodeId);
  }

  /**
   * 折叠所有节点
   */
  function collapseAll(): void {
    expandedNodes.value.clear();
  }

  /**
   * 展开到指定层级
   */
  async function expandToLevel(maxLevel: number): Promise<void> {
    expandedNodes.value.clear();

    const expandToTargetLevel = async (components: Component[], currentLevel: number): Promise<void> => {
      if (currentLevel >= maxLevel) return;

      for (const comp of components) {
        expandedNodes.value.add(comp.id);

        if (comp.hasChildren && currentLevel < maxLevel - 1) {
          // 加载子节点
          if (!childrenCache.value.has(comp.id)) {
            await fetchChildren(comp.id);
          }

          const children = childrenCache.value.get(comp.id) || [];
          await expandToTargetLevel(children, currentLevel + 1);
        }
      }
    };

    await expandToTargetLevel(displayRootNodes.value, 0);
  }

  /**
   * 预加载指定节点的子节点（不展开）
   */
  async function preloadChildren(nodeId: string): Promise<void> {
    const node = flatNodesMap.value.get(nodeId);
    if (node && node.hasChildren && !childrenCache.value.has(nodeId)) {
      await fetchChildren(nodeId);
    }
  }

  /**
   * 加载完整路径（从当前视图根到指定节点）
   */
  async function loadNodePath(nodeId: string): Promise<void> {
    const path = getNodePath(nodeId);

    for (const node of path) {
      if (node.hasChildren && !childrenCache.value.has(node.id)) {
        await fetchChildren(node.id);
      }
      expandedNodes.value.add(node.id);
    }
  }

  /**
   * 切换节点选中状态
   */
  function toggleChecked(nodeId: string): void {
    if (checkedNodes.value.has(nodeId)) {
      checkedNodes.value.delete(nodeId);
    } else {
      checkedNodes.value.add(nodeId);
    }
  }

  /**
   * 设置节点选中状态
   */
  function setChecked(nodeId: string, checked: boolean): void {
    if (checked) {
      checkedNodes.value.add(nodeId);
    } else {
      checkedNodes.value.delete(nodeId);
    }
  }

  /**
   * 选中所有子节点
   */
  async function checkAllChildren(nodeId: string): Promise<void> {
    // 确保子节点已加载
    if (!childrenCache.value.has(nodeId)) {
      await fetchChildren(nodeId);
    }

    const children = childrenCache.value.get(nodeId) || [];
    for (const child of children) {
      checkedNodes.value.add(child.id);
      if (child.hasChildren) {
        await checkAllChildren(child.id);
      }
    }
  }

  /**
   * 清空所有选中
   */
  function clearChecked(): void {
    checkedNodes.value.clear();
  }

  /**
   * 设置搜索关键词
   */
  async function setSearchKeyword(keyword: string): Promise<void> {
    searchKeyword.value = keyword;

    // 搜索时预加载匹配节点的父路径
    if (keyword.trim()) {
      await preloadForSearch(keyword.toLowerCase());
    }
  }

  /**
   * 为搜索预加载必要的节点
   */
  async function preloadForSearch(keyword: string): Promise<void> {
    const nodesToLoad = new Set<string>();

    // 查找匹配的节点
    flatNodesMap.value.forEach((node: BomTreeNode, id: string) => {
      if (isNodeMatch(node, keyword)) {
        // 收集需要加载的父节点
        let currentNode: BomTreeNode | undefined = node;
        while (currentNode?.parentId) {
          const parentNode = flatNodesMap.value.get(currentNode.parentId);
          if (parentNode && parentNode.hasChildren && !childrenCache.value.has(parentNode.id)) {
            nodesToLoad.add(parentNode.id);
          }
          currentNode = parentNode;
        }
      }
    });

    // 加载这些节点的子节点
    for (const nodeId of nodesToLoad) {
      await fetchChildren(nodeId);
    }
  }

  /**
   * 判断节点是否匹配搜索关键词
   */
  function isNodeMatch(node: ComponentBase, keyword: string): boolean {
    return (
      node.componentName.toLowerCase().includes(keyword) ||
      node.componentCode.toLowerCase().includes(keyword) ||
      node.sap.toLowerCase().includes(keyword) ||
      node.specificationDescription.toLowerCase().includes(keyword) ||
      node.category.toLowerCase().includes(keyword)
    );
  }

  /**
   * 过滤树（搜索）
   */
  function filterTree(nodes: BomTreeNode[], keyword: string): BomTreeNode[] {
    return nodes.reduce<BomTreeNode[]>((filtered, node) => {
      const isMatch = isNodeMatch(node, keyword);

      // 搜索时展开匹配的节点
      if (isMatch) {
        const updatedNode: BomTreeNode = { ...node, expanded: true };

        // 如果子节点已加载，也要过滤子节点
        if (node.children.length > 0) {
          updatedNode.children = filterTree(node.children, keyword);
        }

        filtered.push(updatedNode);
      } else if (node.children.length > 0) {
        // 节点本身不匹配，但检查子节点
        const filteredChildren = filterTree(node.children, keyword);
        if (filteredChildren.length > 0) {
          filtered.push({
            ...node,
            expanded: true,
            children: filteredChildren
          });
        }
      }

      return filtered;
    }, []);
  }

  /**
   * 获取节点的路径（从当前视图根到该节点）
   */
  function getNodePath(nodeId: string): BomTreeNode[] {
    const path: BomTreeNode[] = [];
    let currentNode: BomTreeNode | undefined = flatNodesMap.value.get(nodeId);

    while (currentNode) {
      path.unshift(currentNode);
      if (currentNode.parentId) {
        currentNode = flatNodesMap.value.get(currentNode.parentId);
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * 根据ID查找节点
   */
  function findNodeById(nodeId: string): BomTreeNode | undefined {
    return flatNodesMap.value.get(nodeId);
  }

  /**
   * 获取节点详情（优先从缓存）
   */
  function getNodeDetail(nodeId: string): Component | undefined {
    return nodeDetailCache.value.get(nodeId);
  }

  /**
   * 判断节点是否正在加载
   */
  function isNodeLoading(nodeId: string): boolean {
    return loadingNodes.value.has(nodeId);
  }

  /**
   * 判断节点的子节点是否已加载
   */
  function isNodeLoaded(nodeId: string): boolean {
    return childrenCache.value.has(nodeId);
  }

  /**
   * 获取节点统计信息
   */
  function getNodeStats() {
    const stats = {
      viewMode: viewMode.value,
      currentRootId: currentRootId.value,
      total: flatNodesMap.value.size,
      loadedDetailNodes: nodeDetailCache.value.size,
      loadedChildrenNodes: childrenCache.value.size,
      loadingNodes: loadingNodes.value.size,
      maxDepth: 0,
      checkedCount: checkedNodes.value.size,
      expandedCount: expandedNodes.value.size,
      categoryCount: new Map<string, number>()
    };

    flatNodesMap.value.forEach((node: BomTreeNode) => {
      stats.maxDepth = Math.max(stats.maxDepth, node.level);
      const count = stats.categoryCount.get(node.category) || 0;
      stats.categoryCount.set(node.category, count + 1);
    });

    return stats;
  }

  /**
   * 刷新 - 根据当前视图模式刷新
   */
  async function refresh(): Promise<void> {
    if (viewMode.value === 'full') {
      await initFullTree(true);
    } else if (currentRootId.value) {
      await loadSubTree(currentRootId.value);
    }
  }

  /**
   * 清空store
   */
  function clearStore(): void {
    rootNodes.value = [];
    nodeDetailCache.value = new Map<string, Component>();
    childrenCache.value = new Map<string, Component[]>();
    fullTreeInitialized.value = false;
    viewMode.value = 'full';
    currentRootId.value = null;
    expandedNodes.value = new Set<string>();
    checkedNodes.value = new Set<string>();
    searchKeyword.value = '';
    flatNodesMap.value = new Map<string, BomTreeNode>();
    loading.value = false;
    loadingNodes.value = new Set<string>();
    error.value = null;
  }

  // ============ 导出 ============
  return {
    // 状态
    rootNodes,
    initialized: fullTreeInitialized,
    viewMode,
    currentRootId,
    loading,
    loadingNodes,
    childrenCache,
    error,
    expandedNodes,
    checkedNodes,
    searchKeyword,

    // 计算属性
    bomTree,
    filteredBomTree,
    selectedNodes,
    leafNodes,

    // 方法
    initFullTree,
    loadSubTree,
    switchToFullTree,
    fetchNodeDetail,
    fetchChildren,
    toggleNode,
    expandNode,
    expandNodeRecursively,
    expandAll,
    collapseNode,
    collapseAll,
    expandToLevel,
    preloadChildren,
    loadNodePath,
    toggleChecked,
    setChecked,
    checkAllChildren,
    clearChecked,
    setSearchKeyword,
    findNodeById,
    getNodeDetail,
    getNodePath,
    isNodeLoading,
    isNodeLoaded,
    getNodeStats,
    refresh,
    clearStore,
  };
});
