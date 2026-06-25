<template>
  <TabbarLayout>
    <view class="prod-operation-page">
      <NavBar title="生产执行" />


      <!-- 工单不存在 -->
      <view v-if="!workOrder" class="error-state">
        <nut-empty description="工单不存在或加载失败" />
        <nut-button type="primary" @click="backToList">返回工单列表</nut-button>
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
            <view class="info-item"><text class="label">工单编号</text><text class="value highlight">{{
              workOrder.workOrderNo }}</text></view>
            <view class="info-item"><text class="label">工单名称</text><text class="value">{{ workOrder.workOrderName
                }}</text></view>
            <view class="info-item"><text class="label">产品名称</text><text class="value">{{ workOrder.materialName
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

        <!-- 统计卡片（筛选） -->
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

        <!-- 工序列表 -->
        <view class="operation-list">
          <view v-for="(op, index) in filteredOperations" :key="op.id" class="operation-card" :class="{
            'status-Pending': op.status === 'Pending',
            'status-Processing': op.status === 'Processing',
            'status-Completed': op.status === 'Completed',
            'blocked': isBlocked(op)
          }">
            <!-- 卡片头部 -->
            <view class="op-header" @click="toggleExpand(op.id)">
              <view class="op-info">
                <text class="op-index">{{ index + 1 }}</text>
                <text class="op-name">{{ op.operationCode }} - {{ op.operationName }}</text>
                <view class="op-status" :class="opStatusClass(op.status)">{{ opStatusLabel(op.status) }}</view>
              </view>
              <view class="op-progress-summary">
                <text>{{ op.completedQty }} / {{ op.plannedQty }} 件</text>
                <text class="expand-icon">{{ expandedSet.has(op.id) ? '▲' : '▼' }}</text>
              </view>
            </view>

            <!-- 当前批次号 -->
            <view class="op-batch" v-if="op.currentProduction">
              <text class="batch-label">📋 当前批次：</text>
              <text class="batch-no">{{ op.currentProduction.batchNo }}</text>
              <text class="batch-status" :class="{ 'batch-completed': op.currentProduction.status === 'Completed' }">
                {{ op.currentProduction.status === 'Completed' ? '已完成' : '进行中' }}
              </text>
            </view>
            <view class="op-batch" v-else>
              <text class="batch-label">📋 当前批次：</text>
              <text class="batch-no" style="color: #ccc;">暂无批次</text>
            </view>

            <!-- 进度条 -->
            <view class="op-progress-bar-wrapper">
              <nut-progress :percentage="opPercent(op)" :show-text="false" stroke-color="blue" />
            </view>

            <!-- 操作按钮 -->
            <view class="op-actions">
              <template v-if="op.status !== 'Completed'">
                <nut-button v-if="isBlocked(op)" size="small" type="warning" plain disabled>
                  ⏳ 等待前置工序
                </nut-button>
                <template v-else>
                  <nut-button size="small" type="primary" plain :loading="inputLoading && inputTargetId === op.id"
                    @click="handleMaterialInput(op)">
                    📦 扫码投料
                  </nut-button>
                  <nut-button size="small" type="info" plain :disabled="!canInputParameter(op)"
                    @click="handleParameterInput(op)">
                    📝 录入参数
                  </nut-button>
                  <nut-button size="small" type="danger" plain @click="handleAnomalyReport(op)">
                    ⚠️ 上报异常
                  </nut-button>
                </template>
              </template>
              <template v-else>
                <nut-button size="small" plain disabled>✅ 已完成</nut-button>
              </template>
            </view>

            <!-- 展开详情（当前批次的前3条记录） -->
            <view v-if="expandedSet.has(op.id)" class="op-detail">
              <!-- 投料记录 -->
              <view class="detail-section">
                <view class="section-title">
                  <text>📦 投料记录</text>
                </view>
                <view v-if="!op.currentProduction || op.currentProduction.productionInputs?.length === 0"
                  class="empty-tip">暂无投料记录
                </view>
                <view v-else>
                  <view v-for="(input, idx) in op.currentProduction.productionInputs" :key="idx" class="detail-item">
                    <text class="item-label">{{ input.materialName }} ({{ input.materialSap }})</text>
                    <text class="item-value">数量: {{ input.quantity }}</text>
                  </view>
                </view>
              </view>

              <!-- 参数记录 -->
              <view class="detail-section">
                <view class="section-title">
                  <text>📝 参数记录</text>
                </view>
                <view v-if="!op.currentProduction || op.currentProduction.parameters?.length === 0" class="empty-tip">
                  暂无参数记录</view>
                <view v-else>
                  <view v-for="(param, idx) in op.currentProduction.parameters" :key="idx" class="detail-item">
                    <text class="item-label">{{ param.paramName }}</text>
                    <text class="item-value">{{ param.value }} {{ param.unit || '' }}</text>
                  </view>
                </view>
              </view>

              <!-- 异常记录 -->
              <view class="detail-section">
                <view class="section-title">
                  <text>⚠️ 异常记录</text>
                </view>
                <view v-if="!op.currentProduction || op.currentProduction.anomalies?.length === 0" class="empty-tip">
                  暂无异常记录</view>
                <view v-else>
                  <view v-for="(anomaly, idx) in op.currentProduction.anomalies" :key="idx" class="detail-item">
                    <text class="item-label">{{ anomaly.type }}</text>
                    <text class="item-value">{{ anomaly.description }}</text>
                  </view>
                </view>
              </view>

              <!-- 产出记录 -->
              <view class="detail-section">
                <view class="section-title">
                  <text>🏭 产出记录</text>
                </view>
                <view v-if="!op.currentProduction || op.currentProduction.outputs?.length === 0" class="empty-tip">
                  暂无产出记录</view>
                <view v-else>
                  <view v-for="(output, idx) in op.currentProduction.outputs" :key="idx" class="detail-item">
                    <text class="item-label">{{ output.materialName }}</text>
                    <text class="item-value">数量: {{ output.quantity }}</text>
                  </view>
                </view>
              </view>

              <!-- 查看全部 -->
              <view class="view-all-wrapper">
                <nut-button size="small" plain @click="goToDetail(op.id)">查看全部批次记录 →</nut-button>
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
import { getWorkOrderDetail } from '@/api/work-order/look-up';
import { feedMaterial } from '@/api/prod/index'
import type { WorkOrderDetail, WorkOrderOperation } from '@/types/work-order';

// ========== 路由参数 ==========
const instance = Taro.getCurrentInstance();
const workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || '';

// ========== 页面状态 ==========
const workOrder = ref<WorkOrderDetail>();

const filterStatus = ref<'all' | 'Pending' | 'Processing' | 'Completed'>('all');
const expandedSet = ref<Set<string>>(new Set());
const inputLoading = ref(false);
const inputTargetId = ref<string | null>(null);

// ========== 计算属性 ==========
const overallProgress = computed(() => {
  if (!operations.value || operations.value.length == 0) return 0;
  let total = 0, completed = 0;
  operations.value.forEach(op => {
    total += op.plannedQty;
    completed += op.completedQty;
  });
  return Math.round((completed / total) * 100);
});

const operations = computed(() => workOrder.value?.operations || []);

const filteredOperations = computed(() => {
  if (filterStatus.value === 'all') return operations.value;
  return operations.value.filter(op => op.status === filterStatus.value);
});

const pendingCount = computed(() => operations.value.filter(op => op.status === 'Pending').length);
const processingCount = computed(() => operations.value.filter(op => op.status === 'Processing').length);
const completedCount = computed(() => operations.value.filter(op => op.status === 'Completed').length);

// ========== 辅助函数 ==========
const statusLabel = (s: string) => ({ Pending: '待领料', Processing: '生产中', Completed: '已完成' }[s] || s);
const statusClass = (s: string) => ({ Pending: 'status-pending', Processing: 'status-progress', Completed: 'status-completed' }[s] || '');
const opStatusLabel = (s: string) => ({ Pending: '待处理', Processing: '进行中', Completed: '已完成' }[s] || s);
const opStatusClass = (s: string) => ({ Pending: 'op-pending', Processing: 'op-progress', Completed: 'op-completed' }[s] || '');
const opPercent = (op: WorkOrderOperation) => (op.plannedQty ? Math.round((op.completedQty / op.plannedQty) * 100) : 0);

// 判断前置工序是否完成（顺序依赖）
const isBlocked = (op: WorkOrderOperation): boolean => {
  // 找到当前索引
  if (op.currentProduction?.status == 'Feeding') return false;
  const currentIndex = operations.value.findIndex(o => o.id === op.id);
  if (currentIndex <= 0) return false;
  const currentBatchNo = op.currentProduction?.batchNo ?? '';
  const prevProd = operations.value[currentIndex - 1].productions?.find(i => {
    var result = (i.status == 'Completed' && i.batchNo > currentBatchNo);
    return result;
  });
  return prevProd?.status !== 'Completed';
};

// 是否可以录入参数（投料全部完成且当前批次未完成）
const canInputParameter = (op: WorkOrderOperation): boolean => {
  if (!op.currentProduction) return false;
  // 检查所有物料是否已投满
  const allInputsReady = op.materialDefinitions.every(def => {
    const consumed = def.consumedQty || 0;
    return consumed >= def.standardQty;
  });
  return allInputsReady && op.currentProduction.status !== 'Completed';
};

// ========== 展开/折叠 ==========
const toggleExpand = (opId: string) => {
  if (expandedSet.value.has(opId)) expandedSet.value.delete(opId);
  else expandedSet.value.add(opId);
};

// ========== 模拟扫码投料 ==========
const handleMaterialInput = async (op: WorkOrderOperation) => {
  // 检查是否有物料需要投料
  const incompleteDef = op.materialDefinitions.find(def => (def.consumedQty || 0) < def.standardQty);
  if (!incompleteDef && op.plannedQty == op.completedQty) {
    Taro.showToast({ title: '所有物料已投满。', icon: 'none' });
    return;
  }

  let batchNo: string = '';
  // 找到当前工序索引
  const currentIndex = operations.value.findIndex(o => o.id === op.id);
  const isFirstOperation = currentIndex === 0;
  if (op.currentProduction?.status == 'Feeding') {
    batchNo = op.currentProduction.batchNo;
  }
  else if (!isFirstOperation) {
    let prevProductions = operations.value[currentIndex - 1].productions;
    let prev = prevProductions?.find(i => (i.status == 'Completed' && i.batchNo > (op.currentProduction?.batchNo ?? '')));
    batchNo = prev?.batchNo ?? '';
  }

  // 模拟生成 SN/批次码（实际由扫码枪输入）
  // const mockCode = `SIM${Date.now().toString().slice(-6)}`;
  // 构造投料参数
  let params: {
    workOrderOperationId: string,
    materialSap: string,
    materialName: string,
    quantity: number,
    batchNo?: string
  } = {
    workOrderOperationId: op.id,
    materialSap: incompleteDef?.materialSap ?? '',
    materialName: incompleteDef?.materialName ?? '',
    quantity: 1,
  };

  if (batchNo) {
    params = {
      ...params,
      batchNo
    }
  }

  inputLoading.value = true;
  inputTargetId.value = op.id;
  try {
    const updatedOp = await feedMaterial(params);
    // 更新本地 operations 数据（用返回的新数据替换）
    operations.value[currentIndex] = updatedOp;
    if(currentIndex == operations.value.length - 1 && updatedOp.currentProduction?.status == 'Completed'){
      if(workOrder.value){
        workOrder.value.completedQty +=  1;
        if(workOrder.value.plannedQty == workOrder.value.completedQty){
          workOrder.value.status = 'Completed';
        }
      }
    }
    setTimeout(() => Taro.showToast({ title: `投料成功: ${incompleteDef?.materialName} ×1`, icon: 'success' }), 100)

  } finally {
    inputLoading.value = false;
    inputTargetId.value = null;
  }
};

// ========== 其他操作（占位） ==========
const handleParameterInput = (op: WorkOrderOperation) => {
  Taro.showToast({ title: `录入参数 - ${op.operationName}`, icon: 'none' });
};

const handleAnomalyReport = (op: WorkOrderOperation) => {
  Taro.showToast({ title: `上报异常 - ${op.operationName}`, icon: 'none' });
};

// ========== 跳转 ==========
const backToList = () => {
  Taro.navigateTo({ url: '/pages/work/order-list' });
};

const goToDetail = (opId: string) => {
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
@import './prod-operation.scss';
</style>
