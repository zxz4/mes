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
            'status-pending': op.status === 'Pending',
            'status-processing': op.status === 'Processing',
            'status-completed': op.status === 'Completed',
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
              <text class="batch-status" :class="{ 'batch-completed': op.currentProduction.status === 'COMPLETED' }">
                {{ prodStatusLabel(op.currentProduction.status) }}
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
                <nut-button size="small" type="primary" plain :loading="inputLoading && inputTargetId === op.id"
                  :disabled="isMaterialInputDisabled(op)" @click="openMaterialInputDialog(op)">
                  📦 扫码投料
                </nut-button>
                <nut-button size="small" type="warning" plain :disabled="!canInputParameter(op)"
                  @click="handleParameterInput(op)">
                  📝 录入参数
                </nut-button>
                <nut-button size="small" type="danger" plain @click="handleAnomalyReport(op)">
                  ⚠️ 上报异常
                </nut-button>
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
                <view v-if="!op.currentProduction || op.currentProduction.inputs?.length === 0" class="empty-tip">暂无投料记录
                </view>
                <view v-else>
                  <view v-for="(input, idx) in op.currentProduction.inputs" :key="idx" class="detail-item">
                    <text class="item-label">{{ input.materialName }}-{{ input.lotCode }} ({{ input.materialSap
                    }})</text>
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
                  <view v-for="(param) in op.currentProduction.parameters" :key="param.id" class="detail-item">
                    <text class="item-label">{{ param.parameterName }}</text>
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
              <!-- <view class="detail-section">
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
              </view> -->

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
  <!-- ========== 参数录入弹窗 ========== -->
  <nut-popup v-model:visible="showParamDialog" position="bottom" round :style="{ height: '100%' }" closeable>
    <view class="param-dialog">
      <view class="dialog-header">
        <text class="dialog-title">📝 录入参数 - {{ currentParamOp?.operationName }}</text>
        <text class="dialog-batch" v-if="currentParamOp?.currentProduction">
          批次号：{{ currentParamOp.currentProduction.batchNo }}
        </text>
      </view>
      <scroll-view scroll-y class="dialog-body">
        <!-- 检查是否有投料记录 -->
        <template
          v-if="currentParamOp && currentParamOp.currentProduction && currentParamOp.currentProduction.inputs && currentParamOp.currentProduction.inputs.length">
          <!-- 遍历每个投料记录（物料实例） -->
          <view v-for="(input, idx) in currentParamOp.currentProduction.inputs" :key="input.id" class="param-group">
            <view class="group-header">
              <text class="group-title">物料 #{{ idx + 1 }}</text>
              <text class="group-material">{{ input.materialName }} ({{ input.materialSap }})</text>
              <text class="group-lot">批次/SN: {{ input.lotCode }}</text>
            </view>
            <view class="group-fields">
              <view v-for="def in currentParamOp.parameterDefinitions" :key="def.id" class="param-field">
                <view class="field-label-wrapper">
                  <text class="field-label">{{ def.parameterName }}</text>
                  <text v-if="def.minValue && def.maxValue" class="field-range">
                    ({{ def.minValue ?? '无' }} ~ {{ def.maxValue ?? '无' }}{{ def.unit ? ' ' + def.unit : '' }})
                  </text>
                  <text v-else-if="def.minValue" class="field-range">
                    ( 大于 {{ def.minValue }} {{ def.unit ? ' ' + def.unit : '' }})
                  </text>
                  <text v-else-if="def.maxValue" class="field-range">
                    ( 小于 {{ def.maxValue }} {{ def.unit ? ' ' + def.unit : '' }})
                  </text>

                </view>
                <view class="field-input-wrapper" :class="{ 'error': fieldErrors[input.id]?.[def.parameterName] }">
                  <nut-input :type="def.parameterType === 'digit' ? 'digit' : 'text'"
                    v-model="paramValues[input.id][def.parameterName]" :placeholder="'请输入' + def.parameterName"
                    class="field-input" @blur="() => validateSingleParam(def, input.id)">
                    <template #right>
                      <text v-if="def.unit" class="field-unit">{{ def.unit }}</text>
                    </template>
                  </nut-input>
                </view>
                <text v-if="fieldErrors[input.id]?.[def.parameterName]" class="field-error">
                  {{ fieldErrors[input.id][def.parameterName] }}
                </text>
              </view>
            </view>
          </view>
        </template>
        <view v-else class="empty-param">当前批次无投料记录，无法录入参数</view>
      </scroll-view>
      <view class="dialog-footer">
        <nut-button type="primary" block :loading="paramSubmitting" @click="submitParameters">提交参数</nut-button>
        <nut-button block plain @click="closeParamDialog">取消</nut-button>
      </view>
    </view>
  </nut-popup>

  <!-- 投料弹窗（统一支持SN/批次） -->
  <nut-popup v-model:visible="showMaterialInputDialog" position="bottom" round :style="{ height: '100%' }" closeable>
    <view class="material-input-dialog">
      <view class="dialog-header">
        <text class="dialog-title">📦 扫码投料 - {{ materialInputTarget?.operationName }}</text>
      </view>
      <scroll-view scroll-y class="dialog-body">
        <!-- 投料物料列表 -->
        <view v-for="(def, idx) in pendingMaterialDefs" :key="idx" class="material-input-item">
          <view class="material-info">
            <text class="mat-name">{{ def.materialName }}</text>
            <text class="mat-sap">{{ def.materialSap }}</text>
            <view class="mat-badges">
              <text v-if="def.isSNManaged" class="badge-sn">SN</text>
              <text v-else class="badge-lot">批次</text>
            </view>
            <text class="mat-status" :class="getDefStatusClass(def)">
              {{ getDefStatusText(def) }}
            </text>
          </view>

          <!-- SN模式：仅输入SN码 -->
          <template v-if="def.isSNManaged">
            <view class="input-row">
              <nut-input v-model="snInputValues[def.id]" placeholder="扫描/输入 SN 码" @confirm="() => submitSnInput(def)" />
              <nut-button size="small" type="primary" @click="() => submitSnInput(def)">投料</nut-button>
            </view>
          </template>
          <template v-else>
            <view class="input-row">
              <nut-input v-model="lotInputValues[def.id].lotCode" placeholder="扫描/输入 批次号"
                @confirm="() => submitLotInput(def)" />
              <nut-button size="small" type="primary" @click="() => submitLotInput(def)">投料</nut-button>
            </view>
          </template>

          <!-- 已投料记录（标签形式） -->
          <view v-if="getConsumedRecords(def).length > 0" class="consumed-records">
            <text class="record-label">已投料：</text>
            <view class="record-tags">
              <view v-for="(record, ri) in getConsumedRecords(def)" :key="ri" class="record-tag">
                <text class="tag-text">{{ record.lotCode }}</text>
                <text class="tag-delete" @click="() => removeConsumedRecord(def, record)">✕</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="pendingMaterialDefs.length === 0" class="empty-tip">
          所有物料已投满 ✅
        </view>
      </scroll-view>
      <view class="dialog-footer">
        <nut-button block plain @click="closeMaterialInputDialog">关闭</nut-button>
      </view>
    </view>
  </nut-popup>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import Taro from '@tarojs/taro';
import NavBar from '@/components/NavBar.vue';
import TabbarLayout from '@/components/TabbarLayout.vue';
import { useTabbarStore } from '@/store/tabbar';
import { getWorkOrderDetail } from '@/api/work-order/look-up';
import { feedMaterial, recordParameters } from '@/api/prod/index'
import type { WorkOrderDetail, WorkOrderOperationDefinition, ParameterDefinition } from '@/types/work-order';
import { getOperationStatusText, getProductionStatusText } from '@/util/statusText'

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
const opStatusLabel = (s: string) => { return getOperationStatusText(s); };
const prodStatusLabel = (s: string) => { return getProductionStatusText(s); };

const opStatusClass = (s: string) => ({ Pending: 'op-pending', Processing: 'op-progress', Completed: 'op-completed' }[s] || '');
const opPercent = (op: WorkOrderOperationDefinition) => (op.plannedQty ? Math.round((op.completedQty / op.plannedQty) * 100) : 0);

// 判断投料按钮是否禁用
const isMaterialInputDisabled = (op: WorkOrderOperationDefinition): boolean => {
  // const currentIndex = operations.value.findIndex(o => o.id === op.id);
  // if (currentIndex <= 0) return false; // 第一个工序无需等待前置
  // // 如果当前批次不存在，则需要检查前置工序是否有已完成批次
  // if (!op.currentProduction) {
  //   const prevOp = operations.value[currentIndex - 1];
  //   const hasCompletedBatch = prevOp.productions?.some(p => p.status === 'COMPLETED') ?? false;
  //   return !hasCompletedBatch; // 若前置无完成批次则禁用投料
  // }
  // // 当前批次存在：检查所有物料是否已投满
  // const allMaterialsFulfilled = op.materialDefinitions.every(def => (def.consumedQty || 0) >= def.standardQty);
  // return allMaterialsFulfilled;
  // 找到当前索引
  if (op.currentProduction?.status == 'FEEDING') return false;
  const currentIndex = operations.value.findIndex(o => o.id === op.id);
  if (currentIndex <= 0) return false;
  if (op.currentProduction?.status == 'RECORDING') return true;

  const currentBatchNo = op.currentProduction?.batchNo ?? '';
  const prevProd = operations.value[currentIndex - 1].productions?.find(i => {
    var result = (i.status == 'COMPLETED' && i.batchNo > currentBatchNo);
    return result;
  });
  return prevProd?.status !== 'COMPLETED';
};

// 是否可以录入参数（投料全部完成且当前批次未完成）
const canInputParameter = (op: WorkOrderOperationDefinition): boolean => {
  if (!op.isParameterRecordEnabled) return false;
  if (op.currentProduction?.status !== 'RECORDING') return false;
  // 检查所有物料是否已投满
  return true;
};

// ========== 展开/折叠 ==========
const toggleExpand = (opId: string) => {
  if (expandedSet.value.has(opId)) expandedSet.value.delete(opId);
  else expandedSet.value.add(opId);
};

// ========== 参数录入弹窗逻辑 ==========

// 参数录入弹窗状态
const showParamDialog = ref(false);
const currentParamOp = ref<WorkOrderOperationDefinition | null>(null);
// 改为二维对象：paramValues[inputId][parameterName] = value
const paramValues = ref<Record<string, Record<string, string>>>({});
const fieldErrors = ref<Record<string, Record<string, string>>>({});
const paramSubmitting = ref(false);

// 打开参数录入弹窗
const handleParameterInput = (op: WorkOrderOperationDefinition) => {
  console.log(op);
  if (!op.isParameterRecordEnabled) {
    Taro.showToast({ title: '该工序未开启参数记录', icon: 'none' });
    return;
  }
  if (op.currentProduction?.status !== 'RECORDING') {
    Taro.showToast({ title: '当前批次状态不支持录入参数', icon: 'none' });
    return;
  }
  if (!op.parameterDefinitions || op.parameterDefinitions.length === 0) {
    Taro.showToast({ title: '该工序暂无参数定义', icon: 'none' });
    return;
  }
  const inputs = op.currentProduction?.inputs || [];
  if (inputs.length === 0) {
    Taro.showToast({ title: '当前批次无投料记录，无法录入参数', icon: 'none' });
    return;
  }
  currentParamOp.value = op;
  // 初始化参数值和错误映射
  paramValues.value = {};
  fieldErrors.value = {};
  inputs.forEach(input => {
    paramValues.value[input.id] = {};
    fieldErrors.value[input.id] = {};
    op.parameterDefinitions.forEach(def => {
      paramValues.value[input.id][def.parameterName] = '';
    });
  });
  nextTick(() => {
    showParamDialog.value = true;
  });

};

// 关闭弹窗
const closeParamDialog = () => {
  showParamDialog.value = false;
  currentParamOp.value = null;
  paramValues.value = {};
  fieldErrors.value = {};
};

// 单项校验（仅标记错误，不阻断）
const validateSingleParam = (def: any, inputId: string) => {
  const value = paramValues.value[inputId]?.[def.parameterName];
  const error = validateParamValue(def, value);
  if (error) {
    if (!fieldErrors.value[inputId]) fieldErrors.value[inputId] = {};
    fieldErrors.value[inputId][def.parameterName] = error;
  } else {
    if (fieldErrors.value[inputId]) {
      delete fieldErrors.value[inputId][def.parameterName];
    }
  }
};

// 校验参数值（返回错误信息或 null）
const validateParamValue = (def: any, value: any): string | null => {
  if (value === undefined || value === null || value === '') {
    return null; // 空值不校验
  }
  if (!def.minValue && !def.maxValue) {
    return null; // 无范围限制
  }

  if (def.parameterType === 'digit') {
    const num = Number(value);
    if (isNaN(num)) return '请输入有效数字';
    if (def.minValue !== undefined && num < def.minValue) {
      return `不能小于 ${def.minValue}`;
    }
    if (def.maxValue !== undefined && num > def.maxValue) {
      return `不能大于 ${def.maxValue}`;
    }
  }
  return null;
};

// 提交参数
const submitParameters = async () => {
  if (!currentParamOp.value || !currentParamOp.value.currentProduction) {
    Taro.showToast({ title: '当前批次不存在', icon: 'none' });
    return;
  }
  const inputs = currentParamOp.value.currentProduction.inputs || [];
  if (inputs.length === 0) {
    Taro.showToast({ title: '无投料记录', icon: 'none' });
    return;
  }

  // 收集所有错误，用于全局提示
  let hasError = false;
  const errorMessages: string[] = [];
  const allParams: Array<{
    materialInputId: string;
    parameters: Record<string, string>;
  }> = [];

  inputs.forEach(input => {
    const inputId = input.id;
    const paramObj: Record<string, string> = {};
    currentParamOp.value!.parameterDefinitions.forEach(def => {
      const value = paramValues.value[inputId]?.[def.parameterName] || '';
      paramObj[def.parameterName] = value;
      // 校验每个值
      const error = validateParamValue(def, value);
      if (error) {
        hasError = true;
        errorMessages.push(`物料 ${input.materialName}: ${def.parameterName} ${error}`);
      }
    });
    allParams.push({
      materialInputId: inputId,
      parameters: paramObj
    });
  });

  // 若有错误，弹出确认框
  if (hasError) {
    const res = await Taro.showModal({
      title: '参数异常',
      content: `以下参数超出标准范围，确认继续提交？\n${errorMessages.join('\n')}`,
      confirmText: '继续提交',
      cancelText: '取消'
    });
    if (!res.confirm) return;
  }

  paramSubmitting.value = true;
  try {
    const updateOp = await recordParameters(currentParamOp.value.id, allParams);
    const idx = operations.value.findIndex(o => o.id === currentParamOp.value!.id);
    updateOperation(updateOp, idx);
    Taro.showToast({ title: '参数录入成功', icon: 'success' });
    closeParamDialog();
  } catch (err) {
    console.error(err);
    Taro.showToast({ title: '提交失败', icon: 'none' });
  } finally {
    paramSubmitting.value = false;
  }
};

// ========== 投料弹窗相关状态 ==========
const showMaterialInputDialog = ref(false);
const materialInputTarget = ref<WorkOrderOperationDefinition | null>(null);
const snInputValues = ref<Record<string, string>>({});
const lotInputValues = ref<Record<string, { lotCode: string }>>({});

// 获取当前工序的待投料物料定义（未投满的）
const pendingMaterialDefs = computed(() => {
  const target = materialInputTarget.value;
  if (!target) return [];
  return target.materialDefinitions.filter(def => {
    const consumed = def.consumedQty || 0;
    // 当移除了 standardQty 后，这里只检查是否还有未消耗的物料
    // 实际业务中，可能通过其他方式判断是否已投满
    // 此处简化为：如果该物料没有任何投料记录，则视为待投料
    // 实际可由后端返回 isFulfilled 标志
    return consumed < 1; // 假设每件需要投1次，可根据业务调整
  });
});

// ========== 打开投料弹窗 ==========
const openMaterialInputDialog = (op: WorkOrderOperationDefinition) => {
  materialInputTarget.value = op;
  // 初始化输入值
  op.materialDefinitions.forEach(def => {
    if (def.isSNManaged) {
      snInputValues.value[def.id] = '';
    } else {
      lotInputValues.value[def.id] = { lotCode: '' };
    }
  });
  showMaterialInputDialog.value = true;
};

// ========== 关闭投料弹窗 ==========
const closeMaterialInputDialog = () => {
  showMaterialInputDialog.value = false;
  materialInputTarget.value = null;
  snInputValues.value = {};
  lotInputValues.value = {};
};

// ========== SN码投料 ==========
const submitSnInput = async (def: any) => {
  const sn = snInputValues.value[def.id]?.trim();
  if (!sn) {
    Taro.showToast({ title: '请输入SN码', icon: 'none' });
    return;
  }
  try {
    await feedMaterial({
      workOrderOperationId: materialInputTarget.value!.id,
      materialDefinitionId: def.id,
      snCode: sn
    });
    Taro.showToast({ title: `SN: ${sn} 投料成功`, icon: 'success' });
    snInputValues.value[def.id] = '';
    // 刷新工序数据
    await refreshOperation(materialInputTarget.value!.id);
  } catch (err: any) {
    Taro.showToast({ title: err.message || '投料失败', icon: 'none' });
  }
};

// ========== 批次码投料 ==========
const submitLotInput = async (def: any) => {
  const lotCode = lotInputValues.value[def.id]?.lotCode?.trim();
  const qtyStr = 1;
  if (!lotCode) {
    Taro.showToast({ title: '请输入批次号', icon: 'none' });
    return;
  }
  try {
    def.
    // await feedMaterial({
    //   workOrderOperationId: materialInputTarget.value!.id,
    //   materialDefinitionId: def.id,
    //   lotCode: lotCode,
    //   quantity: qty
    // });
    // Taro.showToast({ title: `批次 ${lotCode} 投料 ${qty} 成功`, icon: 'success' });
    lotInputValues.value[def.id] = { lotCode: '' };
    // 刷新工序数据
    // await refreshOperation(materialInputTarget.value!.id);
  } catch (err: any) {
    Taro.showToast({ title: err.message || '投料失败', icon: 'none' });
  }
};

// ========== 辅助函数 ==========
const getDefStatusText = (def: any) => {
  const consumed = def.consumedQty || 0;
  if (consumed === 0) return '待投料';
  return '已投料';
};

const getDefStatusClass = (def: any) => {
  const consumed = def.consumedQty || 0;
  return consumed === 0 ? 'status-pending' : 'status-done';
};

const getConsumedRecords = (def: any) => {
  // 从当前工序的投料记录中筛选
  const records = materialInputTarget.value?.currentProduction?.inputs || [];
  return records.filter(r => r.materialSap === def.materialSap);
};

// ========== 刷新单个工序数据 ==========
const refreshOperation = async (opId: string) => {
  const updated = await getWorkOrderDetail(workOrderId);
  const idx = operations.value.findIndex(o => o.id === opId);
  if (idx !== -1) {
    operations.value[idx] = updated.operations.find(o => o.id === opId)!;
  }
};

// ========== 删除/撤销投料记录 ==========
const removeConsumedRecord = async (def: any, record: any) => {
  // 弹出二次确认
  const confirm = await Taro.showModal({
    title: '撤销投料',
    content: `确定撤销 ${def.isSNManaged ? 'SN' : '批次'} ${def.isSNManaged ? record.snCode : record.lotCode} 的投料吗？`,
    confirmText: '确定',
    cancelText: '取消'
  });
  if (!confirm.confirm) return;

  try {
    // 调用撤销投料接口（需后端支持）
    // await undoFeedMaterial({
    //   workOrderOperationId: materialInputTarget.value!.id,
    //   materialDefinitionId: def.id,
    //   inputId: record.id // 投料记录ID
    // });

    // 刷新当前工序数据
    // await refreshOperation(materialInputTarget.value!.id);
  } catch (err: any) {
    Taro.showToast({ title: err.message || '撤销失败', icon: 'none' });
  }
};

// ========== 其他操作（占位） ==========

const updateOperation = (updatedOp: WorkOrderOperationDefinition, currentIndex: number) => {
  const current = operations.value[currentIndex];
  // 更新本地 operations 数据（用返回的新数据替换）
  current.status = updatedOp.status;
  current.completedQty = updatedOp.completedQty;
  current.currentProduction = updatedOp.currentProduction;
  current.productions = updatedOp.productions;

  if (currentIndex == operations.value.length - 1 && updatedOp.currentProduction?.status == 'COMPLETED') {
    if (workOrder.value) {
      workOrder.value.completedQty += 1;
      if (workOrder.value.plannedQty == workOrder.value.completedQty) {
        workOrder.value.status = 'Completed';
      }
    }
  }
}

const handleAnomalyReport = (op: WorkOrderOperationDefinition) => {
  Taro.showToast({ title: `上报异常 - ${op.operationName}`, icon: 'none' });
};

// ========== 跳转 ==========
const backToList = () => {
  Taro.navigateTo({ url: '/pages/work/order-list' });
};

const goToDetail = (opId: string) => {
  Taro.navigateTo({ url: `/pages/prod/operation-detail?workOrderId=${workOrderId}&operationId=${opId}` });
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
