<template>
  <TabbarLayout>
    <view class="prod-trace-page">
      <NavBar title="生产追踪" />

      <!-- 工单不存在 -->
      <view v-if="!workOrder" class="error-state">
        <nut-empty description="工单不存在或加载失败" />
      </view>

      <!-- 工单内容 -->
      <view v-else class="content-wrapper">
        <!-- 工单基本信息卡片 -->
        <view class="info-card">
          <view class="card-header">
            <text class="card-title">工单信息</text>
            <view class="status-badge" :class="statusClass(workOrder.status)">
              {{ statusLabel(workOrder.status) }}
            </view>
          </view>
          <view class="info-grid">
            <view class="info-item"><text class="label">工单编号</text><text class="value highlight">{{ workOrder.code
            }}</text></view>
            <view class="info-item"><text class="label">工单名称</text><text class="value">{{ workOrder.name
            }}</text></view>
            <view class="info-item"><text class="label">产品名称</text><text class="value">{{ workOrder.productName
            }}</text></view>
            <view class="info-item"><text class="label">产品SAP</text><text class="value">{{ workOrder.productSap
            }}</text></view>
            <view class="info-item"><text class="label">计划数量</text><text class="value">{{ workOrder.plannedQty }}
                EA</text></view>
            <view class="info-item"><text class="label">已完成</text><text class="value">{{ workOrder.completedQty }}
                EA</text></view>
            <view class="info-item"><text class="label">整体进度</text><text class="value">{{ overallProgress }}%</text>
            </view>
            <view class="info-item"><text class="label">工单状态</text><text class="value">{{ statusLabel(workOrder.status)
            }}</text></view>
          </view>
          <view class="progress-section">
            <nut-progress :percentage="overallProgress" :show-text="false" stroke-color="blue" />
          </view>
        </view>

        <!-- 物料领料汇总 -->
        <view v-if="workOrder.materialDefinitions && workOrder.materialDefinitions.length" class="info-card">
          <view class="card-title">物料领料汇总</view>
          <view class="material-summary-list">
            <view v-for="(mat, idx) in workOrder.materialDefinitions" :key="idx" class="material-summary-item">
              <text class="mat-name">{{ mat.materialName }} ({{ mat.materialSap }})</text>
              <text class="mat-qty">标准：{{ mat.standardQty }} | 已领：{{ mat.pickedQty || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 工序时间线 -->
        <view class="timeline-wrapper">
          <view class="timeline-title">工序追溯链路</view>
          <view class="timeline-list">
            <view v-for="(op, index) in operations" :key="op.id" class="timeline-node">
              <!-- 左侧时间线图标 -->
              <view class="timeline-left">
                <view class="timeline-dot" :class="op.status === 'Completed' ? 'completed' : 'processing'"></view>
                <view v-if="index < operations.length - 1" class="timeline-line"></view>
              </view>
              <!-- 右侧内容 -->
              <view class="timeline-content">
                <!-- 工序头部 -->
                <view class="timeline-header" @click="toggleExpand(op.id)">
                  <view class="op-info">
                    <text class="op-index">#{{ index + 1 }}</text>
                    <text class="op-name">{{ op.operationCode }} - {{ op.operationName }}</text>
                    <view class="op-status" :class="opStatusClass(op.status)">{{ opStatusLabel(op.status) }}</view>
                  </view>
                  <view class="op-progress-summary">
                    <text>{{ op.completedQty }} / {{ op.plannedQty }} 件</text>
                    <text class="expand-icon">{{ expandedSet.has(op.id) ? '▲' : '▼' }}</text>
                  </view>
                </view>

                <!-- 批次列表（展开后显示） -->
                <view v-if="expandedSet.has(op.id)" class="timeline-detail">
                  <view v-if="op.productions && op.productions.length">
                    <view v-for="(prod) in op.productions" :key="prod.id" class="batch-card">
                      <view class="batch-header">
                        <text class="batch-no">📋 批次号：{{ prod.batchNo }}</text>
                        <text class="batch-status"
                          :class="prod.status === 'COMPLETED' ? 'batch-completed' : 'batch-processing'">
                          {{ prodStatusLabel(prod.status) }}
                        </text>
                        <text class="batch-time">{{ formatDate(prod.startAt) }} ~ {{ prod.endAt ? formatDate(prod.endAt)
                          : '进行中' }}</text>
                      </view>

                      <!-- 按物料展示参数（投料+参数组合） -->
                      <view class="batch-section">
                        <text class="section-label">📊 物料参数明细</text>
                        <view v-if="prod.inputs && prod.inputs.length" class="material-param-list">
                          <view v-for="(input, iIdx) in prod.inputs" :key="iIdx" class="material-param-item">
                            <view class="material-info">
                              <text class="mat-name">{{ input.materialName }} ({{ input.materialSap }})</text>
                              <text class="mat-qty">×{{ input.quantity }}</text>
                            </view>
                            <view class="param-values">
                              <!-- 查找该投料记录对应的参数 -->
                              <view v-if="getParamsForInput(prod, input.id).length">
                                <view v-for="(param, pIdx) in getParamsForInput(prod, input.id)" :key="pIdx"
                                  class="param-value-item">
                                  <text class="param-name">{{ param.parameterName }}</text>
                                  <text class="param-value" :class="{ 'abnormal': param.isAbnormal }">
                                    {{ param.value }} {{ param.unit || '' }}
                                    <text v-if="param.isAbnormal" class="abnormal-icon">⚠️</text>
                                  </text>
                                </view>
                              </view>
                              <text v-else class="no-param">(暂无参数)</text>
                            </view>
                          </view>
                        </view>
                        <view v-else class="empty-tip">该批次无投料记录</view>
                      </view>

                      <!-- 异常记录（保留） -->
                      <view v-if="prod.anomalies && prod.anomalies.length" class="batch-section">
                        <text class="section-label">⚠️ 异常记录</text>
                        <view class="batch-items">
                          <view v-for="(anom, aIdx) in prod.anomalies" :key="aIdx" class="batch-item anomaly-item">
                            <text>{{ anom.type }}</text>
                            <text>{{ anom.description }}</text>
                            <text v-if="anom.action">处理：{{ anom.action }}</text>
                          </view>
                        </view>
                      </view>

                      <!-- 产出记录 -->
                      <view v-if="prod.outputs && prod.outputs.length" class="batch-section">
                        <text class="section-label">🏭 产出</text>
                        <view class="batch-items">
                          <view v-for="(output, oIdx) in prod.outputs" :key="oIdx" class="batch-item">
                            <text>{{ output.materialName }} ({{ output.materialSap }})</text>
                            <text>×{{ output.quantity }}</text>
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                  <view v-else class="empty-tip">该工序暂无执行批次</view>
                </view>
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
import { getWithOperation } from '@/api/work-order/look-up';
import { getOperationStatusText, getProductionStatusText } from '@/util/statusText';
import type { WorkOrderWithOperationDetail, Batch, OperationParameter } from '@/types/work-order';

// ========== 路由参数 ==========
const instance = Taro.getCurrentInstance();
const workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || '';

// ========== 页面状态 ==========
const workOrder = ref<WorkOrderWithOperationDetail>();
const expandedSet = ref<Set<string>>(new Set());

// ========== 计算属性 ==========
const overallProgress = computed(() => {
  if (!workOrder.value) return 0;
  const total = workOrder.value.plannedQty;
  if (total === 0) return 0;
  return Math.round((workOrder.value.completedQty / total) * 100);
});

const operations = computed(() => workOrder.value?.operations || []);

// ========== 辅助函数 ==========
const statusLabel = (s: string) => ({ Pending: '待领料', Processing: '生产中', Completed: '已完成' }[s] || s);
const statusClass = (s: string) => ({ Pending: 'status-pending', Processing: 'status-progress', Completed: 'status-completed' }[s] || '');
const opStatusLabel = (s: string) => getOperationStatusText(s);
const prodStatusLabel = (s: string) => getProductionStatusText(s);
const opStatusClass = (s: string) => ({ Pending: 'op-pending', Processing: 'op-progress', Completed: 'op-completed' }[s] || '');

const formatDate = (dateStr: string) => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', { hour12: false });
};

// ========== 获取某个投料记录对应的参数列表 ==========
const getParamsForInput = (prod: Batch, inputId: string): OperationParameter[] => {
  if (!prod.parameters) return [];
  return prod.parameters.filter(param => param.materialInputId === inputId);
};

// ========== 展开/折叠 ==========
const toggleExpand = (opId: string) => {
  if (expandedSet.value.has(opId)) expandedSet.value.delete(opId);
  else expandedSet.value.add(opId);
};

// ========== 加载数据 ==========
const loadData = async () => {
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => Taro.navigateBack(), 1500);
    return;
  }

  const data = await getWithOperation(workOrderId);
  workOrder.value = data;
  // 默认展开第一个工序
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
// @import './prod-trace.scss';
</style>
