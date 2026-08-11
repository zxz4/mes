<template>
  <view class="order-card" @click="handleClick">
    <view class="card-header">
      <view class="header-left">
        <text class="order-code">{{ order.code }}</text>
        <text class="order-name">{{ order.name }}</text>
      </view>
      <text class="status-tag" :class="statusClass(order.status)">
        {{ statusLabel(order.status) }}
      </text>
    </view>

    <view class="card-body">
      <view class="info-row">
        <text class="info-label">产品名称</text>
        <text class="info-value">{{ order.productName }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">产品SAP</text>
        <SapText :sap="order.productSap" />
      </view>
      <view class="info-row">
        <text class="info-label">计划数量</text>
        <text class="info-value">{{ order.plannedQty }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">完成数量</text>
        <text class="info-value highlight">{{ order.completedQty }}</text>
      </view>
    </view>

    <view class="card-footer">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="progress-text">{{ progressPercent }}%</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SapText from '@/components/SapText.vue';
import { getOrderStatusText } from "@/utils/statusText";

export interface OrderCardData {
  id: string;
  code: string;
  name: string;
  productName: string;
  productSap: string;
  plannedQty: number;
  completedQty: number;
  status: string;
}

const props = defineProps<{
  order: OrderCardData;
}>();

const emit = defineEmits<{
  (e: 'click', id: string): void;
}>();

const handleClick = () => {
  emit('click', props.order.id);
};

const progressPercent = computed(() => {
  if (props.order.plannedQty === 0) return 0;
  return Math.min(Math.round((props.order.completedQty / props.order.plannedQty) * 100), 100);
});

const statusLabel = (status: string) => {
  return getOrderStatusText(status);
};

const statusClass = (status: string) => {
  const map = {
    'Pending': 'status-pending',
    'Processing': 'status-processing',
    'Exception': 'status-exception',
    'Completed': 'status-completed',
  };
  return map[status] || 'status-pending';
};
</script>

<style scoped>
.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.1s;
}

.order-card:active {
  background: #f9fafb;
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

@media (hover: hover) {
  .order-card:hover {
    background: #f5f5f5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.order-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-code {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.order-name {
  font-size: 14px;
  color: #777;
}

.status-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.status-pending {
  background: #f3f4f6;
  color: #6b7280;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-exception {
  background: #fee2e2;
  color: #dc2626;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #999;
  width: 64px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}


.info-value.highlight {
  font-weight: 700;
  color: #2b7de9;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2b7de9;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #555;
  font-weight: 600;
  min-width: 32px;
  text-align: right;
}
</style>
