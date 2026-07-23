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
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'PENDING' }"
          @click="filterStatus = 'PENDING'">
          <view class="stat-number orange">{{ pendingConfigureCount }}</view>
          <view class="stat-label">配置中</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'Processing' }"
          @click="filterStatus = 'Processing'">
          <view class="stat-number blue">{{ inProductionCount }}</view>
          <view class="stat-label">生产中</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'Completed' }"
          @click="filterStatus = 'Completed'">
          <view class="stat-number green">{{ completedCount }}</view>
          <view class="stat-label">已完成</view>
        </view>
      </scroll-view>

      <!-- 工单列表 -->
      <view class="work-order-list">
        <view v-for="order in filteredOrders" :key="order.id" class="work-order-card" @click="goToOverview(order.id)">
          <!-- 卡片头部：项目名称 + 状态 -->
          <view class="card-header">
            <!-- 项目/产品信息左对齐 -->
            <view class="order-info">
              <view class="project-name">{{ order.name }} ({{ order.code }})</view>
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
              <text class="value">{{ order.plannedQty }} EA</text>
            </view>
            <view class="info-row">
              <text class="label">已完成</text>
              <text class="value">{{ order.completedQty }} EA</text>
            </view>
            <view class="progress-row">
              <nut-progress :percentage="Math.round(order.completedQty / order.plannedQty) * 100" :show-text="false"
                stroke-color="blue" class="progress-bar" />
              <text class="progress-text">{{ Math.round(order.completedQty / order.plannedQty) * 100 }}%</text>
            </view>
          </view>
          <!-- 卡片底部：操作按钮（无计划时间） -->
          <view class="card-footer">
            <view class="actions">
              <!-- <nut-button v-if="order.status === 'PENDING'" size="small" type="primary"
                @click.stop="goToSetup(order.id)">配置工序</nut-button> -->
              <!-- <nut-button v-if="order.status === 'Processing'" size="small" type="success"
                @click.stop="goToProduction(order.id)">继续生产</nut-button>
              <nut-button v-if="order.status === 'Completed'" size="small" plain
                @click.stop="goToProduction(order.id)">生产详情</nut-button> -->
              <!-- <nut-button v-if="order.hasAnomaly" size="small" type="danger" plain @click.stop="goToDetail(order.id)">异常详情</nut-button> -->
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
import { ref, computed, onMounted } from 'vue'
import { navigateTo } from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderListItem } from '@/types/work-order'
import { getLWorkOrderList } from '@/api/work-order/look-up'
import TabbarLayout from '@/components/TabbarLayout.vue'
import { getOrderStatusText } from '@/util/statusText';
const workOrders = ref<WorkOrderListItem[]>([]);

onMounted(() => {
  getLWorkOrderList().then(data => {
    workOrders.value = data.items;
  })
})


// 状态筛选
const filterStatus = ref<'all' | 'PENDING' | 'Processing' | 'Completed'>('all')
const pendingConfigureCount = computed(() => workOrders.value.filter(o => o.status === 'Pending').length)
const inProductionCount = computed(() => workOrders.value.filter(o => o.status === 'Processing').length)
const completedCount = computed(() => workOrders.value.filter(o => o.status === 'Completed').length)


const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return workOrders.value
  return workOrders.value.filter(o => o.status === filterStatus.value)
})

const statusLabel = (status: string) => getOrderStatusText(status);
const statusClass = (status: string) => ({ Pending: 'status-pending', Processing: 'status-progress', Completed: 'status-completed' }[status] || '')

// 跳转
// const goToDetail = (id: string) => navigateTo({ url: `/pages/work/order-detail?id=${id}` })
// const goToSetup = (id: string) => navigateTo({ url: `/pages/prod/prod-setup?workOrderId=${id}` })
const goToOverview = (id: string) => navigateTo({ url: `/pages/prod/operate-overview?id=${id}` })
// const goToTrace = (id: string) => navigateTo({ url: `/pages/prod/prod-trace?workOrderId=${id}` })
</script>

<style lang="scss" scoped>
@import './order-list.scss';
</style>
