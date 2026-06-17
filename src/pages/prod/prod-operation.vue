<template>
  <TabbarLayout>
    <view class="prod-operation-page">
      <NavBar title="生产执行" />

      <!-- 工单不存在 -->
      <view v-if="!workOrder" class="error-state">
        <nut-empty description="工单不存在或加载失败" />
      </view>

      <!-- 工单内容 -->
      <view v-else class="content-wrapper">
        <!-- 1. 工单基本信息卡片 -->
        <view class="info-card">
          <view class="card-header">
            <text class="card-title">工单信息</text>
            <view class="status-badge" :class="statusClass(workOrder.status)">
              {{ statusLabel(workOrder.status) }}
            </view>
          </view>
          <view class="info-grid">
            <view class="info-item"><text class="label">工单编号</text><text class="value highlight">{{
              workOrder.workOrderNo }}</text></view>
            <view class="info-item"><text class="label">工单名称</text><text class="value">{{ workOrder.workOrderName
                }}</text></view>
            <view class="info-item"><text class="label">产品名称</text><text class="value">{{ workOrder.productName
                }}</text></view>
            <view class="info-item"><text class="label">计划数量</text><text class="value">{{ workOrder.plannedQty }}
                EA</text></view>
            <view class="info-item"><text class="label">已完成</text><text class="value">{{ workOrder.completedQty }}
                EA</text></view>
            <view class="info-item"><text class="label">整体进度</text><text class="value">{{ overallProgress }}%</text>
            </view>
          </view>
          <view class="progress-section">
            <nut-progress :percentage="overallProgress" :show-text="false" stroke-color="blue" />
          </view>
        </view>

        <!-- 2. 统计卡片（筛选） -->
        <scroll-view scroll-x class="stats-row">
          <view class="stat-card" :class="{ 'active-filter': filterStatus === 'all' }" @click="filterStatus = 'all'">
            <view class="stat-number blue">{{ operations.length }}</view>
            <view class="stat-label">全部工序</view>
          </view>
          <view class="stat-card" :class="{ 'active-filter': filterStatus === 'Pending' }"
            @click="filterStatus = 'Pending'">
            <view class="stat-number blue">{{ pendingCount }}</view>
            <view class="stat-label">待处理</view>
          </view>
          <view class="stat-card" :class="{ 'active-filter': filterStatus === 'Processing' }"
            @click="filterStatus = 'Processing'">
            <view class="stat-number orange">{{ processingCount }}</view>
            <view class="stat-label">进行中</view>
          </view>
          <view class="stat-card" :class="{ 'active-filter': filterStatus === 'Completed' }"
            @click="filterStatus = 'Completed'">
            <view class="stat-number green">{{ completedCount }}</view>
            <view class="stat-label">已完成</view>
          </view>
        </scroll-view>

        <!-- 3. 工序列表 -->
        <view class="operation-list">
          <view v-for="op in filteredOperations" :key="op.id" class="operation-card">
            <!-- 卡片头部 -->
            <view class="op-header" @click="toggleExpand(op.id)">
              <view class="op-info">
                <text class="op-name">{{ op.operationCode }} - {{ op.operationName }}</text>
                <view class="op-status" :class="opStatusClass(op.status)">{{ opStatusLabel(op.status) }}</view>
              </view>
              <view class="op-progress-summary">
                <text>{{ op.completedQty }} / {{ op.planQty }} 件</text>
                <text class="expand-icon">{{ expandedSet.has(op.id) ? '▲' : '▼' }}</text>
              </view>
            </view>
            <!-- 进度条 -->
            <view class="op-progress-bar-wrapper">
              <nut-progress :percentage="opPercent(op)" :show-text="false" stroke-color="blue" />
            </view>
            <!-- 操作按钮（仅展示，无功能） -->
            <view class="op-actions">
              <nut-button size="small" type="primary" plain>扫码投料</nut-button>
              <nut-button size="small" type="info" plain>录入参数</nut-button>
              <nut-button size="small" type="danger" plain>上报异常</nut-button>
            </view>

            <!-- 展开详情 -->
            <view v-if="expandedSet.has(op.id)" class="op-detail">
              <!-- 投料信息 -->
              <view class="detail-section">
                <view class="section-title">
                  <text>📦 投料信息</text>
                  <text class="section-count">最新 {{ latestMaterialInputs(op).length }} 条</text>
                </view>
                <view v-if="latestMaterialInputs(op).length === 0" class="empty-tip">暂无投料记录</view>
                <view v-else>
                  <view v-for="(input, idx) in latestMaterialInputs(op)" :key="idx" class="detail-item">
                    <text class="item-label">{{ input.materialName }} ({{ input.materialSap }})</text>
                    <text class="item-value">数量: {{ input.quantity }}</text>
                  </view>
                </view>
                <view class="view-all" @click="goToDetail(op.id)">查看全部 →</view>
              </view>

              <!-- 参数信息（预留） -->
              <view class="detail-section">
                <view class="section-title">
                  <text>📝 参数记录</text>
                  <text class="section-count">最新 {{ latestParameters(op).length }} 条</text>
                </view>
                <view v-if="latestParameters(op).length === 0" class="empty-tip">暂无参数记录</view>
                <view v-else>
                  <view v-for="(param, idx) in latestParameters(op)" :key="idx" class="detail-item">
                    <text class="item-label">{{ param.paramName }}</text>
                    <text class="item-value">{{ param.value }} {{ param.unit }}</text>
                  </view>
                </view>
                <view class="view-all" @click="goToDetail(op.id)">查看全部 →</view>
              </view>

              <!-- 异常信息（预留） -->
              <view class="detail-section">
                <view class="section-title">
                  <text>⚠️ 异常记录</text>
                  <text class="section-count">最新 {{ latestAnomalies(op).length }} 条</text>
                </view>
                <view v-if="latestAnomalies(op).length === 0" class="empty-tip">暂无异常记录</view>
                <view v-else>
                  <view v-for="(anomaly, idx) in latestAnomalies(op)" :key="idx" class="detail-item">
                    <text class="item-label">{{ anomaly.type }}</text>
                    <text class="item-value">{{ anomaly.description }}</text>
                  </view>
                </view>
                <view class="view-all" @click="goToDetail(op.id)">查看全部 →</view>
              </view>

              <!-- 产出信息（预留） -->
              <view class="detail-section">
                <view class="section-title">
                  <text>🏭 产出记录</text>
                  <text class="section-count">最新 {{ latestOutputs(op).length }} 条</text>
                </view>
                <view v-if="latestOutputs(op).length === 0" class="empty-tip">暂无产出记录</view>
                <view v-else>
                  <view v-for="(output, idx) in latestOutputs(op)" :key="idx" class="detail-item">
                    <text class="item-label">{{ output.materialName }}</text>
                    <text class="item-value">数量: {{ output.quantity }}</text>
                  </view>
                </view>
                <view class="view-all" @click="goToDetail(op.id)">查看全部 →</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Taro from '@tarojs/taro';
import NavBar from '@/components/NavBar.vue';
import TabbarLayout from '@/components/TabbarLayout.vue';
import { useTabbarStore } from '@/store/tabbar';
import { getWorkOrderDetail } from '@/api/work-order';
import type { WorkOrderDetail, WorkOrderOperation, MaterialInputRequirement, MaterialInput } from '@/types/work-order';

// ========== 路由参数 ==========
const instance = Taro.getCurrentInstance();
const workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || '3a21c6ab-75cd-efbb-fcc9-2d887c279a33';

// ========== 页面状态 ==========
const workOrder = ref<WorkOrderDetail | null>(null);
const filterStatus = ref<'all' | 'Pending' | 'Processing' | 'Completed'>('all');
const expandedSet = ref<Set<string>>(new Set());

// ========== 计算属性 ==========
// 整体进度
const overallProgress = computed(() => {
  if (!workOrder.value) return 0;
  const total = workOrder.value.plannedQty;
  if (total === 0) return 0;
  return Math.round((workOrder.value.completedQty / total) * 100);
});

// 工序列表
const operations = computed(() => workOrder.value?.operations || []);

// 筛选后的工序
const filteredOperations = computed(() => {
  if (filterStatus.value === 'all') return operations.value;
  return operations.value.filter(op => op.status === filterStatus.value);
});

// 统计数量
const pendingCount = computed(() => operations.value.filter(op => op.status === 'Pending').length);
const processingCount = computed(() => operations.value.filter(op => op.status === 'Processing').length);
const completedCount = computed(() => operations.value.filter(op => op.status === 'Completed').length);

// 辅助函数
const statusLabel = (s: string) => ({ Pending: '待领料', Processing: '生产中', Completed: '已完成' }[s] || s);
const statusClass = (s: string) => ({ Pending: 'status-pending', Processing: 'status-progress', Completed: 'status-completed' }[s] || '');
const opStatusLabel = (s: string) => ({ Pending: '待处理', Processing: '进行中', Completed: '已完成' }[s] || s);
const opStatusClass = (s: string) => ({ Pending: 'op-pending', Processing: 'op-progress', Completed: 'op-completed' }[s] || '');
const opPercent = (op: WorkOrderOperation) => (op.planQty ? Math.round((op.completedQty / op.planQty) * 100) : 0);

// 展开/折叠切换
const toggleExpand = (opId: string) => {
  if (expandedSet.value.has(opId)) expandedSet.value.delete(opId);
  else expandedSet.value.add(opId);
};

// ========== 获取最新数据（最多3条） ==========
// 投料记录：从 materialInputRequirements 中提取所有 materialInputs 并合并，按时间倒序取最新3条
const latestMaterialInputs = (op: WorkOrderOperation): MaterialInput[] => {
  const allInputs: MaterialInput[] = [];
  op.materialInputRequirements?.forEach(req => {

  });
  // 按 id 或时间排序（假设 id 是递增的，或可添加时间字段）
  allInputs.sort((a, b) => (a.id > b.id ? -1 : 1));
  return allInputs.slice(0, 3);
};

// 参数记录（模拟数据，待后端提供）
const latestParameters = (op: WorkOrderOperation): any[] => {
  // 模拟数据，实际应从 op.parameters 获取
  return [
    { paramName: '电压', value: '3.25', unit: 'V' },
    { paramName: '内阻', value: '0.08', unit: 'mΩ' }
  ].slice(0, 3);
};

// 异常记录（模拟）
const latestAnomalies = (op: WorkOrderOperation): any[] => {
  // 模拟数据，实际应从 op.anomalies 获取
  return [
    { type: '参数超标', description: '电压超出范围' }
  ].slice(0, 3);
};

// 产出记录（模拟）
const latestOutputs = (op: WorkOrderOperation): any[] => {
  // 模拟数据，实际应从 op.outputs 获取
  return [
    { materialName: '电芯半成品', quantity: 10 }
  ].slice(0, 3);
};

// ========== 跳转 ==========
const backToList = () => {
  Taro.navigateTo({ url: '/pages/work/order-list' });
};

const goToDetail = (opId: string) => {
  // 跳转到独立详情页（后续实现）
  Taro.navigateTo({ url: `/pages/work/operation-detail?workOrderId=${workOrderId}&operationId=${opId}` });
};

// ========== 加载数据 ==========
const loadData = async () => {
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => backToList(), 1500);
    return;
  }

  const data = await getWorkOrderDetail(workOrderId);
  workOrder.value = data;
  // 默认展开第一个工序（可选）
  if (data.operations && data.operations.length > 0) {
    expandedSet.value.add(data.operations[0].id);
  }

};

// ========== 生命周期 ==========
onMounted(() => {
  useTabbarStore().setSelected(1);
  loadData();
});
</script>

<style lang="scss" scoped>
@import './prod-operation.scss';

/* 新增样式 */
.content-wrapper {
  padding: 12px 16px;
}

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

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 12px;
    margin-bottom: 12px;
  }

  .info-item {
    display: flex;
    flex-direction: column;

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
    margin-top: 4px;
  }
}

/* 统计卡片 */
.stats-row {
  display: flex;
  gap: 10px;
  padding: 8px 0 12px;
  overflow-x: auto;
  white-space: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }
}

.stat-card {
  flex: 1;
  min-width: 70px;
  background: $tp-white;
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
  box-shadow: $tp-shadow-sm;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: 0.2s;

  &:active {
    transform: scale(0.96);
  }

  &.active-filter {
    border-color: $tp-primary;
    background: rgba($tp-primary, 0.08);
  }

  .stat-number {
    font-size: 22px;
    font-weight: 800;

    &.blue {
      color: $tp-primary;
    }

    &.orange {
      color: #fa8c16;
    }

    &.green {
      color: $tp-success;
    }
  }

  .stat-label {
    font-size: 11px;
    color: $tp-text;
    margin-top: 2px;
  }
}

/* 工序列表 */
.operation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operation-card {
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 12px;
  box-shadow: $tp-shadow-sm;
  border-left: 4px solid transparent;

  &.status-Pending {
    border-left-color: $tp-primary;
  }

  &.status-Processing {
    border-left-color: #fa8c16;
  }

  &.status-Completed {
    border-left-color: $tp-success;
  }

  .op-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    .op-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .op-name {
        font-size: 14px;
        font-weight: 600;
      }

      .op-status {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;

        &.op-pending {
          background: rgba($tp-primary, 0.1);
          color: $tp-primary;
        }

        &.op-progress {
          background: rgba(#fa8c16, 0.1);
          color: #fa8c16;
        }

        &.op-completed {
          background: rgba($tp-success, 0.1);
          color: $tp-success;
        }
      }
    }

    .op-progress-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: $tp-text;

      .expand-icon {
        font-size: 12px;
        color: $tp-text;
      }
    }
  }

  .op-progress-bar-wrapper {
    margin: 8px 0;
  }

  .op-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .op-detail {
    margin-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    padding-top: 12px;

    .detail-section {
      margin-bottom: 12px;

      .section-title {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        color: $tp-title;
        margin-bottom: 6px;

        .section-count {
          font-weight: 400;
          color: $tp-text;
          font-size: 11px;
        }
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        font-size: 12px;

        .item-label {
          color: $tp-text;
        }

        .item-value {
          font-weight: 500;
        }
      }

      .empty-tip {
        font-size: 12px;
        color: $tp-text;
        padding: 8px 0;
      }

      .view-all {
        text-align: right;
        font-size: 12px;
        color: $tp-primary;
        cursor: pointer;
        margin-top: 4px;
      }
    }
  }
}
</style>
