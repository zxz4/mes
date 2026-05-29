<template>
    <view
        class="material-node-container"
        :style="{ marginLeft: depth * 16 + 'px' }">
        <view class="node-header" @click="toggleExpand">
            <view class="node-info">
                <view v-if="node.hasChildren" class="expand-icon-wrapper">
                    <IconFont v-show="expanded" name="plus" size="13" />
                    <IconFont v-show="!expanded" name="minus" size="13" />
                </view>

                <view class="node-main">
                    <text class="component-name">{{ node.componentName }}</text>
                    <text class="component-code"
                        >({{ node.componentCode }})</text
                    >
                </view>
            </view>

            <view class="node-detail">
                <text v-if="node.sap" class="sap">SAP:{{ node.sap }}</text>
                <text v-if="node.quantity" class="quantity"
                    >需求: {{ node.quantity }}</text
                >
            </view>
        </view>

        <view v-if="node.specificationDescription" class="spec-desc">
            规格: {{ node.specificationDescription }}
        </view>

        <view v-if="!node.hasChildren" class="pick-area">
            <text class="pick-label">领用数量</text>
            <IconFont name="minus" size="13" />
            <text>{{ localPickedQuantity }}</text>
            <IconFont name="plus" size="13" />
            <!-- todo:使用 封装counter替代 -->
            <!-- <counter v-model="localPickedQuantity" /> -->
            <text class="unit">{{ node.unit || '个' }}</text>
        </view>

        <view
            v-if="node.hasChildren && expanded && node.children && node.children.length"
            class="children-container">
            <MaterialNode
                v-for="(child, idx) in node.children"
                :key="`${child.componentCode}_${idx}`"
                :node="child"
                :depth="depth + 1"
                @update:picked-quantity="handleChildUpdate" />
        </view>
    </view>
</template>

<script setup lang="ts" name="MaterialNode">

import { ref, computed } from 'vue'
import { IconFont } from '@nutui/icons-vue-taro'
import type { MaterialItem } from '@/types/material'
import MaterialNode from './material-node.vue'

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
  border-bottom: 1px solid $help-color;
  padding: 12px 16px;
  transition: background-color 0.2s, border-color 0.2s;

  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    &:hover {
      background-color: $help-color;
    }

    &:active {
      // 修复：直接使用计算后的静态颜色值，避免 darken() 函数处理 CSS 变量
      background-color: #e8e8e8; // 对应 darken(#f5f5f5, 3%)
    }

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
        color: $text-color;
      }

      .node-main {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 4px;

        .component-name {
          font-size: $font-size-2;
          font-weight: 500;
          color: $title-color;
        }

        .component-code {
          font-size: $font-size-1;
          color: $title-color2;
        }
      }
    }

    .node-detail {
      font-size: $font-size-1;
      color: $text-color;
      display: flex;
      gap: 12px;

      .sap {
        background: $help-color;
        padding: 2px 8px;
        border-radius: calc($button-border-radius / 2);
      }
      .quantity {
        color: $text-color;
      }
    }
  }

  .spec-desc {
    font-size: $font-size-1;
    color: $title-color2;
    margin: 8px 0 4px 24px;
    background: $help-color;
    padding: 4px 8px;
    border-radius: $cell-border-radius;
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
    font-size: $font-size-1;

    .pick-label {
      color: #e67e22;
      font-weight: 500;
    }

    .nut-icon {
      color: $text-color;
      cursor: pointer;
    }

    .unit {
      color: $primary-color;
    }
  }

  .children-container {
    margin-top: 8px;
    border-left: 2px dashed $help-color;
    margin-left: 16px;
  }
}
</style>

