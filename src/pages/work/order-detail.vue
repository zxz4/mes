<template>
  <view class="work-order-detail-page">
    <NavBar :title="`工单详情`" :show-back="true" />


    <view v-if="workOrder" class="detail-content">
      <!-- 1. 基本信息卡片 -->
      <view class="info-card">
        <view class="card-header">
          <text class="card-title">基本信息</text>
          <view class="status-badge" :class="statusClass(workOrder.status)">
            {{ statusLabel(workOrder.status) }}
          </view>
        </view>
        <view class="info-grid">
          <view class="info-item">
            <text class="label">工单编号</text>
            <text class="value highlight">{{ workOrder.workOrderNo }}</text>
          </view>
          <view class="info-item">
            <text class="label">工单名称</text>
            <text class="value">{{ workOrder.workOrderName }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品名称</text>
            <text class="value">{{ workOrder.productName }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品SAP码</text>
            <text class="value">{{ workOrder.productSap }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品类型</text>
            <text class="value">{{ workOrder.productType || '--' }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品规格</text>
            <text class="value">{{ workOrder.productSpec || '--' }}</text>
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
            <text class="label">负责人</text>
            <text class="value">{{ workOrder.leaderName }} ({{ workOrder.leaderDept }})</text>
          </view>
        </view>
        <view class="progress-section">
          <view class="progress-header">
            <text>生产进度</text>
            <text>{{ progressPercent }}%</text>
          </view>
          <nut-progress :percentage="progressPercent" :show-text="false" stroke-color="blue" />
        </view>
      </view>

      <!-- 2. 工单级物料清单（领料需求） -->
      <view v-if="workOrder.materialRequirements && workOrder.materialRequirements.length" class="info-card">
        <view class="card-title">物料清单 (领料需求)</view>
        <view class="material-list">
          <view v-for="(item, idx) in workOrder.materialRequirements" :key="idx" class="material-item">
            <view class="material-info">
              <text class="material-name">{{ item.materialName }}</text>
              <text class="material-code">{{ item.materialSap }}</text>
            </view>
            <view class="material-qty">
              <text>需求: {{ item.requiredQty }} EA</text>
              <text :class="(item.pickedQty || 0) >= (item.requiredQty || 0) ? 'picked-done' : 'picked-pending'">
                已领: {{ item.pickedQty || 0 }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 3. 工序列表卡片 -->
      <view v-if="workOrder.operations && workOrder.operations.length" class="info-card">
        <view class="card-title">工序进度</view>
        <view class="operations-list">
          <view v-for="(op, idx) in workOrder.operations" :key="op.id" class="operation-card">
            <!-- 工序头部 -->
            <view class="operation-header">
              <view class="step-index">{{ idx + 1 }}</view>
              <view class="op-name">{{ op.operationName }} ({{ op.operationCode }})</view>
              <view class="op-status" :class="opStatusClass(op.status)">{{ opStatusLabel(op.status) }}</view>
            </view>
            <!-- 工序进度 -->
            <view class="op-progress">
              <text>完成: {{ op.completedQty }} / {{ op.planQty }} 件</text>
              <nut-progress :percentage="opPercent(op)" :show-text="false" stroke-color="blue" class="op-progress-bar" />
            </view>
            <!-- 该工序的物料需求 -->
            <view v-if="op.materialInputRequirements && op.materialInputRequirements.length" class="op-materials">
              <view class="subtitle">📦 本工序投料需求</view>
              <view v-for="(req, ri) in op.materialInputRequirements" :key="ri" class="op-material-item">
                <view class="material-info">
                  <text class="material-name">{{ req.materialName }}</text>
                  <text class="material-sap">({{ req.materialSap }})</text>
                  <text v-if="req.isSNManaged" class="badge-sn">SN</text>
                  <text v-else-if="req.isLotManaged" class="badge-lot">批次</text>
                </view>
                <view class="material-qty-summary">
                  <text>需求: {{ req.plannedQty }}</text>
                  <text>已投: {{ req.consumedQty || 0 }}</text>
                </view>
                <!-- 投料明细记录 -->
                <view v-if="req.materialInputs && req.materialInputs.length" class="input-list">
                  <view v-for="(input, ii) in req.materialInputs" :key="ii" class="input-item">
                    <text>📌 {{ input.materialName }} ({{ input.materialSap }})</text>
                    <text>数量: {{ input.quantity }}</text>
                  </view>
                </view>
                <view v-else class="input-empty">暂无投料记录</view>
              </view>
            </view>
            <view v-else class="op-materials-empty">该工序无物料需求</view>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <nut-button v-if="workOrder.status === 'Pending'" type="primary" block @click="goToPicking">去领料</nut-button>
        <nut-button v-if="workOrder.status === 'Processing'" type="success" block @click="goToProduction">继续生产</nut-button>
        <nut-button v-if="workOrder.status === 'Completed'" type="info" block plain @click="goToTrace">查看追溯</nut-button>
      </view>
    </view>

    <view v-else class="error-state">
      <nut-empty description="工单不存在或加载失败" />
      <nut-button type="primary" @click="backToList">返回工单列表</nut-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderDetail } from '@/types/work-order'
import { getWorkOrderDetail } from '@/api/work-order' // 需要实现此接口

const instance = Taro.getCurrentInstance()
const workOrderId = instance?.router?.params?.id || ''

const loading = ref(true)
const workOrder = ref<WorkOrderDetail | null>(null)

// 计算整体进度
const progressPercent = computed(() => {
  if (!workOrder.value) return 0
  const total = workOrder.value.plannedQty
  if (total === 0) return 0
  return Math.round((workOrder.value.completedQty / total) * 100)
})

// 辅助函数
const statusLabel = (s: string) => ({ Pending: '待领料', Processing: '生产中', Completed: '已完成' }[s] || s)
const statusClass = (s: string) => ({ Pending: 'status-pending', Processing: 'status-progress', Completed: 'status-completed' }[s] || '')
const opStatusLabel = (s: string) => ({ Pending: '待处理', Processing: '进行中', Completed: '已完成' }[s] || s)
const opStatusClass = (s: string) => ({ Pending: 'op-pending', Processing: 'op-progress', Completed: 'op-completed' }[s] || '')
const opPercent = (op: any) => op.planQty ? Math.round((op.completedQty / op.planQty) * 100) : 0

// 跳转
const goToPicking = () => Taro.navigateTo({ url: `/pages/picking/index?workOrderId=${workOrderId}` })
const goToProduction = () => Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${workOrderId}` })
const goToTrace = () => Taro.navigateTo({ url: `/pages/prod-trace/index?workOrderId=${workOrderId}` })
const backToList = () => Taro.navigateTo({ url: '/pages/work/order-list' })

// 加载工单详情
const loadData = async () => {
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => backToList(), 1500)
    return
  }
  loading.value = true
  try {
    const data = await getWorkOrderDetail(workOrderId)
    workOrder.value = data
  } catch (err) {
    console.error('加载工单失败', err)
    Taro.showToast({ title: '加载失败', icon: 'none' })
    workOrder.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
@import './order-detail.scss';
</style>
