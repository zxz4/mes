<template>
  <TabbarLayout>
    <view class="prod-overview-page">
      <NavBar title="生产执行" />

      <!-- 工单不存在 -->
      <view v-if="!workOrder" class="error-state">
        <nut-empty description="工单不存在或加载失败" />
        <nut-button type="primary" @click="backToList">返回工单列表</nut-button>
      </view>

      <!-- 工单内容 -->
      <view v-else class="content-wrapper">
        <!-- ===== 工单基本信息卡片 ===== -->
        <view class="info-card">
          <view class="card-header">
            <text class="card-title">工单信息</text>
            <view class="status-badge" :class="statusClass(workOrder.status)">
              {{ statusLabel(workOrder.status) }}
            </view>
          </view>
          <view class="info-grid">
            <view class="info-item">
              <text class="label">工单编号</text>
              <text class="value highlight">{{ workOrder.code }}</text>
            </view>
            <view class="info-item">
              <text class="label">工单名称</text>
              <text class="value">{{ workOrder.name }}</text>
            </view>
            <view class="info-item">
              <text class="label">产品名称</text>
              <text class="value">{{ workOrder.productName }}</text>
            </view>
            <view class="info-item">
              <text class="label">产品SAP</text>
              <text class="value">{{ workOrder.productSap }}</text>
            </view>
            <view class="info-item">
              <text class="label">计划数量</text>
              <text class="value">{{ workOrder.plannedQty }} EA</text>
            </view>
            <view class="info-item">
              <text class="label">已完成</text>
              <text class="value">{{ workOrder.completedQty }} EA</text>
            </view>
            <view class="info-item">
              <text class="label">整体进度</text>
              <text class="value">{{ overallProgress }}%</text>
            </view>
          </view>
          <view class="progress-section">
            <nut-progress :percentage="overallProgress" :show-text="false" stroke-color="blue" />
          </view>
        </view>

        <!-- ===== 工序列表卡片 ===== -->
        <view class="operation-list-card">
          <view class="card-title">工序列表</view>
          <view class="operation-list">
            <view v-for="(op, index) in operations" :key="op.id" class="operation-item" @click="goToExecute(op.id)">
              <view class="op-left">
                <text class="op-index">{{ index + 1 }}</text>
                <text class="op-name">{{ op.operationCode }} - {{ op.operationName }}</text>
                <!-- 类型标签 -->
                <text class="op-type" :class="typeClass(op.applicableMaterialType)">
                  {{ typeLabel(op.applicableMaterialType) }}
                </text>
                <!-- 可选标签 -->
                <text v-if="op.skipEnabled" class="op-optional">[可选]</text>
              </view>
              <view class="op-right">
                <view class="op-progress">
                  <text class="op-progress-text">
                    {{ getCompletedCount(op.id) }} / {{ getTotalCount(op.id) }}
                  </text>
                  <!-- <nut-progress :percentage="getProgressPercent(op.id)" :show-text="false" stroke-color="blue"
                    class="op-progress-bar" /> -->
                </view>
                <text class="op-arrow">›</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Taro from '@tarojs/taro';
import NavBar from '@/components/NavBar.vue';
import TabbarLayout from '@/components/TabbarLayout.vue';
import { useTabbarStore } from '@/store/tabbar';
import { getWithOperation } from '@/api/work-order/look-up';
import type { WorkOrderListItem, WorkOrderOperationDefinition } from '@/types/work-order';

// ========== 页面状态 ==========
const workOrder = ref<WorkOrderListItem | null>(null);
const operations = ref<WorkOrderOperationDefinition[]>([]);

// 每个工序的完成统计（模拟，实际从后端获取）
const operationStats = ref<Record<string, { completed: number; total: number }>>({});

// ========== 计算属性 ==========
const overallProgress = computed(() => {
  if (!workOrder.value) return 0;
  const total = workOrder.value.plannedQty;
  if (total === 0) return 0;
  return Math.round((workOrder.value.completedQty / total) * 100);
});

// ========== 辅助函数 ==========
const statusLabel = (s: string) => ({ Pending: '待生产', InProgress: '生产中', Finished: '已完成' }[s] || s);
const statusClass = (s: string) => ({ Pending: 'status-pending', InProgress: 'status-progress', Finished: 'status-completed' }[s] || '');

const typeLabel = (type: string) => {
  const map: Record<string, string> = { CELL: '电芯', MODULE: '模组', PACK: '电池包' };
  return map[type] || type;
};
const typeClass = (type: string) => {
  const map: Record<string, string> = { CELL: 'type-cell', MODULE: 'type-module', PACK: 'type-pack' };
  return map[type] || '';
};

// ========== 工序进度计算 ==========
const getTotalCount = (opId: string) => {
  return operationStats.value[opId]?.total || 0;
};
const getCompletedCount = (opId: string) => {
  return operationStats.value[opId]?.completed || 0;
};


// ========== 页面跳转 ==========
const goToExecute = (opId: string) => {
  Taro.navigateTo({
    url: `/pages/prod/operate-execute?operationId=${opId}`
  });
};

const backToList = () => {
  Taro.navigateTo({ url: '/pages/work/order-list' });
};

// ========== 加载数据 ==========
const loadData = async () => {
  const instance = Taro.getCurrentInstance();
  const workOrderId = instance?.router?.params?.id || '';

  if (!workOrderId) {
    Taro.showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => backToList(), 1500);
    return;
  }
  try {
    // 实际替换为真实API
    const data = await getWithOperation(workOrderId);
    workOrder.value = data;
    operations.value = data.operationDefinitions || [];

    // 模拟工序统计数据（实际从后端获取）
    operations.value.forEach(op => {
      // 根据工单计划数量和工序适用物料类型推算应处理总数
      const total = workOrder.value?.plannedQty || 0;
      operationStats.value[op.id] = {
        total: total,
        completed: Math.floor(Math.random() * (total + 1)) // 模拟已完成数量
      };
    });
  } catch (err) {
    console.error('加载工单失败:', err);
    Taro.showToast({ title: '加载失败', icon: 'none' });
  }
};

onMounted(() => {
  useTabbarStore().setSelected(1);
  loadData();
});
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.prod-overview-page {
  min-height: 100vh;
  background: $tp-help;
  padding-bottom: 30px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.content-wrapper {
  padding: 12px 16px;
}

/* ===== 信息卡片 ===== */
.info-card {
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: $tp-shadow-sm;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: $tp-title;
      margin-bottom: 0;
    }

    .status-badge {
      flex-shrink: 0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;

      &.status-pending {
        background: rgba($tp-primary, 0.1);
        color: $tp-primary;
      }

      &.status-progress {
        background: rgba(#fa8c16, 0.1);
        color: #fa8c16;
      }

      &.status-completed {
        background: rgba($tp-success, 0.1);
        color: $tp-success;
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
    margin-bottom: 16px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 11px;
      color: $tp-text;
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: $tp-title;

      &.highlight {
        color: $tp-primary;
        font-weight: 700;
      }
    }
  }

  .progress-section {
    margin-top: 8px;
  }
}

/* ===== 工序列表卡片 ===== */
.operation-list-card {
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 16px;
  box-shadow: $tp-shadow-sm;

  .card-title {
    font-size: 16px;
    font-weight: 700;
    color: $tp-title;
    margin-bottom: 14px;
  }

  .operation-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .operation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    background: $tp-help;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    // &:hover {
    //   // background: darken($tp-help, 3%);
    // }

    &:active {
      transform: scale(0.98);
    }

    .op-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      flex: 1;

      .op-index {
        font-size: 12px;
        font-weight: 600;
        color: $tp-text;
        background: $tp-white;
        padding: 2px 8px;
        border-radius: 12px;
        min-width: 24px;
        text-align: center;
      }

      .op-name {
        font-size: 14px;
        font-weight: 500;
        color: $tp-title;
      }

      .op-type {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 600;

        &.type-cell {
          background: rgba($tp-primary, 0.1);
          color: $tp-primary;
        }

        &.type-module {
          background: rgba(#fa8c16, 0.1);
          color: #fa8c16;
        }

        &.type-pack {
          background: rgba($tp-success, 0.1);
          color: $tp-success;
        }
      }

      .op-optional {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        background: rgba($tp-text, 0.1);
        color: $tp-text;
        font-weight: 600;
      }
    }

    .op-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .op-progress {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        width: 100px;

        .op-progress-text {
          font-size: 11px;
          color: $tp-text;
        }

        .op-progress-bar {
          width: 100%;
          height: 4px;

          :deep(.nut-progress-outer) {
            background: #e8ecf1;
            border-radius: 4px;
          }
        }
      }

      .op-arrow {
        font-size: 18px;
        color: $tp-text;
        font-weight: 300;
      }
    }
  }
}
</style>
