<template>
  <view class="work-order-page">
    <!-- 顶部导航 -->
    <NavBar title="生产工单" />

    <!-- 统计卡片（状态筛选） -->
    <scroll-view scroll-x class="stats-row">
      <view
        class="stat-card"
        :class="{ 'active-filter': filterStatus === 'pending_material' }"
        @click="filterStatus = 'pending_material'"
      >
        <text class="stat-number orange">{{ pendingMaterialCount }}</text>
        <view class="stat-label">待领料</view>
      </view>
      <view
        class="stat-card"
        :class="{ 'active-filter': filterStatus === 'in_production' }"
        @click="filterStatus = 'in_production'"
      >
        <text class="stat-number blue">{{ inProductionCount }}</text>
        <view class="stat-label">生产中</view>
      </view>
      <view
        class="stat-card"
        :class="{ 'active-filter': filterStatus === 'anomaly' }"
        @click="filterStatus = 'anomaly'"
      >
        <text class="stat-number red">{{ anomalyCount }}</text>
        <view class="stat-label">异常工单</view>
      </view>
            <view
        class="stat-card"
        :class="{ 'active-filter': filterStatus === 'all' }"
        @click="filterStatus = 'all'"
      >
        <text class="stat-number blue">{{ workOrders.length }}</text>
        <view class="stat-label">全部工单</view>
      </view>
    </scroll-view>

    <!-- 工单列表 -->
    <view class="work-order-list">
      <view
        v-for="order in filteredOrders"
        :key="order.id"
        class="work-order-card"
        @click="goToDetail(order.id)"
      >
        <!-- 头部：工单号 + 状态标签 -->
        <view class="card-header">
          <view class="order-info">
            <text class="order-no">#{{ order.orderNo }}</text>
            <text class="product-name">{{ order.productName }}</text>
          </view>
          <view class="status-badge" :class="statusClass(order.status)">
            {{ statusLabel(order.status) }}
          </view>
        </view>

        <!-- 主体：数量和进度 -->
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
            <nut-progress
              :percentage="order.progress"
              :show-text="false"
              stroke-color="blue"
              class="progress-bar"
            />
            <text class="progress-text">{{ order.progress }}%</text>
          </view>
        </view>

        <!-- 底部：计划时间 + 操作按钮 -->
        <view class="card-footer">
          <view class="time-info">
            <IconFont name="calendar" size="12" />
            <text>{{ formatDate(order.planStartTime) }} ~ {{ formatDate(order.planEndTime) }}</text>
          </view>
          <view class="actions">
            <nut-button
              v-if="order.status === 'pending_material'"
              size="small"
              type="primary"
              @click.stop="goToPicking(order.id)"
            >
              去领料
            </nut-button>
            <nut-button
              v-if="order.status === 'in_production'"
              size="small"
              type="success"
              @click.stop="goToProduction(order.id)"
            >
              继续生产
            </nut-button>
            <nut-button
              v-if="order.status === 'completed'"
              size="small"
              plain
              @click.stop="goToTrace(order.id)"
            >
              查看追溯
            </nut-button>
            <nut-button
              v-if="order.hasAnomaly"
              size="small"
              type="danger"
              plain
              @click.stop="goToDetail(order.id)"
            >
              异常详情
            </nut-button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="filteredOrders.length === 0" class="empty-state">
        <nut-empty description="暂无工单数据" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts" name="WorkOrderList">
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'
import { IconFont } from '@nutui/icons-vue-taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrder } from '@/types/work-order'

// ========== 模拟工单数据 ==========
const workOrders = ref<WorkOrder[]>([
  {
    id: 'WO001',
    orderNo: 'MES-20260601-001',
    productName: 'PT043D-280-R2.1',
    productCode: 'LF280K-V3',
    planQty: 200,
    completedQty: 0,
    unit: '个',
    status: 'pending_material',
    planStartTime: '2026-06-01',
    planEndTime: '2026-06-05',
    progress: 0,
    hasAnomaly: false
  },
  {
    id: 'WO002',
    orderNo: 'MES-20260601-002',
    productName: '精密轴承组件 BP-300K',
    productCode: 'BP300K',
    planQty: 500,
    completedQty: 218,
    unit: '套',
    status: 'in_production',
    planStartTime: '2026-06-01',
    planEndTime: '2026-06-07',
    progress: 44,
    hasAnomaly: true
  },
  {
    id: 'WO003',
    orderNo: 'MES-20260602-003',
    productName: '电芯 A770_STACK',
    productCode: 'A770S',
    planQty: 300,
    completedQty: 300,
    unit: '个',
    status: 'completed',
    planStartTime: '2026-06-02',
    planEndTime: '2026-06-06',
    progress: 100,
    hasAnomaly: false
  },
  {
    id: 'WO004',
    orderNo: 'MES-20260603-004',
    productName: '电池模组托盘',
    productCode: 'BMT-01',
    planQty: 150,
    completedQty: 80,
    unit: '件',
    status: 'in_production',
    planStartTime: '2026-06-03',
    planEndTime: '2026-06-09',
    progress: 53,
    hasAnomaly: false
  },
  {
    id: 'WO005',
    orderNo: 'MES-20260604-005',
    productName: '端板组件',
    productCode: 'EP-48S',
    planQty: 1000,
    completedQty: 0,
    unit: '个',
    status: 'pending_material',
    planStartTime: '2026-06-04',
    planEndTime: '2026-06-10',
    progress: 0,
    hasAnomaly: false
  }
])

// 状态筛选 这个是否从后端返回还是应该前端计算？如果后端返回状态统计数据会更高效，避免前端重复计算。
const filterStatus = ref<'all' | 'pending_material' | 'in_production' | 'completed' | 'anomaly'>('pending_material')

const pendingMaterialCount = computed(() => workOrders.value.filter(o => o.status === 'pending_material').length)
const inProductionCount = computed(() => workOrders.value.filter(o => o.status === 'in_production').length)
// const completedCount = computed(() => workOrders.value.filter(o => o.status === 'completed').length)
const anomalyCount = computed(() => workOrders.value.filter(o => o.hasAnomaly).length)

const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return workOrders.value
  if (filterStatus.value === 'anomaly') return workOrders.value.filter(o => o.hasAnomaly)
  return workOrders.value.filter(o => o.status === filterStatus.value)
})

// 状态辅助函数
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending_material: '待领料',
    in_production: '生产中',
    completed: '已完成'
  }
  return map[status] || status
}

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    pending_material: 'status-pending',
    in_production: 'status-progress',
    completed: 'status-completed'
  }
  return map[status] || ''
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--'
  // 只显示月日
  const parts = dateStr.split('-')
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`
  return dateStr
}

// 页面跳转
const goToDetail = (orderId: string) => {
  Taro.navigateTo({ url: `/pages/work-order/order-detail?id=${orderId}` })
}

const goToPicking = (orderId: string) => {
  Taro.navigateTo({ url: `/pages/pick-material/pick-material?workOrderId=${orderId}` })
}

const goToProduction = (orderId: string) => {
  Taro.navigateTo({ url: `/pages/prod-operation/prod-operation?workOrderId=${orderId}` })
}

const goToTrace = (orderId: string) => {
  Taro.navigateTo({ url: `/pages/prod-trace/prod-trace?workOrderId=${orderId}` })
}
</script>

<style lang="scss" scoped>
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
  &.blue { color: $tp-primary; }
  &.orange { color: #fa8c16; }
  &.green { color: $tp-success; }
  &.red { color: $tp-danger; }
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
  align-items: center;
  margin-bottom: 12px;
}
.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-no {
  font-size: 14px;
  font-weight: 600;
  color: $tp-primary;
}
.product-name {
  font-size: 16px;
  font-weight: 700;
  color: $tp-title;
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
.time-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $tp-text;
}
.actions {
  display: flex;
  gap: 8px;
}
.empty-state {
  padding: 50px 0;
}
</style>
