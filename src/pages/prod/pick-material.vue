<template>

  <TabbarLayout>
    <view class="picking-page">
      <NavBar title="物料领料" :show-back="true" />
      <!-- 错误或状态不允许领料 -->
      <view v-if="workOrder == null" class="error-state">
        <nut-empty description="工单不存在或加载失败" />
        <nut-button type="primary" @click="backToList">返回工单列表</nut-button>
      </view>

      <!-- 正常领料表单 -->
      <view v-else class="picking-content">
        <!-- 1. 项目基本信息卡片 -->
        <view class="info-card">
          <view class="card-title">项目信息</view>
          <view class="info-grid">
            <view class="info-item">
              <text class="label">项目名称</text>
              <text class="value">{{ workOrder.workOrderName }}</text>
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
              <text class="value highlight">{{ workOrder.plannedQty }} EA</text>
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
                <text class="req-qty">需求: {{ item.requiredQty }} EA</text>
                <nut-input type="number" v-model="item.pickedQty" :placeholder="'实际领料数量'" class="pick-input" />
              </view>
            </view>
          </view>
        </view>

        <!-- 3. 工艺路线选择卡片（静态数据） -->
        <view class="info-card">
          <view class="card-title">工艺路线 <text class="subtitle">选择该工单使用的工艺</text></view>
          <view class="process-select">
            <nut-radio-group v-model="workOrder.processRouteId" direction="vertical">
              <nut-radio v-for="process in processStore.routes" :key="process.id" :label="process.id" class="process-radio">
                <view class="process-info">
                  <text class="process-name">{{ process.routeName }}</text>
                  <!-- <text class="process-desc">{{ process.description }}</text> -->
                </view>
              </nut-radio>
            </nut-radio-group>
          </view>
        </view>

        <!-- 4. 提交按钮 -->
        <view class="action-buttons">
          <nut-button v-show="workOrder.status == 'Pending'" type="primary" block @click="submitPicking">
            确认领料并开始生产
          </nut-button>
        </view>
      </view>
    </view>
  </TabbarLayout>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import type { WorkOrderDetail, MaterialRequirement } from '@/types/work-order'
import { getWorkOrder, startWorking } from '@/api/work-order'
import TabbarLayout from '@/components/TabbarLayout.vue'
import { useProcessStore } from '@/store/process'
import { getBomChildren } from '@/api/bom'

// 工单数据
const workOrder = ref<WorkOrderDetail>()

const materialList = ref<Array<MaterialRequirement>>()

// 工艺信息
const processStore = useProcessStore();

// 状态辅助函数
const statusLabel = (s: string) => ({ Pending: '待领料', Processing: '生产中', completed: '已完成' }[s] || s)
const statusClass = (s: string) => ({ Pending: 'status-pending', Processing: 'status-progress', completed: 'status-completed' }[s] || '')
// 返回工单详情
const backToList = () => {
  Taro.navigateTo({ url: '/pages/work/order-list' })
}

// 提交领料
const submitPicking = async () => {
  if (workOrder.value == null) {
    return;
  }
  // 校验领料数量
  if(materialList.value==null){
    Taro.showToast({ title: '未获取BOMS信息', icon: 'none' })
    return;
  }
  for (let item of materialList.value) {
    let pickQty = item.pickedQty ?? 0
    if (pickQty <= 0 || pickQty > item.requiredQty) {
      Taro.showToast({ title: `${item.materialName}领料数量不合法`, icon: 'none' })
      return
    }
  }
  // 确认操作
  let confirm = await Taro.showModal({
    title: '确认领料',
    content: `将领取物料并确定工单工艺为“${processStore.routes.find(p => p.id === workOrder.value?.processRouteId)?.routeName}”，是否继续？`,
    confirmText: '确认',
    cancelText: '取消'
  })

  if (!confirm.confirm) return

  await startWorking(workOrder.value.id, {
    processRouteId:workOrder.value?.processRouteId,
    workOrderMaterialReq:materialList.value
  }).then(() => {
    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${workOrder.value?.id}` })
    }, 1000)
  });
}

// 加载工单信息
const loadData = async () => {
  // 路由参数
  let instance = Taro.getCurrentInstance()
  let workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || ''
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误，自动跳转到工单列表', icon: 'none' })
    setTimeout(() => Taro.navigateTo({ url: '/pages/work/order-list' }), 1500)
    return
  }
  getWorkOrder(workOrderId).then(data => {
    materialList.value = [
     { materialName: '物料A', materialCode: 'MAT-A', requiredQty: 100, pickedQty: 0 },
     { materialName: '物料B', materialCode: 'MAT-B', requiredQty: 50, pickedQty: 0 }
     ];
    workOrder.value = data;
  })

}

onMounted(() => {
  console.log(processStore.routes.length == 0);
  if(processStore.routes.length == 0){
    processStore.getRoutes()
  }
  getBomChildren('158024133');
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
