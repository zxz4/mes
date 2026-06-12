<template>
  <div class="bom-viewer">
    <!-- 视图模式切换 -->
    <div class="view-controls">
      <button
        :class="{ active: bomStore.viewMode === 'full' }"
        @click="handleSwitchToFullTree"
      >
        完整BOM树
      </button>
      <div class="node-input">
        <input
          v-model="nodeId"
          placeholder="输入节点ID"
          @keyup.enter="handleLoadSubTree"
        />
        <button @click="handleLoadSubTree">加载子树</button>
      </div>
    </div>

    <!-- 当前视图信息 -->
    <div class="view-info" v-if="bomStore.viewMode === 'partial'">
      <span>当前查看子树: {{ bomStore.currentRootId }}</span>
      <button @click="handleSwitchToFullTree">返回完整树</button>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <input
        v-model="searchText"
        placeholder="搜索..."
        @input="handleSearch"
      />
      <button @click="bomStore.expandAll">展开全部</button>
      <button @click="bomStore.collapseAll">折叠全部</button>
      <button @click="bomStore.refresh">刷新</button>
    </div>

    <!-- BOM树 -->
    <bom-tree
      v-if="bomStore.bomTree.length > 0"
      :nodes="bomStore.filteredBomTree"
      @toggle="handleToggle"
      @check="handleCheck"
    />

    <!-- 统计信息 -->
    <div class="stats" v-if="bomStore.bomTree.length > 0">
      <p>视图模式: {{ bomStore.viewMode }}</p>
      <p>节点总数: {{ stats.total }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBomStore } from '@/store/bom';

const bomStore = useBomStore();
const searchText = ref('');
const nodeId = ref('');

const stats = computed(() => bomStore.getNodeStats());

// 场景1: 加载完整BOM树
onMounted(async () => {
  await bomStore.initFullTree();
});

// 场景2: 加载指定节点的子树
async function handleLoadSubTree() {
  if (nodeId.value.trim()) {
    try {
      await bomStore.loadSubTree(nodeId.value.trim());
    } catch (err) {
      console.error('Failed to load sub tree:', err);
    }
  }
}

// 场景3: 切换回完整树
async function handleSwitchToFullTree() {
  await bomStore.switchToFullTree();
}

async function handleToggle(nodeId: string) {
  try {
    await bomStore.toggleNode(nodeId);
  } catch (err) {
    console.error('Failed to toggle node:', err);
  }
}

function handleCheck(nodeId: string) {
  bomStore.toggleChecked(nodeId);
}

function handleSearch() {
  bomStore.setSearchKeyword(searchText.value);
}
</script>
