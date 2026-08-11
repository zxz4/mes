<template>
  <view>
    <!-- 当前节点主体 -->
    <view class="node-bar" :style="{ marginLeft: level * 20 + 'px' }" @click="toggleExpand">
      <view class="node-content">
        <text class="node-title">{{ node.materialName }}</text>
        <view class="node-meta">
          <text class="meta-text">批次 {{ node.lotNumber }}</text>
          <text class="meta-text">SAP {{ node.materialSap }}</text>
          <text class="node-status" :class="statusClass(node.status)">{{ statusLabel(node.status) }}</text>
        </view>
      </view>
      <text class="arrow" :class="{ open: expanded }">▼</text>
    </view>

    <!-- 展开内容 -->
    <view v-if="expanded" class="node-detail" :style="{ marginLeft: level * 20 + 10 + 'px' }">
      <!-- 加工历史 -->
      <view v-if="node.processHistory && node.processHistory.length" class="history-section">
        <text class="detail-title">📋 加工过程</text>
        <view class="step-row" v-for="(step, i) in node.processHistory" :key="i">
          <text class="step-dot" :class="step.isAbnormal ? 'ng' : 'pass'"></text>
          <text class="step-code">{{ step.operationCode }}</text>
          <text class="step-name">{{ step.operationName }}</text>
          <text class="step-badge" :class="step.isAbnormal ? 'ng' : 'pass'">
            {{ step.isAbnormal ? 'NG' : 'PASS' }}
          </text>
        </view>
      </view>

      <!-- 子节点递归 -->
      <view v-if="node.children && node.children.length">
        <TraceNode v-for="child in node.children" :key="child.rootId" :node="child" :level="level + 1" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TraceTreeNode } from '@/types/work-order';
import { getProductStatusText } from '@/utils/statusText';

const props = defineProps<{
  node: TraceTreeNode;
  level: number; // 层级深度，用于缩进
}>();

const expanded = ref(props.level === 0); // 默认展开根节点

const toggleExpand = () => {
  expanded.value = !expanded.value;
};

const statusLabel = (status: string) => {
  return getProductStatusText(status);
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    'Created': 'ok', 'AwaitNext': 'ok', 'Passed': 'ok',
    'Consumed': 'gray', 'Scrapped': 'ng',
  };
  return map[status] || '';
};
</script>

<style scoped>
.node-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fafbfc;
  border-radius: 10px;
  border: 1px solid #eef0f4;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.node-bar:active {
  background: #f3f5f8;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.node-title {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.node-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.meta-text {
  font-size: 14px;
  color: #969ba6;
}

.node-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #6b7280;
}

.node-status.ok {
  background: #eafaf4;
  color: #22b07d;
}

.node-status.ng {
  background: #fef4f2;
  color: #e8553d;
}

.arrow {
  font-size: 14px;
  color: #bcc3cf;
  transition: transform 0.2s;
  margin-left: 8px;
}

.arrow.open {
  transform: rotate(180deg);
}

.node-detail {
  border-left: 2px solid #e2e8f0;
  padding-left: 10px;
  margin-bottom: 8px;
}

.history-section {
  margin-bottom: 10px;
}

.detail-title {
  font-size: 14px;
  font-weight: 700;
  color: #4a5568;
  margin-bottom: 6px;
  display: block;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #f3f5f8;
  font-size: 14px;
}

.step-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #d1d5db;
}

.step-dot.pass {
  background: #22b07d;
}

.step-dot.ng {
  background: #e8553d;
}

.step-code {
  font-weight: 700;
  color: #1e293b;
  min-width: 48px;
  font-size: 14px;
}

.step-name {
  color: #64748b;
  flex: 1;
  font-size: 14px;
}

.step-badge {
  font-weight: 700;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 8px;
}

.step-badge.pass {
  background: #eafaf4;
  color: #22b07d;
}

.step-badge.ng {
  background: #fef4f2;
  color: #e8553d;
}
</style>
