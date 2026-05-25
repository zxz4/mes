<template>
  <view class="material-node" :style="{ marginLeft: depth * 24 + 'px' }">
    <view class="node-header" @click="expand = !expand">
      <view class="node-info">
        <IconFont v-if="node.hasChildren" :name="expand ? 'triangle-down' : 'triangle-right'" size="16" class="expand-icon" />        
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

    <!-- 规格描述（如果有） -->
    <view v-if="node.specificationDescription" class="spec-desc">
      规格: {{ node.specificationDescription }}
    </view>

    <!-- 叶子节点：显示领用数量步进器 -->
    <view v-if="!node.hasChildren" class="pick-area">
      <text class="pick-label">领用数量</text>
      <nut-input-number
        v-model="localPickedQuantity"
        :min="0"
        :max="9999"
        :step="1"
        input-width="80px"
      />
      <text class="unit">{{ node.unit || '个' }}</text>
    </view>

    <!-- 非叶子节点且展开时显示子组件 -->
    <view v-if="node.hasChildren && expand && node.children && node.children.length" class="children-container">
      <MaterialNode
        v-for="(child, idx) in node.children"
        :key="idx"
        :node="child"
        :depth="depth + 1"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconFont } from '@nutui/icons-vue-taro'; // 引入 IconFont 组件
import { TriangleDown, TriangleRight } from '@nutui/icons-vue-taro'; // 引入具体的图标组件
import MaterialNode from './index.vue'

// 物料项类型（与主页面保持一致）
export interface MaterialItem {
  componentCode: string
  componentName: string
  sap: string
  specificationDescription: string
  quantity: number
  unit: string
  hasChildren: boolean
  children: MaterialItem[]
  pickedQuantity?: number
}

const props = defineProps<{
  node: MaterialItem
  depth?: number
}>()

const depth = props.depth ?? 0
const expand = ref(true)

// 双向绑定叶子节点的领用数量
const localPickedQuantity = computed({
  get: () => props.node.pickedQuantity ?? 0,
  set: (val: number) => {
    if (!props.node.hasChildren) {
      props.node.pickedQuantity = val
    }
  }
})
</script>

<style lang="scss">
.material-node {
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

      .expand-icon {
        flex-shrink: 0;
        color: #999;
      }

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