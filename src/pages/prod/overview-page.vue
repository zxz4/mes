<template>
  <TabbarLayout>
    <view class="overview-page">
      <NavBar :title="'工单工序概览'" :show-back="true" />

      <view v-show="!workOrder" class="error-state">
        <nut-empty description="工单不存在" />
      </view>

      <view v-if="workOrder" class="overview-content">
        <!-- 工单基本信息卡片 -->
        <view class="order-info-card">
          <view class="order-header">
            <view class="order-code">
              <text class="code-text">{{ workOrder.code }}</text>
              <text class="status-tag" :class="statusClass(workOrder.status)">
                {{ statusLabel(workOrder.status) }}
              </text>
            </view>
            <text class="order-name">{{ workOrder.name }}</text>
          </view>

          <view class="order-details">
            <view class="detail-row">
              <text class="detail-label">产品名称</text>
              <text class="detail-value">{{ workOrder.productName }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">产品SAP</text>
              <text class="detail-value mono">{{ workOrder.productSap }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">工单编号</text>
              <text class="detail-value mono">{{ workOrder.code }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">计划数量</text>
              <text class="detail-value">{{ workOrder.plannedQty }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">完成数量</text>
              <text class="detail-value highlight">{{ workOrder.completedQty }}</text>
            </view>
          </view>

          <!-- 进度条 -->
          <view class="progress-section">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
            </view>
            <text class="progress-text">{{ progressPercent }}% 完成</text>
          </view>
        </view>

        <!-- 工序列表 -->
        <view class="operation-section">
          <view class="section-title">📋 工序列表</view>
          <view v-for="(op) in workOrder.operationDefinitions" :key="op.id" class="operation-card"
            @click="enterOperation(op)">
            <view class="op-card-left">
              <view class="op-sequence">{{ op.sequence }}</view>
              <view class="op-info">
                <view class="op-title-row">
                  <text class="op-code">{{ op.operationCode }}</text>
                  <text class="op-name">{{ op.operationName }}</text>
                </view>
                <view class="op-tags">
                  <text class="op-type-tag" :class="typeTagClass(op.operationType)">
                    {{ typeLabel(op.operationType) }}
                  </text>
                  <text v-show="op.skipEnabled" class="op-skip-tag">可选</text>
                </view>
              </view>
            </view>
            <view class="op-card-right">
              <nut-button size="small" :type="actionButtonType(op.operationType)" class="record-btn"
                @click.stop="enterRecord(op.id)">
                详情
              </nut-button>
            </view>
          </view>
        </view>

        <view class="bottom-safe-area"></view>
      </view>
    </view>
  </TabbarLayout>
</template>

<script lang="ts" setup name="WorkOrderOverview">
import { ref, computed, onMounted } from 'vue';
import { navigateTo, getCurrentInstance, showToast } from '@tarojs/taro';
import { getWithOperation } from '../../apis/work-order/look-up';
import type { WorkOrderWithOperationDetail, WorkOrderOperationDefinition } from '@/types/work-order';

// 获取当前路由参数

const loading = ref(true);
const workOrder = ref<WorkOrderWithOperationDetail | null>(null);

onMounted(async () => {
  const instance = getCurrentInstance();
  const workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || '';

  if (!workOrderId) {
    showToast({ title: '工单参数错误', icon: 'none' });
    setTimeout(() => backToList(), 1500);
    return;
  }
  try {
    workOrder.value = await getWithOperation(workOrderId);
  } catch (error) {
    showToast({ title: '获取工单失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
});

const progressPercent = computed(() => {
  if (!workOrder.value || workOrder.value.plannedQty === 0) return 0;
  const pct = (workOrder.value.completedQty / workOrder.value.plannedQty) * 100;
  return Math.min(Math.round(pct), 100);
});

const backToList = () => {
  navigateTo({ url: '/pages/work/order-list' });
};

// 进入工序作业
const enterOperation = (operation: WorkOrderOperationDefinition) => {
  const baseUrl = '/pages/prod/operate-';
  let pageName = '';
  switch (operation.operationType) {
    case 'Produce': pageName = 'produce'; break;
    case 'Process': pageName = 'process'; break;
    case 'Assembly': pageName = 'assembly'; break;
    default: pageName = 'produce'; break;
  }
  navigateTo({
    url: `${baseUrl}${pageName}?operationId=${operation.id}&workOrderId=${workOrder.value!.id}`,
  });
};

const enterRecord = (id: string) => {
  navigateTo({
    url: `/pages/prod/record-list?operationId=${id}`,
  });
}

// 辅助方法
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    'Pending': '暂停',
    'Processing': '工作中',
    'Exception': '异常待处理',
    'Completed': '已完成',
  };
  return map[status] || status;
};

const statusClass = (status: string) => {
  if (status === 'Processing') return 'status-processing';
  if (status === 'Exception') return 'status-exception';
  if (status === 'Completed') return 'status-completed';
  return 'status-pending';
};

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    'Produce': '产出',
    'Process': '加工',
    'Assembly': '装配',
  };
  return map[type] || type;
};

const typeTagClass = (type: string) => {
  if (type === 'Produce') return 'type-produce';
  if (type === 'Process') return 'type-process';
  if (type === 'Assembly') return 'type-assembly';
  return '';
};

const actionButtonType = (type: string): 'success' | 'warning' | 'primary' | 'default' => {
  if (type === 'Produce') return 'primary';
  if (type === 'Process') return 'warning';
  if (type === 'Assembly') return 'success';
  return 'default';
};
</script>


<style scoped>
@import './overview-page.css';
</style>
