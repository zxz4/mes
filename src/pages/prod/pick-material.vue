<template>
  <view class="picking-page">
    <NavBar :title="`物料领料`" :show-back="true" />

    <!-- 错误或状态不允许领料 -->
    <view v-if="!canPick" class="error-state">
      <nut-empty :description="errorMessage" />
      <nut-button type="primary" @click="backToDetail">返回工单详情</nut-button>
    </view>

    <!-- 正常领料表单 -->
    <view v-else-if="workOrder" class="picking-content">
      <!-- 1. 项目基本信息卡片 -->
      <view class="info-card">
        <view class="card-title">项目信息</view>
        <view class="info-grid">
          <view class="info-item">
            <text class="label">项目名称</text>
            <text class="value">{{ workOrder.projectName }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品型号</text>
            <text class="value">{{ workOrder.productName }}</text>
          </view>
          <view class="info-item">
            <text class="label">产品SAP</text>
            <text class="value">{{ workOrder.productSap }}</text>
          </view>
          <view class="info-item">
            <text class="label">生产数量</text>
            <text class="value highlight">{{ workOrder.planQty }} {{ workOrder.unit }}</text>
          </view>
          <view class="info-item">
            <text class="label">工单状态</text>
            <view class="status-badge" :class="statusClass(workOrder.status)">
              {{ statusLabel(workOrder.status) }}
            </view>
          </view>
        </view>
      </view>

      <!-- 2. 物料清单卡片（可编辑领料数量） -->
      <view class="info-card">
        <view class="card-title">物料清单 <text class="subtitle">请确认/修改领料数量</text></view>
        <view class="material-list">
          <view v-for="(item, idx) in materialList" :key="idx" class="material-item">
            <view class="material-info">
              <text class="material-name">{{ item.materialName }}</text>
              <text class="material-code">{{ item.materialCode }}</text>
            </view>
            <view class="material-qty-input">
              <text class="req-qty">需求: {{ item.requiredQty }}{{ item.unit }}</text>
              <nut-input
                type="number"
                v-model="item.pickQty"
                :placeholder="'实际领料数量'"
                class="pick-input"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 3. 工艺路线选择卡片（静态数据） -->
      <view class="info-card">
        <view class="card-title">工艺路线 <text class="subtitle">选择该工单使用的工艺</text></view>
        <view class="process-select">
          <nut-radio-group v-model="selectedProcessId" direction="vertical">
            <nut-radio
              v-for="process in processOptions"
              :key="process.id"
              :label="process.id"
              class="process-radio"
            >
              <view class="process-info">
                <text class="process-name">{{ process.name }}</text>
                <text class="process-desc">{{ process.description }}</text>
              </view>
            </nut-radio>
          </nut-radio-group>
        </view>
      </view>

      <!-- 4. 提交按钮 -->
      <view class="action-buttons">
        <nut-button type="primary" block :loading="submitting" @click="submitPicking">
          确认领料并开始生产
        </nut-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderDetail, MaterialItem } from '@/types/work-order'

// 路由参数
const instance = Taro.getCurrentInstance()
const workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || ''

// 页面状态
const loading = ref(true)
const submitting = ref(false)
const canPick = ref(true)
const errorMessage = ref('')

// 工单数据
const workOrder = ref<WorkOrderDetail | null>(null)
const materialList = ref<(MaterialItem & { pickQty?: number })[]>([])

// 工艺选项（静态）
const processOptions = [
  {
    id: 'PROCESS_STD',
    name: '标准工艺路线',
    description: '包含短板加工 → 电芯检测 → CSS组装 → 激光焊接 → EOL测试'
  },
  {
    id: 'PROCESS_FAST',
    name: '快速工艺路线',
    description: '跳过部分检测工序，适用于紧急订单'
  }
]
const selectedProcessId = ref('PROCESS_STD')

// 状态辅助函数
const statusLabel = (s: string) => ({ pending_material: '待领料', in_production: '生产中', completed: '已完成' }[s] || s)
const statusClass = (s: string) => ({ pending_material: 'status-pending', in_production: 'status-progress', completed: 'status-completed' }[s] || '')

// 返回工单详情
const backToDetail = () => {
  Taro.navigateBack()
}

// 提交领料
const submitPicking = async () => {
  // 校验领料数量
  for (const item of materialList.value) {
    const pickQty = item.pickQty ?? 0
    if (pickQty < 0 || pickQty > item.requiredQty) {
      Taro.showToast({ title: `${item.materialName} 领料数量不合法`, icon: 'none' })
      return
    }
  }
  // 确认操作
  const confirm = await Taro.showModal({
    title: '确认领料',
    content: `将领取物料并确定工单工艺为“${processOptions.find(p => p.id === selectedProcessId.value)?.name}”，是否继续？`,
    confirmText: '确认',
    cancelText: '取消'
  })
  if (!confirm.confirm) return

  submitting.value = true
  try {
    // 模拟提交接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 实际应调用接口更新工单的物料已领数量、工艺路线ID、工单状态为 in_production
    Taro.showToast({ title: '领料成功，工单已进入生产', icon: 'success' })
    setTimeout(() => {
      // 跳转到生产页面（或工单详情）
      Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${workOrderId}` })
    }, 1500)
  } catch (error) {
    Taro.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// 加载工单信息
const loadData = async () => {
  loading.value = true
  try {
    // 模拟接口请求，实际替换为真实API
    await new Promise(resolve => setTimeout(resolve, 500))
    // 根据 workOrderId 获取工单详情和物料清单（实际从后端获取）
    if (workOrderId === 'WO001') {
      workOrder.value = {
        id: 'WO001',
        projectCode: 'PJ_1098',
        projectName: 'SM1178D-310-R2.1_1178.496kWh_中交',
        productName: 'SM1178D-310-R2.1',
        productSap: '91070999',
        productType: 'EVE-BS-ES0726-11',
        productSpec: '2*3P198S',
        planQty: 1,
        completedQty: 0,
        unit: 'EA',
        status: 'pending_material',
        progress: 0,
        hasAnomaly: false,
        leaderName: '吴兴林',
        leaderDept: '模块产品部二组'
      }
      materialList.value = [
        { materialName: '电芯', materialCode: 'CEL-4815', requiredQty: 132, unit: '个', pickedQty: 0, pickQty: 132 },
        { materialName: '端板组件', materialCode: 'EP-48S', requiredQty: 132, unit: '套', pickedQty: 0, pickQty: 132 }
      ]
    } else if (workOrderId === 'WO002') {
      workOrder.value = {
        id: 'WO002',
        projectCode: 'PJ_1076',
        projectName: 'SE5015D-628-R1.1_400MWh_宁夏中光电',
        productName: 'SE5015D-628-R1.1',
        productSap: '91070575',
        productType: 'S556H214',
        productSpec: 'S5MB56-0.25P',
        planQty: 80,
        completedQty: 40,
        unit: 'EA',
        status: 'in_production',  // 生产中，不允许再次领料
        progress: 50,
        hasAnomaly: true,
        leaderName: '白天宇',
        leaderDept: '电力产品一部一组'
      }
      materialList.value = []
    } else {
      // 默认模拟一个待领料工单
      workOrder.value = {
        id: workOrderId,
        projectCode: 'PRJ_DEMO',
        projectName: '演示项目',
        productName: '演示产品',
        productSap: 'DEMO001',
        productType: 'DEMO',
        productSpec: '标准',
        planQty: 100,
        completedQty: 0,
        unit: '个',
        status: 'pending_material',
        progress: 0,
        hasAnomaly: false,
        leaderName: '测试员',
        leaderDept: '生产部'
      }
      materialList.value = [
        { materialName: '物料A', materialCode: 'MAT-A', requiredQty: 100, unit: '个', pickedQty: 0, pickQty: 100 },
        { materialName: '物料B', materialCode: 'MAT-B', requiredQty: 50, unit: '套', pickedQty: 0, pickQty: 50 }
      ]
    }

    // 状态校验：仅待领料的工单可进入领料页
    if (workOrder.value.status !== 'pending_material') {
      canPick.value = false
      errorMessage.value = workOrder.value.status === 'in_production'
        ? '工单已进入生产，不可重复领料'
        : workOrder.value.status === 'completed'
        ? '工单已完成，无法领料'
        : '当前工单状态不允许领料操作'
    } else {
      canPick.value = true
    }
  } catch (error) {
    canPick.value = false
    errorMessage.value = '加载工单信息失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误，自动跳转到工单列表', icon: 'none' })
    setTimeout(() => Taro.navigateTo({ url: '/pages/work/order-list' }), 1500)
    return
  }
  loadData()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.picking-page {
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

.picking-content {
  padding: 12px 16px;
}

/* 卡片通用样式 */
.info-card {
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: $tp-shadow-sm;

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

  .material-list {
    .material-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      flex-wrap: wrap;
      gap: 8px;

      &:last-child {
        border-bottom: none;
      }

      .material-info {
        flex: 2;
        min-width: 120px;
        .material-name {
          font-size: 14px;
          font-weight: 500;
          color: $tp-title;
          display: block;
        }
        .material-code {
          font-size: 11px;
          color: $tp-text;
        }
      }

      .material-qty-input {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        .req-qty {
          font-size: 12px;
          color: $tp-text;
          white-space: nowrap;
        }
        .pick-input {
          width: 120px;
        }
      }
    }
  }

  .process-select {
    .process-radio {
      margin-bottom: 12px;
      padding: 10px;
      background: $tp-help;
      border-radius: 8px;
      width: 100%;
      :deep(.nut-radio-label) {
        width: 100%;
      }
      .process-info {
        margin-left: 24px;
        .process-name {
          font-size: 14px;
          font-weight: 600;
          color: $tp-title;
          display: block;
        }
        .process-desc {
          font-size: 11px;
          color: $tp-text;
        }
      }
    }
  }
}

.action-buttons {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
