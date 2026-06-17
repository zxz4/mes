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
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'Pending' }"
          @click="filterStatus = 'Pending'">
          <view class="stat-number orange">{{ pendingMaterialCount }}</view>
          <view class="stat-label">待领料</view>
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
        <view v-for="order in filteredOrders" :key="order.id" class="work-order-card" @click="goToDetail(order.id)">
          <!-- 卡片头部：项目名称 + 状态 -->
          <view class="card-header">
            <!-- 项目/产品信息左对齐 -->
            <view class="order-info">
              <view class="project-name">{{ order.workOrderName }} ({{ order.workOrderNo }})</view>
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
              <nut-progress :percentage="order.completedQty/order.plannedQty" :show-text="false" stroke-color="blue" class="progress-bar" />
              <text class="progress-text">{{ order.completedQty/order.plannedQty }}%</text>
            </view>
          </view>

          <!-- 卡片底部：操作按钮（无计划时间） -->
          <view class="card-footer">
            <view class="actions">
              <nut-button v-if="order.status === 'Pending'" size="small" type="primary"
                @click.stop="goToSetup(order.id)">生产配置</nut-button>
              <nut-button v-if="order.status === 'Processing'" size="small" type="success"
                @click.stop="goToProduction(order.id)">继续生产</nut-button>
              <nut-button v-if="order.status === 'Completed'" size="small" plain
                @click.stop="goToTrace(order.id)">查看追溯</nut-button>
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
import { ref, computed , onMounted } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderListItem } from '@/types/work-order'
import { getLWorkOrderList } from '@/api/work-order'
import TabbarLayout from '@/components/TabbarLayout.vue'
import { useTabbarStore } from '@/store/tabbar'
import{getBomChildren} from "@/api/bom"

const workOrders = ref<WorkOrderListItem[]>([]);


getBomChildren('158024133');

onMounted(() => {
 useTabbarStore().setSelected(0)
 getLWorkOrderList().then(data=>{
  workOrders.value = data.items;
 })
})


// 状态筛选
const filterStatus = ref<'all' | 'Pending' | 'Processing' | 'Completed' | 'anomaly'>('all')
const pendingMaterialCount = computed(() => workOrders.value.filter(o => o.status === 'Pending').length)
const inProductionCount = computed(() => workOrders.value.filter(o => o.status === 'Processing').length)
const completedCount = computed(() => workOrders.value.filter(o => o.status === 'Completed').length)


const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') return workOrders.value
  // if (filterStatus.value === 'anomaly') return workOrders.value.filter(o => o.hasAnomaly)
  return workOrders.value.filter(o => o.status === filterStatus.value)
})

const statusLabel = (status: string) => ({ Pending: '待领料', Processing: '生产中', completed: '已完成' }[status] || status)
const statusClass = (status: string) => ({ Pending: 'status-pending', Processing: 'status-progress', completed: 'status-completed' }[status] || '')

// 跳转
const goToDetail = (id: string) => Taro.navigateTo({ url: `/pages/work/order-detail?id=${id}` })
const goToSetup = (id: string) => Taro.navigateTo({ url: `/pages/prod/prod-setup?workOrderId=${id}` })
const goToProduction = (id: string) => Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${id}` })
const goToTrace = (id: string) => Taro.navigateTo({ url: `/pages/prod/prod-trace?workOrderId=${id}` })
</script>

<style lang="scss" scoped>
@import './order-list.scss';
</style>
