<template>
  <view class="product-card" :class="{ active }" @click="emit('click')">
    <view class="product-header">
      <span class="product-name">{{ product.productName }}</span>
      <span class="status-tag" :class="product.status">
        {{ statusText }}
      </span>
    </view>
    <view class="product-info-grid">
      <view class="info-item">
        <span class="info-label">SAP码</span>
        <span class="info-value highlight">{{ product.sap }}</span>
      </view>
      <view class="info-item">
        <span class="info-label">批次号</span>
        <span class="info-value">{{ product.batchNo }}</span>
      </view>
      <view class="info-item">
        <span class="info-label">产品型号</span>
        <span class="info-value">{{ product.productCode }}</span>
      </view>
      <view class="info-item">
        <span class="info-label">产品规格</span>
        <span class="info-value">{{ product.spec }}</span>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts" name="ProductCard">
import { computed } from 'vue'
import type { ProductInfo } from '@/types/prod-trace'

const props = defineProps<{
  product: ProductInfo
  active?: boolean
}>()
const emit = defineEmits<{ click: [] }>()

const statusText = computed(() => {
  const map: Record<ProductInfo['status'], string> = {
    done: '已完成',
    abnormal: '异常',
    processing: '加工中'
  }
  return map[props.product.status]
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
.product-card {
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 18px;
  box-shadow: $tp-shadow-md;
  margin-bottom: 12px;
  &.active {
    border: 2px solid $tp-primary;
    background: rgba($tp-primary, 0.05);
    box-shadow: 0 2px 8px rgba($tp-primary, 0.2);
  }
}

.product-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.product-name {
  font-size: 16px;
  font-weight: 700;
  color: $tp-title;
}

.status-tag {
  font-size: 14px;
  padding: 5px 14px;
  border-radius: 20px;
  font-weight: 700;
  margin-left: 15px;

  &.processing {
    background: rgba($tp-primary, 0.1);
    color: $tp-primary;
    border: 1px solid rgba($tp-primary, 0.3);
  }
  &.done {
    background: rgba($tp-success, 0.1);
    color: $tp-success;
    border: 1px solid rgba($tp-success, 0.3);
  }
  &.abnormal {
    background: rgba($tp-danger, 0.1);
    color: $tp-danger;
    border: 1px solid rgba($tp-danger, 0.3);
  }
}

.product-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-label {
  font-size: 12px;
  color: $tp-text;
  text-transform: uppercase;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: $tp-title;
  word-break: break-all;

  &.highlight {
    color: $tp-primary;
    font-weight: 700;
  }
}
</style>
