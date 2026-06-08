<template>
  <TabbarLayout>
    <view class="work-order-page">
      <NavBar title="生产工单" />

      <!-- 统计卡片（状态筛选） -->
      <scroll-view scroll-x class="stats-row">
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'all' }" @click="filterStatus = 'all'">
          <view class="stat-number blue">{{ workOrders.length }}</view>
          <view class="stat-label">全部工单</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'pending_material' }"
          @click="filterStatus = 'pending_material'">
          <view class="stat-number orange">{{ pendingMaterialCount }}</view>
          <view class="stat-label">待领料</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'in_production' }"
          @click="filterStatus = 'in_production'">
          <view class="stat-number blue">{{ inProductionCount }}</view>
          <view class="stat-label">生产中</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'completed' }"
          @click="filterStatus = 'completed'">
          <view class="stat-number green">{{ completedCount }}</view>
          <view class="stat-label">已完成</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'anomaly' }"
          @click="filterStatus = 'anomaly'">
          <view class="stat-number red">{{ anomalyCount }}</view>
          <view class="stat-label">异常工单</view>
        </view>
      </scroll-view>

      <!-- 工单列表 -->
      <view class="work-order-list">
        <view v-for="order in filteredOrders" :key="order.id" class="work-order-card" @click="goToDetail(order.id)">
          <!-- 卡片头部：项目名称 + 状态 -->
          <view class="card-header">
            <!-- 项目/产品信息左对齐 -->
            <view class="order-info">
              <view class="project-name">{{ order.projectName }} ({{ order.projectCode }})</view>
              <view class="product-info">{{ order.productName }} ({{ order.productSap }})</view>
            </view>
            <!-- 状态徽章保持在右侧 -->
            <view class="status-badge" :class="statusClass(order.status)">
              {{ statusLabel(order.status) }}
            </view>
          </view>

          <!-- 卡片主体：数量 + 进度 -->
          <view class="card-body">
            <view class="info-row">
              <text class="label">计划数量</text>
              <text class="value">{{ order.planQty }} {{ order.unit }}</text>
            </view>
            <view class="info-row">
              <text class="label">已完成</text>
              <text class="value">{{ order.completedQty }} {{ order.unit }}</text>
            </view>
            <view class="progress-row">
              <nut-progress :percentage="order.progress" :show-text="false" stroke-color="blue" class="progress-bar" />
              <text class="progress-text">{{ order.progress }}%</text>
            </view>
          </view>

          <!-- 卡片底部：操作按钮（无计划时间） -->
          <view class="card-footer">
            <view class="actions">
              <nut-button v-if="order.status === 'pending_material'" size="small" type="primary"
                @click.stop="goToPicking(order.id)">去领料</nut-button>
              <nut-button v-if="order.status === 'in_production'" size="small" type="success"
                @click.stop="goToProduction(order.id)">继续生产</nut-button>
              <nut-button v-if="order.status === 'completed'" size="small" plain
                @click.stop="goToTrace(order.id)">查看追溯</nut-button>
              <nut-button v-if="order.hasAnomaly" size="small" type="danger" plain
                @click.stop="goToDetail(order.id)">异常详情</nut-button>
            </view>
          </view>
        </view>

        <view v-if="filteredOrders.length === 0" class="empty-state">
          <nut-empty description="暂无工单数据" />
        </view>
      </view>
    </view>
  </TabbarLayout>

</template>

<script setup lang="ts" name="WorkOrderList">
import { ref, computed , onMounted } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderListItem } from '@/types/work-order'

import TabbarLayout from '@/components/TabbarLayout.vue'
import { useTabbarStore } from '@/store/tabbar'

onMounted(() => {
 useTabbarStore().setSelected(0)
})
// 模拟数据（新结构）
const workOrders = ref<WorkOrderListItem[]>([
  {
    id: 'WO001',
    projectCode: 'PJ_1098',
    projectName: 'SM1178D-310-R2.1_1178.496kWh_中交',
    productName: 'SM1178D-310-R2.1',
    productSap: '91070999',
    planQty: 1,
    completedQty: 0,
    unit: 'EA',
    status: 'pending_material',
    progress: 0,
    hasAnomaly: false
  },
  {
    id: 'WO002',
    projectCode: 'PJ_1076',
    projectName: 'SE5015D-628-R1.1_400MWh_宁夏中光电',
    productName: 'SE5015D-628-R1.1',
    productSap: '91070575',
    planQty: 80,
    completedQty: 40,
    unit: 'EA',
    status: 'in_production',
    progress: 50,
    hasAnomaly: true
  },
  {
    id: 'WO003',
    projectCode: 'PJ_0823',
    projectName: 'SC0261-314-R2.3_1306kWh_TD_新加坡',
    productName: 'SC0261-314-R2.3',
    productSap: '91062669',
    planQty: 5,
    completedQty: 5,
    unit: 'EA',
    status: 'completed',
    progress: 100,
    hasAnomaly: false
  }
])



// 状态筛选
const filterStatus = ref<'all' | 'pending_material' | 'in_production' | 'completed' | 'anomaly'>('all')
const pendingMaterialCount = computed(() => workOrders.value.filter(o => o.status === 'pending_material').length)
const inProductionCount = computed(() => workOrders.value.filter(o => o.status === 'in_production').length)
const completedCount = computed(() => workOrders.value.filter(o => o.status === 'completed').length)
const anomalyCount = computed(() => workOrders.value.filter(o => o.hasAnomaly).length)

const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return workOrders.value
  if (filterStatus.value === 'anomaly') return workOrders.value.filter(o => o.hasAnomaly)
  return workOrders.value.filter(o => o.status === filterStatus.value)
})

const statusLabel = (status: string) => ({ pending_material: '待领料', in_production: '生产中', completed: '已完成' }[status] || status)
const statusClass = (status: string) => ({ pending_material: 'status-pending', in_production: 'status-progress', completed: 'status-completed' }[status] || '')

// 跳转
const goToDetail = (id: string) => Taro.navigateTo({ url: `/pages/work/order-detail?id=${id}` })
const goToPicking = (id: string) => Taro.navigateTo({ url: `/pages/prod/pick-material?workOrderId=${id}` })
const goToProduction = (id: string) => Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${id}` })
const goToTrace = (id: string) => Taro.navigateTo({ url: `/pages/prod/prod-trace?workOrderId=${id}` })
</script>

<style lang="scss" scoped>
// 样式基本沿用之前，微调卡片头部布局

@import '@/styles/theme.scss';

.work-order-page {
  min-height: 100vh;
  background: $tp-help;
  padding-bottom: 20px;
}

/* 统计卡片滚动区 */
.stats-row {
  display: flex;
  gap: 10px;
  padding: 13px 14px;
  overflow-x: auto;
  white-space: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }
}

.stat-card {
  flex: 1;
  min-width: 80px;
  background: $tp-white;
  border-radius: 10px;
  padding: 13px 12px;
  text-align: center;
  box-shadow: $tp-shadow-sm;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: 0.2s;

  &:active {
    transform: scale(0.96);
  }

  &.active-filter {
    border-color: $tp-primary;
    background: rgba($tp-primary, 0.08);
  }
}

.stat-number {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;

  &.blue {
    color: $tp-primary;
  }

  &.orange {
    color: #fa8c16;
  }

  &.green {
    color: $tp-success;
  }

  &.red {
    color: $tp-danger;
  }
}

.stat-label {
  font-size: 11px;
  color: $tp-text;
  margin-top: 5px;
  font-weight: 500;
}

/* 工单列表 */
.work-order-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.work-order-card {
  background: $tp-white;
  border-radius: 14px;
  box-shadow: $tp-shadow-sm;
  padding: 16px;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center; // 垂直居中
  gap: 8px;
  margin-bottom: 12px;

  .status-badge {
    flex-shrink: 0;
  }

  .order-info {
    flex: 1;

    .project-name {
      font-size: 16px;
      font-weight: 700;
      color: $tp-title;
    }

    .product-info {
      font-size: 13px;
      color: $tp-text;
    }
  }
}

.status-badge {
  padding: 4px 10px;
  border-radius: 14px;
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

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;

  .label {
    color: $tp-text;
  }

  .value {
    font-weight: 500;
    color: $tp-title;
  }
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;

  :deep(.nut-progress-outer) {
    background: #e8ecf1;
    border-radius: 4px;
  }
}

.progress-text {
  font-size: 12px;
  color: $tp-primary;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

// 移除 .time-info 相关样式，因为不再显示计划时间
.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  padding: 50px 0;
}

.card-footer {
  justify-content: flex-end; // 按钮右对齐
}
</style>
