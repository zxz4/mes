<template>
  <view class="material-node-container" :style="{ marginLeft: depth * 16 + 'px' }">
    <view class="node-header" @click="toggleExpand">
      <view class="node-info">
        <view v-if="node.hasChildren" class="expand-icon-wrapper">
          <IconFont v-show="expanded" name="plus" size="13" />
          <IconFont v-show="!expanded" name="minus" size="13" />
        </view>

        <view class="node-main">
          <text class="component-name">{{ node.componentName }}</text>
          <text class="component-code">({{ node.componentCode }})</text>
        </view>
      </view>

      <view class="node-detail">
        <text v-if="node.sap" class="sap">SAP:{{ node.sap }}</text>
        <text v-if="node.quantity" class="quantity">需求: {{ node.quantity }}</text>
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

    <view v-if="node.hasChildren && expanded && node.children && node.children.length" class="children-container">
      <MaterialNode v-for="(child, idx) in node.children" :key="`${child.componentCode}_${idx}`" :node="child"
        :depth="depth + 1" @update:picked-quantity="handleChildUpdate" />
    </view>
  </view>
</template>

<script setup lang="ts" name="MaterialNode">

import { ref, computed } from 'vue'
import { IconFont } from '@nutui/icons-vue-taro'
import type { MaterialItem } from '@/types/material'
import MaterialNode from './MaterialNode.vue'

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
  // 基础样式
  border-bottom: 1px solid $help-color;
  padding: 12px 16px;
  background-color: transparent; // 显式声明背景，避免继承问题
  transition: background-color 0.2s ease, border-color 0.2s ease;

  // 建议：如果需要整行 Hover 效果，在这里添加
  &:hover {
    background-color: rgba($help-color, 0.3); // 使用辅助色的透明版本，更柔和
    // 如果希望边框也变色，可以解开下面这行
    // border-bottom-color: $primary-color;
  }

  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    // 移除内部的 hover/active 背景色，交给父容器处理，保持视觉统一
    // 如果必须保留内部独立交互，请保留原代码，但要注意优先级

    .node-info {
      display: flex;
      align-items: center;
      gap: 8px; // 稍微增加间距，提升呼吸感
      flex: 1;
      min-width: 0; // 防止 flex 子元素溢出

      .expand-icon-wrapper {
        width: 20px;
        height: 20px; // 建议固定高度，保持图标居中稳定
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: $text-color;
        flex-shrink: 0; // 防止图标被压缩
      }

      .node-main {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 4px;
        overflow: hidden; // 配合 text-overflow 使用

        .component-name {
          font-size: $font-size-2;
          font-weight: 500;
          color: $title-color;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .component-code {
          font-size: $font-size-1;
          color: $title-color2;
          white-space: nowrap;
        }
      }
    }

    .node-detail {
      display: flex;
      align-items: center; // 垂直居中对齐
      gap: 12px;
      font-size: $font-size-1;
      color: $text-color;
      flex-shrink: 0; // 防止详细信息被挤压

      .sap {
        // 建议：标签背景色应与区块背景色有所区分，或使用主色/成功色等语义色
        background: $help-color;
        color: $title-color; // 确保标签内文字可读
        padding: 2px 8px;
        border-radius: calc($button-border-radius / 2);
        font-weight: 500;
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
    // 建议：如果 $help-color 很浅，确保文字对比度。或者加一个淡淡的边框
    background: $help-color;
    padding: 4px 8px;
    border-radius: $cell-border-radius;
    word-break: break-all;
    line-height: 1.5; // 增加行高提升可读性
  }

  .pick-area {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 12px 0 4px 24px;
    background: $help-color;
    padding: 8px 12px;
    border-radius: $button-border-radius;
    font-size: $font-size-1;

    // 建议：如果 pick-area 也是浅色背景，确保内部元素对比度
    border: 1px solid transparent; // 预留边框位置，防止抖动
    transition: border-color 0.2s;

    &:hover {
      border-color: $primary-color; // 悬停时显示边框，增强操作感
    }

    .pick-label {
      color: $primary-color;
      font-weight: 500;
      white-space: nowrap;
    }

    .nut-icon {
      color: $text-color;
      cursor: pointer;
      transition: color 0.2s, transform 0.2s; // 增加一点微动效
      display: inline-flex;
      align-items: center;

      &:hover {
        color: $primary-color;
        transform: scale(1.1); // 轻微放大
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .unit {
      color: $primary-color;
      margin-left: auto; // 如果希望单位靠右，可以使用这个；否则保持原样
    }
  }

  .children-container {
    margin-top: 8px;
    margin-left: 16px;
    padding-left: 12px; // 增加内边距，让内容与虚线保持距离
    border-left: 2px dashed $help-color;

    // 可选：添加淡入动画，使展开更平滑
    animation: slideDown 0.2s ease-out;
  }
}

// 可选：定义简单的展开动画
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
