<template>
  <view class="product-trace-page" v-if="rootNode">
    <!-- 顶部产品信息 -->
    <view class="product-hero">
      <view class="hero-row">
        <view class="hero-left">
          <text class="hero-name">{{ rootNode.materialName }}</text>
          <text class="hero-sub">批次 {{ rootNode.lotNumber }} · SAP {{ rootNode.materialSap }}</text>
        </view>
        <text class="hero-badge">{{ statusLabel(rootNode.status) }}</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="hero-val">{{ totalNodes }}</text>
          <text class="hero-lbl">组件总数</text>
        </view>
        <view class="hero-stat">
          <text class="hero-val">{{ totalSteps }}</text>
          <text class="hero-lbl">工序记录</text>
        </view>
        <view class="hero-stat">
          <text class="hero-val warn">{{ abnormalCount }}</text>
          <text class="hero-lbl">异常</text>
        </view>
      </view>
    </view>

    <!-- 装配树 -->
    <view class="tree-card">
      <text class="card-title">📦 生产历史追溯</text>
      <TraceNode :node="rootNode" :level="0" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getProductTrace } from '@/apis/prod'; // 替换为实际API
import type { TraceTreeNode } from '@/types/work-order';
import TraceNode from '@/components/TraceNode.vue';
import { getCurrentInstance, navigateTo, showToast } from '@tarojs/taro';
import { getProductStatusText } from '@/utils/statusText';
const rootNode = ref<TraceTreeNode>();

// 获取数据
onMounted(async () => {
  const instance = getCurrentInstance();
  const id = instance?.router?.params?.id as string;
  if (!id) {
    showToast({ title: '参数有误,id不能为空', icon: 'none' });
    setTimeout(() => {
      navigateTo({ url: '/pages/work/order-list' });
    }, 2000);
    return;
  }
  rootNode.value = await getProductTrace(id);
});

// 递归统计
const countNodes = (node: TraceTreeNode): number => {
  let count = 1;
  node.children.forEach(c => count += countNodes(c));
  return count;
};
const countSteps = (node: TraceTreeNode): number => {
  let steps = node.processHistory?.length || 0;
  node.children.forEach(c => steps += countSteps(c));
  return steps;
};
const countAbnormal = (node: TraceTreeNode): number => {
  let abnormal = node.processHistory?.filter(p => p.isAbnormal).length || 0;
  node.children.forEach(c => abnormal += countAbnormal(c));
  return abnormal;
};

const totalNodes = computed(() => {
  if (!rootNode.value) return 0;
  return countNodes(rootNode.value);
});
const totalSteps = computed(() => {
  if (!rootNode.value) return 0;
  return countSteps(rootNode.value);
});
const abnormalCount = computed(() => {
  if (!rootNode.value) return 0;
  return countAbnormal(rootNode.value);
});

const statusLabel = (status: string) => {
  return getProductStatusText(status);
};
</script>

<style scoped>
.product-trace-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 12px 14px 24px;
}

.product-hero {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 18px;
  margin-bottom: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border-left: 4px solid #2b7de9;
}

.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1d23;
}

.hero-sub {
  font-size: 13px;
  color: #5f6673;
}

.hero-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  background: #e8f8ef;
  color: #1f7b3b;
}

.hero-stats {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-val {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.hero-val.warn {
  color: #e8553d;
}

.hero-lbl {
  font-size: 11px;
  color: #969ba6;
}

.tree-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d23;
  margin-bottom: 16px;
}
</style>
