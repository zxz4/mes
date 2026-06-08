<template>
  <TabbarLayout>
    <view class="work-order-detail-page">
      <NavBar :title="`工单详情`" :show-back="true" />

      <view v-if="loading" class="loading-state"></view>

      <view v-else-if="workOrder" class="detail-content">
        <!-- 基本信息卡片 -->
        <view class="info-card">
          <view class="card-header">
            <text class="card-title">基本信息</text>
            <view class="status-badge" :class="statusClass(workOrder.status)">
              {{ statusLabel(workOrder.status) }}
            </view>
          </view>
          <view class="info-grid">
            <view class="info-item">
              <text class="label">项目编码</text>
              <text class="value highlight">{{ workOrder.projectCode }}</text>
            </view>
            <view class="info-item">
              <text class="label">项目名称</text>
              <text class="value">{{ workOrder.projectName }}</text>
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
              <text class="label">负责人</text>
              <text class="value">{{ workOrder.leaderName }} ({{ workOrder.leaderDept }})</text>
            </view>
          </view>
          <view class="progress-section">
            <view class="progress-header"><text>生产进度{{`(${workOrder.completedQty}/${workOrder.planQty})`}}</text><text>{{ workOrder.progress }}%</text></view>
            <nut-progress :percentage="workOrder.progress" :show-text="false" stroke-color="blue" />
          </view>
        </view>

        <!-- 物料清单卡片（BOM） -->
        <view class="info-card" v-if="materialList.length">
          <view class="card-title">物料清单 <text class="subtitle">{{ materialList.length }} 项</text></view>
          <view class="material-list">
            <view v-for="(item, idx) in materialList" :key="idx" class="material-item">
              <view class="material-info">
                <text class="material-name">{{ item.materialName }}</text>
                <text class="material-code">{{ item.materialCode }}</text>
              </view>
              <view class="material-qty">
                <text>需求: {{ item.requiredQty }} {{ item.unit }}</text>
                <text :class="item.pickedQty && item.pickedQty >= item.requiredQty ? 'picked-done' : 'picked-pending'">
                  已领: {{ item.pickedQty || 0 }}
                </text>
              </view>
            </view>
          </view>
          <view class="material-summary" v-if="materialList.length">
            <nut-progress :percentage="materialProgress" :show-text="false" stroke-color="green"
              style="height:4px; flex:1;" />
            <text class="summary-text">物料齐套率 {{ materialProgress }}%</text>
          </view>
        </view>

        <!-- 工序进度卡片（修正样式） -->
        <view class="info-card" v-if="steps.length">
          <view class="card-header">
            <text class="card-title">工序进度</text>
          </view>
          <view class="steps-list">
            <view v-for="(step, idx) in steps" :key="step.id" class="step-item">
              <view class="step-header">
                <view class="step-index">{{ idx + 1 }}</view>
                <view class="step-name">{{ step.stepName }}</view>
                <view class="step-status" :class="step.statusClass">{{ step.statusLabel }}</view>
              </view>
              <view class="step-progress-info">
                <text>加工进度：{{ step.completedQty }} / {{ step.planQty }} 件</text>
              </view>
              <view v-if="step.consumedMaterials?.length" class="step-material-info">
                <text class="material-label">物料消耗：</text>
                <text v-for="(m, mi) in step.consumedMaterials" :key="mi" class="material-item">
                  {{ m.materialName }} {{ m.consumedQty }}{{ m.unit }}
                </text>
              </view>
              <view class="step-equipment" v-if="step.equipmentName">
                <text>设备：{{ step.equipmentName }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <nut-button v-if="workOrder.status === 'pending_material'" type="primary" block
            @click="goToPicking">去领料</nut-button>
          <nut-button v-if="workOrder.status === 'in_production'" type="success" block
            @click="goToProduction">继续生产</nut-button>
          <nut-button v-if="workOrder.status === 'completed'" type="info" block plain
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
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderDetail, MaterialItem, StepProgress } from '@/types/work-order'
import TabbarLayout from '@/components/TabbarLayout.vue'


const instance = Taro.getCurrentInstance()
const workOrderId = instance?.router?.params?.id || ''

const loading = ref(true)
const workOrder = ref<WorkOrderDetail | null>(null)
const materialList = ref<MaterialItem[]>([])
const steps = ref<StepProgress[]>([])

const materialProgress = computed(() => {
  if (!materialList.value.length) return 0
  const totalRequired = materialList.value.reduce((sum, i) => sum + i.requiredQty, 0)
  const totalPicked = materialList.value.reduce((sum, i) => sum + (i.pickedQty || 0), 0)
  return Math.round((totalPicked / totalRequired) * 100)
})

const statusLabel = (s: string) => ({ pending_material: '待领料', in_production: '生产中', completed: '已完成' }[s] || s)
const statusClass = (s: string) => ({ pending_material: 'status-pending', in_production: 'status-progress', completed: 'status-completed' }[s] || '')

const goToPicking = () => Taro.navigateTo({ url: `/pages/prod/pick-material?workOrderId=${workOrderId}` })
const goToProduction = () => Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${workOrderId}` })
const backToList = () => Taro.navigateBack()
const goToTrace = () => Taro.navigateTo({ url: `/pages/prod/prod-trace?workOrderId=${workOrderId}` })

// 工序完成统计（未使用但保留）
const completedStepsCount = computed(() => steps.value.filter(s => s.status === 'completed').length)

// 加载数据（模拟）
const loadData = async () => {
  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
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
      { materialName: '电芯', materialCode: 'CEL-4815', requiredQty: 132, unit: '个', pickedQty: 0 },
      { materialName: '端板组件', materialCode: 'EP-48S', requiredQty: 132, unit: '套', pickedQty: 0 }
    ]
    steps.value = []
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
      status: 'in_production',
      progress: 50,
      hasAnomaly: true,
      leaderName: '白天宇',
      leaderDept: '电力产品一部一组'
    }
    materialList.value = [
      { materialName: '电芯', materialCode: 'CEL-4815', requiredQty: 80, unit: '个', pickedQty: 40 },
      { materialName: '端板组件', materialCode: 'EP-48S', requiredQty: 80, unit: '套', pickedQty: 40 }
    ]
    steps.value = [
      {
        id: 1,
        stepName: '短板加工',
        status: 'completed',
        statusLabel: '已完成',
        statusClass: 'step-done',
        equipmentName: '加工中心',
        planQty: 200,
        completedQty: 200,
        consumedMaterials: [
          { materialName: '铝板', consumedQty: 200, unit: '片' }
        ]
      },
      {
        id: 2,
        stepName: '电芯三合一检测',
        status: 'in-progress',
        statusLabel: '进行中',
        statusClass: 'step-progress',
        equipmentName: '检测仪',
        planQty: 200,
        completedQty: 120,
        consumedMaterials: [
          { materialName: '探针', consumedQty: 120, unit: '支' }
        ]
      }
    ]
  } else if (workOrderId === 'WO003') {
    workOrder.value = {
      id: 'WO003',
      projectCode: 'PJ_0823',
      projectName: 'SC0261-314-R2.3_1306kWh_TD_新加坡',
      productName: 'SC0261-314-R2.3',
      productSap: '91062669',
      productType: 'EVE-BS-ES0726-11',
      productSpec: '2*3P198S',
      planQty: 5,
      completedQty: 5,
      leaderName: '纪云龙',
      leaderDept: 'AC261国内产品部一组',
      unit: 'EA',
      status: 'completed',
      progress: 100,
      hasAnomaly: false
    }
    materialList.value = [
      { materialName: '电芯', materialCode: 'CEL-4815', requiredQty: 660, unit: '个', pickedQty: 660 },
      { materialName: '端板组件', materialCode: 'EP-48S', requiredQty: 660, unit: '套', pickedQty: 660 }
    ]
    steps.value = [
      {
        id: 1,
        stepName: '短板加工',
        status: 'completed',
        statusLabel: '已完成',
        statusClass: 'step-done',
        equipmentName: '加工中心',
        planQty: 1000,
        completedQty: 1000,
        consumedMaterials: [
          { materialName: '铝板', consumedQty: 1000, unit: '片' }
        ]
      },
      {
        id: 2,
        stepName: '电芯三合一检测',
        status: 'completed',
        statusLabel: '已完成',
        statusClass: 'step-done',
        equipmentName: '检测仪',
        planQty: 1000,
        completedQty: 1000,
        consumedMaterials: [
          { materialName: '探针', consumedQty: 1000, unit: '支' }
        ]
      }
    ]

  } else {
    workOrder.value = null
  }
  loading.value = false
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

/* 卡片通用样式 */
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

  /* 工序列表样式（新结构，垂直布局） */
  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .step-item {
    background: $tp-help;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 0; // 由父级 gap 控制间距

    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .step-index {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: $tp-white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: $tp-primary;
      flex-shrink: 0;
    }

    .step-name {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: $tp-title;
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

    .step-progress-info,
    .step-material-info,
    .step-equipment {
      font-size: 12px;
      color: $tp-text;
      margin-top: 6px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .material-label {
      font-weight: 500;
      color: $tp-title;
    }

    .material-item {
      background: $tp-white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      color: $tp-text;
    }
  }
}

/* 操作按钮区域 */
.action-buttons {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
