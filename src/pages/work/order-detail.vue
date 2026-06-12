<template>
  <TabbarLayout>
    <view class="work-order-detail-page">
      <NavBar :title="`工单详情`" :show-back="true" />

      <view v-if="workOrder" class="detail-content">
        <!-- 基本信息卡片 -->
        <view class="info-card">
          <view class="card-header">
            <text class="card-title">基本信息</text>
            <view class="status-badge" :class="statusClass(workOrder.status)">
              {{ statusLabel(workOrder.status) }}
            </view>
          </view>
          <view class="info-grid">
            <view class="info-item"><text class="label">项目编码</text><text class="value highlight">{{
              workOrder.workOrderNo }}</text></view>
            <view class="info-item"><text class="label">项目名称</text><text class="value">{{ workOrder.workOrderName
            }}</text></view>
            <view class="info-item"><text class="label">产品名称</text><text class="value">{{ workOrder.productName
            }}</text></view>
            <view class="info-item"><text class="label">产品SAP码</text><text class="value">{{ workOrder.productSap
            }}</text></view>
            <view class="info-item"><text class="label">产品类型</text><text class="value">{{ workOrder.productType || '--'
            }}</text></view>
            <view class="info-item"><text class="label">产品规格</text><text class="value">{{ workOrder.productSpec || '--'
            }}</text></view>
            <view class="info-item"><text class="label">负责人</text><text class="value">{{ workOrder.leaderName }} ({{
              workOrder.leaderDept }})</text></view>
          </view>
          <view class="progress-section">
            <view class="progress-header"><text>生产进度</text><text>{{ `${workOrder.completedQty}/${workOrder.plannedQty}`
                }}</text></view>
            <nut-progress :percentage="workOrder.completedQty / workOrder.plannedQty" :show-text="false"
              stroke-color="blue" />
          </view>
        </view>

        <!-- 物料清单卡片（BOM） -->
        <view class="info-card" v-if="workOrder.materialRequirements.length">
          <view class="card-title">物料清单 <text class="subtitle">{{ workOrder.materialRequirements.length }} 项</text></view>
          <view class="material-list">
            <view v-for="(item, idx) in workOrder.materialRequirements" :key="idx" class="material-item">
              <view class="material-info">
                <text class="material-name">{{ item.materialName }}</text>
                <text class="material-code">{{ item.materialCode }}</text>
              </view>
              <view class="material-qty">
                <text>需求: {{ item.requiredQty }} EA</text>
                <text :class="item.pickedQty && item.pickedQty >= item.requiredQty ? 'picked-done' : 'picked-pending'">
                  已领: {{ item.pickedQty || 0 }}
                </text>
              </view>
            </view>
          </view>
          <view class="material-summary" v-if="workOrder.materialRequirements.length">
            <nut-progress :percentage="materialProgress" :show-text="false" stroke-color="green"
              style="height:4px; flex:1;" />
            <text class="summary-text">物料齐套率 {{ materialProgress }}%</text>
          </view>
        </view>

        <!-- 工序进度卡片（核心：展示每个工序的完成量和物料消耗） -->
        <view class="info-card" v-if="steps.length">
          <view class="card-header">
            <text class="card-title">工序进度</text>
          </view>
          <view class="steps-list">
            <view v-for="(step, idx) in steps" :key="step.id" class="step-item-card">
              <!-- 工序头部 -->
              <view class="step-header">
                <view class="step-index">{{ idx + 1 }}</view>
                <view class="step-name">{{ step.stepName }}</view>
                <view class="step-status" :class="step.statusClass">{{ step.statusLabel }}</view>
              </view>
              <!-- 进度信息 -->
              <view class="step-progress-info">
                <text>加工进度：{{ step.completedQty }} / {{ step.planQty }} 件</text>
                <!-- <nut-progress :percentage="step.percent" :show-text="false" stroke-color="blue"
                  class="step-progress-bar" /> -->
              </view>
              <!-- 物料消耗明细（该工序消耗的物料） -->
              <view v-if="step.consumedMaterials && step.consumedMaterials.length" class="step-material-info">
                <text class="material-label">消耗物料：</text>
                <view class="material-tag-list">
                  <text v-for="(m, mi) in step.consumedMaterials" :key="mi" class="material-tag">
                    {{ m.materialName }}: {{ m.consumedQty }}{{ m.unit }}
                  </text>
                </view>
              </view>
              <!-- 设备信息 -->
              <view class="step-equipment" v-if="step.equipmentName">
                <text>设备：{{ step.equipmentName }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <nut-button v-if="workOrder.status === 'Pending'" type="primary" block @click="goToPicking">去领料</nut-button>
          <nut-button v-if="workOrder.status === 'Processing'" type="success" block
            @click="goToProduction">继续生产</nut-button>
          <nut-button v-if="workOrder.status === 'Completed'" type="info" block plain
            @click="goToTrace">查看追溯</nut-button>
          <nut-button v-if="workOrder.hasAnomaly" type="danger" block plain @click="goToTrace">查看异常</nut-button>
        </view>
      </view>

      <view v-else class="error-state">
        <nut-empty description="工单不存在或加载失败" />
        <nut-button type="primary" @click="backToList">返回工单列表</nut-button>
      </view>
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts">

import { ref, computed, onMounted } from 'vue'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderDetail, StepProgress } from '@/types/work-order'
import TabbarLayout from '@/components/TabbarLayout.vue'
import { getWorkOrder } from '@/api/work-order'




const workOrder = ref<WorkOrderDetail | null>(null)
const steps = ref<StepProgress[]>([])

const materialProgress = computed(() => {
  if (!workOrder.value?.materialRequirements.length) return 0
  const totalRequired = workOrder.value?.materialRequirements.reduce((sum, i) => sum + i.requiredQty, 0)
  const totalPicked = workOrder.value?.materialRequirements.reduce((sum, i) => sum + (i.pickedQty || 0), 0)
  return Math.round((totalPicked / totalRequired) * 100)
})

const statusLabel = (s: string) => ({ Pending: '待领料', Processing: '生产中', completed: '已完成' }[s] || s)
const statusClass = (s: string) => ({ Pending: 'status-pending', Processing: 'status-progress', completed: 'status-completed' }[s] || '')

const goToPicking = () => Taro.navigateTo({ url: `/pages/prod/pick-material?workOrderId=${workOrder.value?.id}` })
const goToProduction = () => Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${workOrder.value?.id}` })
const backToList = () => Taro.navigateTo({ url: '/pages/work/order-list' })
const goToTrace = () => Taro.navigateTo({ url: `/pages/prod/prod-trace?workOrderId=${workOrder.value?.id}` })


onMounted(() => {
  let workOrderId = getCurrentInstance()?.router?.params?.id || ''
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误，自动跳转到工单列表', icon: 'none' })
    setTimeout(() => Taro.navigateTo({ url: '/pages/work/order-list' }), 1500)
    return
  }
  else {
    getWorkOrder(workOrderId).then(data => {
      workOrder.value = data;
    });
  }

})
</script>

<style lang="scss" scoped>
@import './order-detail.scss';
</style>
