<!-- components/MaterialInfoCard.vue -->
<template>
  <view class="material-info-wrapper">
    <!-- 已绑定状态 -->
    <view class="material-card" v-if="material">
      <view class="material-card-header">
        <view class="material-status-dot" :class="statusDotClass"></view>
        <text class="material-card-title">{{ material.name }}</text>
        <nut-button v-show="showUnbind" size="mini" plain type="default" class="unbind-btn" @click="handleUnbind">
          {{ unbindText }}
        </nut-button>
      </view>

      <view class="material-card-body">
        <view class="material-info-row">
          <text class="material-label">SAP</text>
          <SapText :sap="material.sap" class="material-value" />
        </view>
        <view class="material-info-row" v-show="material.lotNumber">
          <text class="material-label">SN</text>
          <text class="material-value">{{ material.lotNumber }}</text>
        </view>
        <view class="material-info-row" v-show="material.specification">
          <text class="material-label">规格</text>
          <text class="material-value">{{ material.specification }}</text>
        </view>

        <!-- 插槽：扩展信息（如状态、可执行工序等） -->
        <slot name="extra" :material="material"></slot>
      </view>
    </view>

    <!-- 未绑定状态 -->
    <view class="material-placeholder" v-else>
      <view class="placeholder-icon">{{ placeholderIcon }}</view>
      <text class="placeholder-title">{{ placeholderTitle }}</text>
      <text class="placeholder-desc">{{ placeholderDesc }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SapText from '@/components/SapText.vue';

export interface MaterialInfo {
  name: string;
  sap: string;
  lotNumber?: string;
  specification?: string;
  status?: string;
  [key: string]: any;
}

const props = withDefaults(defineProps<{
  material: MaterialInfo | null;
  title?: string;
  showUnbind?: boolean;
  unbindText?: string;
  placeholderIcon?: string;
  placeholderTitle?: string;
  placeholderDesc?: string;
  status?: string;
}>(), {
  title: '已绑定物料',
  showUnbind: true,
  unbindText: '解绑',
  placeholderIcon: '📱',
  placeholderTitle: '尚未绑定物料',
  placeholderDesc: '请扫描物料条码进行绑定',
});

const emit = defineEmits<{
  (e: 'unbind'): void;
}>();

const handleUnbind = () => {
  emit('unbind');
};

const statusDotClass = computed(() => {
  const status = props.status ?? props.material?.status ?? '';

  const map = {
    'AwaitNext': 'dot-process',
    'Passed': 'dot-done',
    'Consumed': 'dot-gray',
    'Scrapped': 'dot-ng',
  };
  return map[status] || 'dot-default';
});
</script>

<style type="css">
.material-info-wrapper {
  width: 100%;
}

/* 已绑定卡片 */
.material-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  border-left: 4px solid #2ca85c;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.material-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.material-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 状态圆点颜色 + 呼吸动画（仅激活/处理中状态） */
.dot-default {
  background: #2ca85c;
  animation: breathe 2s infinite ease-in-out;
}

.dot-process {
  background: #3b82f6;
  animation: breathe 2s infinite ease-in-out;
}

.dot-done {
  background: #2ca85c;
}

.dot-gray {
  background: #6b7280;
}

.dot-ng {
  background: #e8553d;
}

@keyframes breathe {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.4);
  }
}

.material-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.unbind-btn {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  color: #999;
  border-color: #ddd;
}

.material-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.material-label {
  font-size: 14px;
  color: #999;
  width: 52px;
  flex-shrink: 0;
}

.material-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex: 1;
  word-break: break-all;
}

.material-value.highlight {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 14px;
}

/* 未绑定占位 */
.material-placeholder {
  background: #fff;
  border-radius: 14px;
  padding: 28px 16px;
  text-align: center;
  border: 2px dashed #d0d5dd;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.placeholder-icon {
  font-size: 36px;
  margin-bottom: 4px;
}

.placeholder-title {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.placeholder-desc {
  font-size: 12px;
  color: #aaa;
}
</style>
