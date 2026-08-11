<template>
  <view class="bom-page">
    <NavBar title="BOM 物料清单" :show-back="true" />

    <view class="search-bar">
      <nut-searchbar name="filter" v-model="searchKey" placeholder="输入SAP/名称筛选物料" @change="doFilter" @search="onSearch"
        @clear="onClear" />
    </view>

    <view class="tree-card">
      <view class="tree-title">
        <text>📋 物料清单</text>
        <text class="tree-count">{{ totalCount }} 个组件</text>
      </view>

      <view v-show="!filteredRoot" class="empty-tip">未找到匹配的物料</view>

      <nut-list v-show="filteredRoot" ref="scrollContainer" :height="listHeight" :list-data="flatList" item-height="80"
        container-tag="view" item-tag="view">
        <template #default="{ item }">
          <BomNode :key="item.data.id" :node="item.data" :level="item.level" :expanded="item.expanded"
            :has-children="item.hasChildren" @toggle="toggleNode(item.data.id)" />
        </template>
      </nut-list>
    </view>

    <view class="footer">共 {{ totalCount }} 个物料组件</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Taro, { getCurrentInstance } from '@tarojs/taro';
import BomNode from '@/components/BomNode.vue';
import type { BomItem } from '@/types/bom';
import { getMaterialTree } from '@/apis/bom';

// 原始数据
const bomData = ref<BomItem | null>(null);

// 搜索关键词（输入框绑定值）
const searchKey = ref('');
// 过滤后的树（手动更新，避免 computed 实时递归）
const filteredRoot = ref<BomItem | null>(null);

// 展开/折叠状态
const collapsedIds = ref<Set<string>>(new Set());

// 拍平结构
interface FlatItem {
  data: BomItem;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
}

const flatList = computed<FlatItem[]>(() => {
  if (!filteredRoot.value) return [];
  const result: FlatItem[] = [];
  const traverse = (node: BomItem, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = hasChildren && !collapsedIds.value.has(node.id);
    result.push({ data: node, level, expanded, hasChildren });
    if (expanded && node.children) {
      node.children.forEach((child) => traverse(child, level + 1));
    }
  };
  traverse(filteredRoot.value, 0);
  return result;
});

// 组件总数
const totalCount = computed(() => {
  if (!filteredRoot.value) return 0;
  const countNodes = (node: BomItem): number => {
    let count = 1;
    if (node.children) {
      node.children.forEach((child) => (count += countNodes(child)));
    }
    return count;
  };
  return countNodes(filteredRoot.value);
});

// 列表高度（适配小程序/ H5 屏幕高度）
const listHeight = computed(() => {
  try {
    const systemInfo = Taro.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    // 减去导航栏、搜索栏、标题栏、底部栏等固定高度（估计值）
    const fixHeight = 44 + 48 + 50 + 40; // 可根据实际调整
    return systemInfo.windowHeight - statusBarHeight - fixHeight;
  } catch {
    return 600; // 兜底高度
  }
});

// 防抖搜索
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const doFilter = (keyword: string) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    filteredRoot.value = keyword.trim()
      ? filterTree(bomData.value, keyword.trim())
      : bomData.value;
  }, 700);
};

// 搜索事件（回车或点击搜索按钮）
const onSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  filteredRoot.value = searchKey.value.trim()
    ? filterTree(bomData.value, searchKey.value.trim())
    : bomData.value;
};

// 清除搜索
const onClear = () => {
  searchKey.value = '';
  filteredRoot.value = bomData.value;
};

// 切换节点展开
const toggleNode = (nodeId: string) => {
  const newSet = new Set(collapsedIds.value);
  if (newSet.has(nodeId)) {
    newSet.delete(nodeId);
  } else {
    newSet.add(nodeId);
  }
  collapsedIds.value = newSet;
};

// 过滤树（保留符合关键字的节点及其祖先）
const filterTree = (node: BomItem | null, keyword: string): BomItem | null => {
  if (!node) return null;
  const lowerKey = keyword.toLowerCase();
  const selfMatch =
    (node.sap && node.sap.toLowerCase().includes(lowerKey)) ||
    (node.componentName && node.componentName.toLowerCase().includes(lowerKey)) ||
    (node.componentCode && node.componentCode.toLowerCase().includes(lowerKey));

  if (node.children && node.children.length > 0) {
    const filteredChildren = node.children
      .map((child) => filterTree(child, keyword))
      .filter((c) => c !== null) as BomItem[];
    if (filteredChildren.length > 0 || selfMatch) {
      return { ...node, children: filteredChildren };
    }
  }

  return selfMatch ? { ...node, children: [] } : null;
};

// 初始化数据
onMounted(async () => {
  const instance = getCurrentInstance();
  const sap = instance?.router?.params?.sap as string || instance?.router?.params?.id as string;
  if (sap) {
    const raw = await getMaterialTree(sap);
    bomData.value = raw;
    filteredRoot.value = raw; // 初始展示完整树
  }
});
</script>

<style scoped>
.bom-page {
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
}

.search-bar {
  background: #fff;
  padding: 6px 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.tree-card {
  background: #fff;
  flex: 1;
  padding: 12px 0;
}

.tree-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d23;
  padding: 0 16px 12px;
  border-bottom: 1px solid #eef0f4;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-count {
  font-size: 13px;
  font-weight: 400;
  color: #969ba6;
}

.empty-tip {
  text-align: center;
  padding: 40px 16px;
  color: #969ba6;
  font-size: 14px;
}

.footer {
  text-align: center;
  padding: 12px 0;
  font-size: 12px;
  color: #bcc3cf;
  background: #f5f6f8;
}
</style>