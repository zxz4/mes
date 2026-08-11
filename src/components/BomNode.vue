<!-- components/BomNode.vue -->
<template>
  <view class="bom-node" :style="{ paddingLeft: 16 + level * 24 + 'px' }" @click="handleClick">
    <view class="node-inner">
      <view class="node-content">
        <view class="node-main">
          <view class="node-left">
            <text class="node-name">
              <IconFont v-show="hasChildren" size="12" name="rect-right" :class="{ open: expanded }" />
              {{ node.componentName }}
            </text>
            <text class="node-code">{{ node.componentCode }}</text>
            <view class="sap-badge" @click.stop="copySap">
              <text class="copy-icon">📋</text>
              <text>SAP {{ node.sap }}</text>
            </view>
          </view>
          <view v-show="node.unit" class="node-qty">
            <text>{{ node.quantity }}</text>
            <text class="node-unit">{{ node.unit }}</text>
          </view>
        </view>

        <!-- 规格描述 -->
        <view v-show="node.specificationDescription" class="node-spec">
          <text class="spec-text" :class="{ expanded: specExpanded }" @click.stop="toggleSpec">{{ displaySpec }}</text>
          <text v-show="node.specificationDescription.length > 60" class="spec-toggle" @click.stop="toggleSpec">{{
            specExpanded ? '收起' : '展开' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { BomItem } from '@/types/bom';
import Taro from '@tarojs/taro';
import { IconFont } from '@nutui/icons-vue-taro';

const props = defineProps<{
  node: BomItem;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
}>();

const specExpanded = ref(false);

const displaySpec = computed(() => {
  const full = props.node.specificationDescription || '';
  return specExpanded.value || full.length <= 60 ? full : full.substring(0, 60) + '...';
});

const handleClick = () => {
  if (props.hasChildren) {
    emit('toggle');
  }
};

const toggleSpec = () => {
  specExpanded.value = !specExpanded.value;
};

const copySap = () => {
  return Taro.setClipboardData({
    data: props.node.sap || ''
  });
};
</script>

<style scoped>
.bom-node {
  padding: 6px 0;
}

.node-inner {
  background: #fff;
  border-radius: 12px;
  padding: 12px 12px 12px 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
  transition: background 0.15s;
}

.node-inner:active {
  background: #f9fafb;
}


.open {
  transform: rotate(90deg);
}



.node-content {
  flex: 1;
  min-width: 0;
}

.node-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.node-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.node-name {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
  word-break: break-word;
}

.node-code {
  font-size: 12px;
  color: #969ba6;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.sap-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e8f0fe;
  color: #2b7de9;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.1s;
  margin-left: 4px;
}

.sap-badge:active {
  transform: scale(0.95);
  background: #d0e0fc;
}

.copy-icon {
  font-size: 13px;
  opacity: 0.8;
}

.node-qty {
  font-weight: 600;
  font-size: 14px;
  color: #1a1d23;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-unit {
  font-size: 11px;
  color: #969ba6;
  font-weight: 400;
}

.node-spec {
  margin-top: 6px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.spec-text {
  font-size: 12px;
  color: #64748b;
  word-break: break-all;
  display: -webkit-box;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spec-text.expanded {
  line-clamp: unset;
  display: block;
}

.spec-toggle {
  font-size: 11px;
  color: #2b7de9;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  padding: 1px 4px;
}

.spec-toggle:active {
  opacity: 0.7;
}
</style>
