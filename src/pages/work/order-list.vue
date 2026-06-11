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
@import './order-list.scss';
</style>
