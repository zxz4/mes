<template>
  <TabbarLayout>
    <view class="overview-page">
      <NavBar :title="'工单工序概览'" :show-back="true" />

      <view v-show="!workOrder" class="error-state">
        <nut-empty description="工单不存在" />
        <nut-button type="primary" class="workbench-btn" @click="backToList">返回列表</nut-button>
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
          <view v-for="(op) in workOrder.operationDefinitions" :key="op.id" class="operation-card">
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
                  <text v-if="op.skipEnabled" class="op-skip-tag">可选</text>
                </view>
              </view>
            </view>
            <view class="op-card-right">
              <nut-button size="small" :type="actionButtonType(op.operationType)" class="enter-btn"
                @click="enterOperation(op)">
                作业
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
import { getWithOperation } from '@/api/work-order/look-up';
import type { WorkOrderWithOperationDetail, WorkOrderOperationDefinition } from '@/types/work-order';

// 获取当前路由参数
const instance = getCurrentInstance();
const workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || '';

const loading = ref(true);
const workOrder = ref<WorkOrderWithOperationDetail | null>(null);

onMounted(async () => {
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
.overview-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

.overview-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 80px;
  gap: 16px;
}

/* 工单信息卡片 */
.order-info-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.order-header {
  margin-bottom: 14px;
}

.order-code {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.code-text {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.status-tag {
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.status-pending {
  background: #f3f4f6;
  color: #6b7280;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-exception {
  background: #fef2f2;
  color: #dc2626;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.order-name {
  font-size: 15px;
  color: #555;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 14px;
}

.detail-row {
  display: flex;
  align-items: center;
}

.detail-label {
  font-size: 13px;
  color: #888;
  width: 72px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.detail-value.mono {
  font-family: monospace;
}

.detail-value.highlight {
  font-weight: 700;
  color: #2563eb;
}

/* 进度条 */
.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 13px;
  color: #555;
  font-weight: 600;
  white-space: nowrap;
}

/* 工序列表 */
.operation-section {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.operation-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.operation-card:active {
  background: #f3f4f6;
  border-radius: 12px;
  margin: 0 4px;
  padding-left: 8px;
  padding-right: 8px;
}

.operation-card:last-child {
  border-bottom: none;
}

@media (hover: hover) {
  .operation-card:hover {
    background: #f5f5f5;
  }
}

.op-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.op-sequence {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e8f0fe;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.op-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.op-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.op-code {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.op-name {
  font-size: 14px;
  color: #555;
}

.op-tags {
  display: flex;
  gap: 6px;
}

.op-type-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.type-produce {
  background: #e8f4fd;
  color: #2b7de9;
}

.type-process {
  background: #fef3e2;
  color: #e8942c;
}

.type-assembly {
  background: #e0f2fe;
  color: #0369a1;
}

.op-skip-tag {
  font-size: 10px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 10px;
}

.op-card-right {
  flex-shrink: 0;
}

.enter-btn {
  min-width: 56px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.bottom-safe-area {
  height: 20px;
}

.workbench-btn {
  border-radius: 10px;
  font-weight: 500;
}
</style>
