<template>
  <view class="material-node-container" :style="{ marginLeft: depth * 16 + 'px' }">

    <view class="node-header" @click="toggleExpand">

      <view class="node-info">

        <view v-if="node.hasChildren" class="expand-icon-wrapper">
          <IconFont v-show="expanded" name="plus" size="10" />
          <IconFont v-show="!expanded" name="minus" size="10" />
        </view>

        <view class="node-main">
          <text class="component-name">{{ node.componentName }}</text>
          <text class="component-code">({{ node.componentCode }})</text>
        </view>
      </view>

      <view class="node-detail">
        <text v-if="node.sap" class="sap">SAP:{{ node.sap }}</text>
        <text v-if="node.quantity" class="quantity">需求: {{ node.quantity }}{{ node.unit }}</text>
      </view>

    </view>

    <view v-if="node.specificationDescription" class="spec-desc">
      规格: {{ node.specificationDescription }}
    </view>

    <view v-if="!node.hasChildren" class="pick-area">
      <text class="pick-label">领用数量</text>
      <nut-input class="custom-input-number" v-model="localPickedQuantity" :min="0" :max="100" :step="1"></nut-input>
      <text class="unit">{{ node.unit || '个' }}</text>
    </view>

    <view v-if="node.hasChildren && expanded && node.children && node.children.length" class="children-container">
      <MaterialNode v-for="(child, idx) in node.children" :key="`${child.componentCode}_${idx}`" :node="child"
        :depth="depth + 1" @update:picked-quantity="handleChildUpdate" />
    </view>

  </view>
</template>

<script setup lang="ts">

import { ref, computed } from 'vue'
import { IconFont } from '@nutui/icons-vue-taro'
import type { MaterialItem } from '@/types/material'
import MaterialNode from './index.vue'

const props = defineProps<{
  node: MaterialItem
  depth?: number
}>()

const emit = defineEmits<{
  (e: 'update:picked-quantity', value: { componentCode: string; pickedQuantity: number }): void
}>()

const depth = props.depth ?? 0
const expanded = ref(true)

const toggleExpand = () => {
  if (props.node.hasChildren) {
    expanded.value = !expanded.value
  }
}

const localPickedQuantity = computed({
  get: () => props.node.pickedQuantity ?? 0,
  set: (val: number) => {
    if (!props.node.hasChildren) {
      emit('update:picked-quantity', {
        componentCode: props.node.componentCode,
        pickedQuantity: val
      })
    }
  }
})

const handleChildUpdate = (payload: { componentCode: string; pickedQuantity: number }) => {
  emit('update:picked-quantity', payload)
}
</script>

<style lang="scss" scoped>
.material-node-container {
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
  transition: all 0.2s;

  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    .node-info {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;

      .expand-icon-wrapper {
        width: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      // .expand-icon {
      //   flex-shrink: 0;
      //   color: #999;
      // }
      .node-main {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 4px;

        .component-name {
          font-size: 15px;
          font-weight: 500;
          color: #2c3e4f;
        }

        .component-code {
          font-size: 12px;
          color: #8595a6;
        }
      }
    }

    .node-detail {
      font-size: 12px;
      color: #6c7a8e;
      display: flex;
      gap: 12px;

      .sap {
        background: #eef2f6;
        padding: 2px 8px;
        border-radius: 20px;
      }
    }
  }

  .spec-desc {
    font-size: 12px;
    color: #8f9eb2;
    margin: 8px 0 4px 24px;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 8px;
    word-break: break-all;
  }

  .pick-area {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 12px 0 4px 24px;
    background: #fef9e6;
    padding: 8px 12px;
    border-radius: 24px;

    .pick-label {
      font-size: 13px;
      color: #e67e22;
      font-weight: 500;
    }

    // .custom-input-number {}
    .unit {
      font-size: 13px;
      color: #16a085;
    }
  }

  .children-container {
    margin-top: 8px;
    border-left: 2px dashed #e0e7ed;
    margin-left: 16px;
  }
}
</style>
