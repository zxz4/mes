<template>
  <view class="work-order-detail-page">
    <NavBar :title="`工单详情`" :show-back="true" />

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <!-- <nut-loading type="circular" /> -->
    </view>

    <!-- 内容区域 -->
    <view v-else-if="workOrder" class="detail-content">
      <!-- 基本信息卡片 -->
      <view class="info-card">
        <view class="card-title">基本信息</view>
        <view class="info-grid">
          <view class="info-item">
            <text class="label">工单编号</text>
            <text class="value highlight">{{ workOrder.orderNo }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品名称</text>
            <text class="value">{{ workOrder.productName }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品型号</text>
            <text class="value">{{ workOrder.productCode }}</text>
          </view>
          <view class="info-item">
            <text class="label">计划数量</text>
            <text class="value">{{ workOrder.planQty }} {{ workOrder.unit }}</text>
          </view>
          <view class="info-item">
            <text class="label">已完成</text>
            <text class="value">{{ workOrder.completedQty }} {{ workOrder.unit }}</text>
          </view>
          <view class="info-item">
            <text class="label">计划时间</text>
            <text class="value">{{ formatDate(workOrder.planStartTime) }} ~ {{ formatDate(workOrder.planEndTime) }}</text>
          </view>
          <view class="info-item">
            <text class="label">工单状态</text>
            <view class="status-badge" :class="statusClass(workOrder.status)">
              {{ statusLabel(workOrder.status) }}
            </view>
          </view>
        </view>
        <!-- 进度条 -->
        <view class="progress-section">
          <view class="progress-header">
            <text>生产进度</text>
            <text>{{ workOrder.progress }}%</text>
          </view>
          <nut-progress :percentage="workOrder.progress" :show-text="false" stroke-color="blue" />
        </view>
      </view>

      <!-- 物料清单卡片（BOM） -->
      <view class="info-card">
        <view class="card-title">
          <text>物料清单</text>
          <text class="subtitle">{{ materialList.length }} 项</text>
        </view>
        <view v-if="materialList.length === 0" class="empty-tip">暂无物料信息</view>
        <view v-else class="material-list">
          <view v-for="(item, idx) in materialList" :key="idx" class="material-item">
            <view class="material-info">
              <text class="material-name">{{ item.materialName }}</text>
              <text class="material-code">{{ item.materialCode }}</text>
            </view>
            <view class="material-qty">
              <text>需求: {{ item.requiredQty }} {{ item.unit }}</text>
              <text :class=" item.pickedQty && item.pickedQty  >= item.requiredQty ? 'picked-done' : 'picked-pending'">
                已领: {{ item.pickedQty || 0 }}
              </text>
            </view>
          </view>
        </view>
        <!-- 领料状态汇总 -->
        <view v-if="materialList.length" class="material-summary">
          <nut-progress
            :percentage="materialProgress"
            :show-text="false"
            stroke-color="green"
            style="height: 4px; flex: 1;"
          />
          <text class="summary-text">物料齐套率 {{ materialProgress }}%</text>
        </view>
      </view>

      <!-- 生产进度卡片（工序完成情况） -->
      <view class="info-card">
        <view class="card-title">工序进度</view>
        <view v-if="steps.length === 0" class="empty-tip">暂无工序数据</view>
        <view v-else class="steps-list">
          <view v-for="(step, idx) in steps" :key="step.id" class="step-item">
            <view class="step-index">{{ idx + 1 }}</view>
            <view class="step-info">
              <text class="step-name">{{ step.stepName }}</text>
              <text class="step-desc">{{ step.equipmentName || '未指定设备' }}</text>
            </view>
            <view class="step-status" :class="step.statusClass">
              {{ step.statusLabel }}
            </view>
          </view>
        </view>
      </view>

      <!-- 操作按钮区域 -->
      <view class="action-buttons">
        <nut-button
          v-if="workOrder.status === 'pending_material'"
          type="primary"
          block
          @click="goToPicking"
        >
          去领料
        </nut-button>
        <nut-button
          v-if="workOrder.status === 'in_production'"
          type="success"
          block
          @click="goToProduction"
        >
          继续生产
        </nut-button>
        <nut-button
          v-if="workOrder.status === 'completed'"
          type="info"
          block
          plain
          @click="goToTrace"
        >
          查看追溯
        </nut-button>
        <nut-button
          v-if="workOrder.hasAnomaly"
          type="danger"
          block
          plain
          @click="goToTrace"
        >
          查看异常
        </nut-button>
      </view>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-state">
      <nut-empty description="工单不存在或加载失败" />
      <nut-button type="primary" @click="backToList">返回工单列表</nut-button>
    </view>
  </view>
</template>

<script setup lang="ts" name="WorkOrderDetail">
import { ref, onMounted, computed } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderDetail, MaterialItem, StepProgress } from '@/types/work-order'

// 路由参数
const instance = Taro.getCurrentInstance()
const workOrderId = instance?.router?.params?.id || ''

const loading = ref(true)
const workOrder = ref<WorkOrderDetail | null>(null)
const materialList = ref<MaterialItem[]>([])
const steps = ref<StepProgress[]>([])

// 物料齐套率
const materialProgress = computed(() => {
  if (!materialList.value.length) return 0
  const totalRequired = materialList.value.reduce((sum, i) => sum + i.requiredQty, 0)
  const totalPicked = materialList.value.reduce((sum, i) => sum + (i.pickedQty || 0), 0)
  return Math.round((totalPicked / totalRequired) * 100)
})

// 辅助函数
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
  const parts = dateStr.split('-')
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`
  return dateStr
}

// 跳转
const goToPicking = () => {
  Taro.navigateTo({ url: `/pages/pick-material/pick-material?workOrderId=${workOrderId}` })
}

const goToProduction = () => {
  Taro.navigateTo({ url: `/pages/prod-operation/prod-operation?workOrderId=${workOrderId}` })
}

const goToTrace = () => {
  Taro.navigateTo({ url: `/pages/prod-trace/prod-trace?workOrderId=${workOrderId}` })
}

const backToList = () => {
  Taro.navigateBack()
}

// 模拟加载数据（实际替换为接口请求）
const loadData = async () => {
  loading.value = true
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 根据工单ID返回不同数据（演示）
  if (workOrderId === 'WO001') {
    workOrder.value = {
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
    }
    materialList.value = [
      { materialName: '电芯', materialCode: 'CEL-4815', requiredQty: 200, unit: '个', pickedQty: 0 },
      { materialName: '端板组件', materialCode: 'EP-48S', requiredQty: 200, unit: '套', pickedQty: 0 },
      { materialName: '绝缘片', materialCode: 'INS-01', requiredQty: 200, unit: '片', pickedQty: 0 }
    ]
    steps.value = []
  } else if (workOrderId === 'WO002') {
    workOrder.value = {
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
    }
    materialList.value = [
      { materialName: '轴承', materialCode: 'BRG-300', requiredQty: 500, unit: '个', pickedQty: 500 },
      { materialName: '外壳', materialCode: 'CAS-300K', requiredQty: 500, unit: '套', pickedQty: 500 },
      { materialName: '润滑油', materialCode: 'LUB-01', requiredQty: 500, unit: '毫升', pickedQty: 500 }
    ]
    steps.value = [
      { id: 1, stepName: '短板加工', status: 'completed', statusLabel: '已完成', statusClass: 'step-done', equipmentName: '加工中心' },
      { id: 2, stepName: '电芯三合一检测', status: 'completed', statusLabel: '已完成', statusClass: 'step-done', equipmentName: '检测仪' },
      { id: 3, stepName: 'CSS组装', status: 'anomaly', statusLabel: '异常', statusClass: 'step-anomaly', equipmentName: '组装机' },
      { id: 4, stepName: '激光焊接', status: 'in-progress', statusLabel: '进行中', statusClass: 'step-progress', equipmentName: '焊接平台' },
      { id: 5, stepName: '模组EOL测试', status: 'pending', statusLabel: '待处理', statusClass: 'step-pending', equipmentName: '测试机' }
    ]
  } else {
    // 默认数据
    workOrder.value = {
      id: workOrderId,
      orderNo: `MES-${workOrderId}`,
      productName: '示例产品',
      productCode: 'DEMO',
      planQty: 100,
      completedQty: 0,
      unit: '个',
      status: 'pending_material',
      planStartTime: '2026-06-01',
      planEndTime: '2026-06-10',
      progress: 0,
      hasAnomaly: false
    }
    materialList.value = []
    steps.value = []
  }
  loading.value = false
}

onMounted(() => {
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => backToList(), 1500)
    return
  }
  loadData()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.work-order-detail-page {
  min-height: 100vh;
  background: $tp-help;
  padding-bottom: 30px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.detail-content {
  padding: 12px 16px;
}

.info-card {
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: $tp-shadow-sm;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: $tp-title;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .subtitle {
    font-size: 12px;
    font-weight: normal;
    color: $tp-text;
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
  .status-badge {
    align-self: flex-start;
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

.progress-section {
  margin-top: 8px;
  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 8px;
    color: $tp-text;
  }
}

.material-list {
  .material-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    &:last-child {
      border-bottom: none;
    }
    .material-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .material-name {
        font-size: 14px;
        font-weight: 500;
        color: $tp-title;
      }
      .material-code {
        font-size: 11px;
        color: $tp-text;
      }
    }
    .material-qty {
      text-align: right;
      font-size: 12px;
      color: $tp-text;
      display: flex;
      flex-direction: column;
      gap: 2px;
      .picked-done {
        color: $tp-success;
      }
      .picked-pending {
        color: $tp-danger;
      }
    }
  }
}

.material-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  .summary-text {
    font-size: 11px;
    color: $tp-primary;
    white-space: nowrap;
  }
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  .step-index {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: $tp-help;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: $tp-text;
    flex-shrink: 0;
  }
  .step-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    .step-name {
      font-size: 14px;
      font-weight: 500;
      color: $tp-title;
    }
    .step-desc {
      font-size: 11px;
      color: $tp-text;
    }
  }
  .step-status {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
    white-space: nowrap;
    &.step-done {
      background: rgba($tp-success, 0.1);
      color: $tp-success;
    }
    &.step-progress {
      background: rgba(#fa8c16, 0.1);
      color: #fa8c16;
    }
    &.step-pending {
      background: rgba($tp-text, 0.1);
      color: $tp-text;
    }
    &.step-anomaly {
      background: rgba($tp-danger, 0.1);
      color: $tp-danger;
    }
  }
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: $tp-text;
  font-size: 12px;
}

.action-buttons {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
