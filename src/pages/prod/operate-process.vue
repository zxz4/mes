<template>
  <TabbarLayout>
    <view class="process-page">
      <NavBar :title="'工序加工台'" :show-back="true" />

      <view v-show="!currentOperation" class="error-state">
        <nut-empty description="工序不存在" />
        <nut-button type="primary" class="workbench-btn" @click="backToList">返回</nut-button>
      </view>

      <view v-show="currentOperation" class="process-content">
        <!-- 工序头部卡片 -->
        <view class="operation-header-card">
          <view class="header-top">
            <view class="header-left">
              <text class="op-code">{{ currentOperation?.operationCode }}</text>
              <text class="op-divider">｜</text>
              <text class="op-name">{{ currentOperation?.operationName }}</text>
            </view>
            <view class="header-right">
              <text class="op-type-tag type-process">加工工序</text>
              <text v-show="currentOperation?.skipEnabled" class="op-optional-tag">可选</text>
            </view>
          </view>
          <view class="header-bottom" v-show="scannedLot">
            <text class="stats-label">当前物料</text>
            <text class="stats-value">{{ scannedLot?.lotNumber }}</text>
          </view>
        </view>

        <!-- ===== 步骤指示器 ===== -->
        <view class="step-indicator">
          <view v-for="(step, index) in steps" :key="step.key" class="step-item" :class="{
            'step-active': step.status === 'active',
            'step-done': step.status === 'done',
            'step-optional': step.optional,
          }">
            <view class="step-dot">
              <text v-if="step.status === 'done'">✓</text>
              <text v-else-if="step.status === 'active'">{{ index + 1 }}</text>
              <text v-else>{{ index + 1 }}</text>
            </view>
            <text class="step-label">
              {{ step.label }}
              <text v-show="step.optional" class="optional-tag">(可选)</text>
            </text>
            <view v-show="index < steps.length - 1" class="step-line" :class="{ 'line-done': step.status === 'done' }">
            </view>
          </view>
        </view>

        <!-- ===== 扫描SN区域 ===== -->
        <view class="scan-section-card" v-show="!scannedLot">
          <view class="scan-section-header">
            <text class="scan-section-title">📷 扫描物料SN码</text>
          </view>
          <view class="scan-input-row">
            <view class="scan-input-wrapper">
              <nut-input ref="scanInputRef" v-model="snCode" placeholder="扫描或输入物料SN/批次号" class="scan-input" clearable
                @confirm="handleScanSN" />
            </view>
            <nut-button type="primary" class="submit-btn" :loading="loading" :disabled="!snCode.trim()"
              @click="handleScanSN">
              查询
            </nut-button>
          </view>
          <view class="scan-hint">💡 扫描SN获取可执行工序及物料状态</view>
        </view>

        <!-- ===== 物料信息卡片（SN扫描结果） ===== -->
        <view class="material-card" v-show="scannedLot">
          <view class="material-card-header">
            <view class="material-status-dot" :class="statusDotClass(scannedLot?.status ?? '')"></view>
            <text class="material-card-title">已绑定物料</text>
            <nut-button size="mini" plain type="default" class="unbind-btn" @click="scannedLot = null">
              重新扫描
            </nut-button>
          </view>
          <view class="material-card-body">
            <view class="material-info-row">
              <text class="material-label">名称</text>
              <text class="material-value highlight">{{ scannedLot?.name }}</text>
            </view>
            <view class="material-info-row">
              <text class="material-label">SAP</text>
              <text class="material-value mono">{{ scannedLot?.sap }}</text>
            </view>
            <view class="material-info-row">
              <text class="material-label">SN/批次</text>
              <text class="material-value">{{ scannedLot?.lotNumber }}</text>
            </view>
            <view class="material-info-row">
              <text class="material-label">状态</text>
              <text class="material-value" :class="statusTextClass(scannedLot?.status ?? '')">
                {{ statusLabel(scannedLot?.status ?? '') }}
              </text>
            </view>
            <view class="material-info-row" v-show="scannedLot?.specification">
              <text class="material-label">规格</text>
              <text class="material-value">{{ scannedLot?.specification }}</text>
            </view>
          </view>

          <!-- 可执行工序标签 -->
          <view class="available-ops" v-show="scannedLot">
            <text class="available-title">
              {{ scannedLot?.availableOperations?.length == 0 ? "无可执行工序" : "可执行工序：" }}
            </text>
            <view class="op-tags">
              <text v-for="op in scannedLot?.availableOperations" :key="op.operationId" class="op-tag"
                :class="{ 'op-tag-current': op.operationId === currentOperation?.id }">
                {{ op.operationCode }} {{ op.operationName }}
              </text>
            </view>
            <view v-show="!isCurrentOpAvailable" class="op-warning">
              ⚠️当前工序无法执行，请检查
            </view>
          </view>
        </view>

        <!-- ===== 参数表单卡片 ===== -->
        <view class="param-card"
          v-show="isCurrentOpAvailable && scannedLot && currentOperation?.isParameterRecordEnabled">
          <view class="param-card-header">
            <text class="param-title">📝 工艺参数</text>
          </view>
          <view class="param-form">
            <view v-for="(param, index) in currentOperation?.parameterDefinitions" :key="index" class="param-item">
              <view class="param-label">
                {{ param.parameterName }}
                <text v-show="param.isRequired" class="required-star">*</text>
                <text v-show="param.unit" class="param-unit">({{ param.unit }})</text>
              </view>
              <nut-input v-model="parameters[param.parameterName]" :placeholder="`请输入${param.parameterName}`"
                class="param-input" :class="{ 'input-error': paramErrors[param.parameterName] }"
                @blur="validateParam(param)" />
              <text v-show="paramErrors[param.parameterName]" class="error-msg">
                {{ paramErrors[param.parameterName] }}
              </text>
            </view>
          </view>
        </view>

        <!-- ===== 辅料录入卡片 ===== -->
        <view class="aux-section-card" v-show="isCurrentOpAvailable && scannedLot">
          <view class="aux-header">
            <text class="aux-title">🧪 辅料信息</text>
            <text class="aux-sub">扫描SAP添加辅料，批次相同则数量累加</text>
          </view>

          <!-- 辅料SAP扫描行 -->
          <view class="aux-scan-row">
            <view class="scan-input-wrapper">
              <nut-input v-model="auxSapCode" placeholder="扫描辅料SAP码" class="scan-input" clearable
                @confirm="handleAuxSapScan" />
            </view>
            <nut-button type="default" size="small" class="aux-add-btn" :loading="auxLoading"
              :disabled="!auxSapCode.trim()" @click="handleAuxSapScan">
              添加
            </nut-button>
          </view>

          <!-- 辅料列表（按辅料分组，展示批次行） -->
          <view v-if="auxMaterials.length > 0" class="aux-list">
            <view v-for="(material, mIndex) in auxMaterials" :key="material.id" class="aux-material-group">
              <!-- 辅料头部信息 -->
              <view class="aux-material-header">
                <view class="aux-material-info">
                  <text class="aux-material-name">{{ material.name }}</text>
                  <text class="aux-material-sap mono">{{ material.sap }}</text>
                  <text v-if="material.specification" class="aux-material-spec">{{ material.specification }}</text>
                </view>
                <nut-button size="mini" type="danger" plain class="aux-remove-btn" @click="removeAuxMaterial(mIndex)">
                  移除
                </nut-button>
              </view>

              <!-- 该辅料的批次列表 -->
              <view class="aux-batch-list">
                <view v-for="(batch, bIndex) in material.batches" :key="bIndex" class="aux-batch-item">
                  <view class="batch-row">
                    <view class="batch-input-group">
                      <text class="batch-label">批号</text>
                      <nut-input v-model="batch.lotNumber" placeholder="扫描批次号" class="batch-input small-input" clearable
                        @confirm="onBatchInputConfirm(mIndex, bIndex)" />
                    </view>
                    <view class="batch-input-group">
                      <text class="batch-label">数量</text>
                      <nut-input-number v-model="batch.quantity" type="digit" placeholder="0"
                        class="batch-input small-input quantity-input" />
                    </view>
                    <nut-button size="mini" type="danger" class="batch-remove-btn" @click="removeBatch(mIndex, bIndex)">
                      X
                    </nut-button>
                  </view>
                </view>
              </view>

              <!-- 添加新批次按钮 -->
              <view class="add-batch-row">
                <nut-button size="mini" plain type="primary" class="add-batch-btn" @click="addBatchForMaterial(mIndex)">
                  + 添加批次
                </nut-button>
                <text v-if="material.batches.length === 0" class="no-batch-hint">暂无批次，请添加</text>
              </view>
            </view>
          </view>

          <!-- 暂无辅料 -->
          <view v-else class="aux-empty">
            <text>暂无辅料，扫描SAP码添加</text>
          </view>
        </view>

        <!-- ===== 底部提交按钮（PASS / NG） ===== -->
        <view class="submit-area" v-show="isCurrentOpAvailable && scannedLot">
          <view class="submit-buttons-row">
            <nut-button type="danger" class="submit-btn-ng" :disabled="!canSubmit" @click="handleSubmit(true)">
              ❌ 不合格 (NG)
            </nut-button>
            <nut-button type="primary" class="submit-btn-pass" :disabled="!canSubmit" @click="handleSubmit(false)">
              ✅ 合格 (PASS)
            </nut-button>
          </view>
          <text v-show="submitError" class="submit-error">{{ submitError }}</text>
        </view>

        <view class="bottom-safe-area"></view>
      </view>
    </view>
  </TabbarLayout>
</template>

<script lang="ts" setup name="Process">
import type { WorkOrderOperationDefinition, Material, ParameterDefinition } from '@/types/work-order';
import { ScannedLot } from '@/types/production';
import { navigateTo, getCurrentInstance, showToast } from '@tarojs/taro';
import { getMaterialBySap, scanLot, submitOperationRecord } from '@/api/prod';
import { ref, onMounted, nextTick, computed } from 'vue';
import { getOperation } from '@/api/work-order/look-up';

onMounted(async () => {
  const instance = getCurrentInstance();
  const currentOperationId = instance?.router?.params?.operationId || instance?.router?.params?.id || '';
  if (!currentOperationId) {
    showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => backToList(), 1500);
    return;
  }
  loading.value = true;
  currentOperation.value = await getOperation(currentOperationId);
  loading.value = false;
  focusScanInput();
});
// 加载状态
const loading = ref(true);
// 工序信息
const currentOperation = ref<WorkOrderOperationDefinition | null>(null);
// 扫码相关
const scannedLot = ref<ScannedLot | null>(null);
const snCode = ref('');

// 参数相关
const parameters = ref<Record<string, string>>({});
const paramErrors = ref<Record<string, string>>({});


interface AuxBatchInput {
  lotNumber: string,
  quantity: number
}

interface AuxMaterial extends Material {
  snCode?: '',
  batches: Array<AuxBatchInput>
}

const auxMaterials = ref<Array<AuxMaterial>>([]);

/**
 * 当前工序是否在可执行列表中
 */
const isCurrentOpAvailable = computed(() => {
  if (!scannedLot.value) return false;
  const result = scannedLot.value.availableOperations.some(
    op => op.operationId == currentOperation.value!.id
  );
  return result;
});

/**
 *参数是否全部填写完成（必填项均有值且无错误）
 */
const paramCompleted = computed(() => {
  if (!scannedLot.value || !currentOperation.value?.isParameterRecordEnabled || currentOperation.value?.parameterDefinitions?.length === 0) {
    return true // 无参数则默认完成
  }
  const defs = currentOperation.value!.parameterDefinitions;
  const allRequiredFilled = defs
    .filter(p => p.isRequired)
    .every(p => parameters.value[p.parameterName] !== null && parameters.value[p.parameterName] !== '')
  console.log(allRequiredFilled);
  return allRequiredFilled;
});

const canSubmit = computed(() => {
  return isCurrentOpAvailable.value && paramCompleted.value && !loading.value
});

const backToList = () => {
  navigateTo({ url: '/pages/work/order-list' });
};

const steps = computed(() => {
  const list = [
    {
      key: 'scan',
      label: '扫描SN',
      status: scannedLot.value ? 'done' : 'active',
      optional: false,
    }
  ];
  // 参数步骤：仅当有定义时显示
  if (currentOperation.value && currentOperation.value.parameterDefinitions?.length > 0) {
    const paramDone = paramCompleted.value;
    list.push({
      key: 'params',
      label: '填写参数',
      status: !scannedLot.value ? 'pending' : (paramDone ? 'done' : 'active'),
      optional: false,
    })
  }
  // 辅料步骤：始终显示，但标记为选填
  list.push({
    key: 'aux',
    label: '辅料录入',
    status: scannedLot.value ? 'active' : 'pending',
    optional: true,
  })
  return list;
});

const initParameters = () => {
  parameters.value = {}
  paramErrors.value = {}
  if (currentOperation.value && currentOperation.value.parameterDefinitions) {
    currentOperation.value.parameterDefinitions.forEach(p => {
      parameters.value[p.parameterName] = ''
    })
  }
}

const handleScanSN = async () => {
  if (!snCode.value.trim() || loading.value) return;
  const code = snCode.value.trim();
  loading.value = true;
  try {
    scannedLot.value = await scanLot(code, currentOperation.value!.workOrderId);
    snCode.value = ''
    // 初始化参数对象
    initParameters();
  } finally {
    loading.value = false;
  }
}

/**
 * 校验单个参数
 */
const validateParam = (param: ParameterDefinition) => {
  const value = parameters.value[param.parameterName]
  if (param.isRequired && (value === '' || value === null)) {
    paramErrors.value[param.parameterName] = `${param.parameterName}不能为空`;
    return;
  }
  if (param.parameterType === 'digit') {
    const num = parseFloat(value)
    if (isNaN(num)) {
      paramErrors.value[param.parameterName] = '请输入有效数字';
      return;
    }
  }
  delete paramErrors.value[param.parameterName];
}


const auxSapCode = ref('');
const auxLoading = ref(false);

/**
 * 扫描辅料SAP码
 * */
const handleAuxSapScan = async () => {
  if (!auxSapCode.value.trim() || auxLoading.value) return
  const sap = auxSapCode.value.trim()
  auxLoading.value = true
  try {
    // 调用API根据SAP查询辅料信息
    const material = await getMaterialBySap(sap);

    if (material == null) {
      showToast({ title: '未取得该料号信息', icon: 'none' });
      return;
    }

    const existingIndex = auxMaterials.value.findIndex(m => m.id === material.id)
    if (existingIndex >= 0) {
      // 已存在，直接为其添加一个默认空批次
      showToast({ title: '该辅料已存在，可选添加批号', icon: 'none' });
      return;
    }

    // 添加到辅料列表，附带空的snCode
    auxMaterials.value.push({
      batches: [],
      ...material
    });
    auxSapCode.value = ''
  } finally {
    auxLoading.value = false
  }
};

// 移除辅料
const removeAuxMaterial = (index: number) => {
  auxMaterials.value.splice(index, 1)
};

/**
 * 批次号输入确认时，检查同一辅料内是否有重复批次号，若有则合并数量
 */
const onBatchInputConfirm = (materialIndex: number, batchIndex: number) => {
  const material = auxMaterials.value[materialIndex]
  const currentBatch = material.batches[batchIndex]
  const lot = currentBatch.lotNumber.trim()
  if (!lot) return

  // 查找是否有其他批次相同 lotNumber (排除自身)
  const duplicateIndex = material.batches.findIndex(
    (b, idx) => idx !== batchIndex && b.lotNumber.trim() === lot
  )
  if (duplicateIndex >= 0) {
    // 合并数量
    const dupBatch = material.batches[duplicateIndex];
    const qty1 = currentBatch.quantity || 0;
    const qty2 = dupBatch.quantity || 0;
    const totalQty = qty1 + qty2;
    dupBatch.quantity = totalQty;
    material.batches.splice(batchIndex, 1);
  }
};

/**
 * 移除某个批次
 */
const removeBatch = (materialIndex: number, batchIndex: number) => {
  const material = auxMaterials.value[materialIndex];
  material.batches.splice(batchIndex, 1);
  // 如果该辅料下没有批次了，可以选择是否移除整个辅料，这里保留辅料项但显示提示
};

/**
 * 新增批次
 */
const addBatchForMaterial = (materialIndex: number) => {
  auxMaterials.value[materialIndex].batches.push({
    lotNumber: '',
    quantity: 1,
  })
}

const submitError = ref('');

const handleSubmit = async (isAbnormal: boolean) => {
  if (!canSubmit.value) return;
  if (currentOperation.value?.isParameterRecordEnabled && currentOperation.value.parameterDefinitions?.length > 0) {
    for (let param of currentOperation.value.parameterDefinitions) {
      validateParam(param);
    }
    const hasError = Object.values(paramErrors.value).some(e => e)
    if (hasError) {
      submitError.value = '请更正参数错误'
      return
    }
  };
  const paramList: Array<Record<string, string>> = []
  if (currentOperation.value?.isParameterRecordEnabled && currentOperation.value?.parameterDefinitions) {
    currentOperation.value.parameterDefinitions.forEach(p => {
      paramList.push({
        parameterName: p.parameterName,
        value: String(parameters.value[p.parameterName]),
      })
    })
  };
  const materialUsages: Array<Record<string, string | number>> = []
  auxMaterials.value.forEach(material => {
    if (material.batches.length > 0) {
      material.batches.forEach(batch => {
        const lot = batch.lotNumber.trim()
        if (lot && batch.quantity > 0) {
          materialUsages.push({
            materialId: material.id,
            lotNumber: lot,
            quantity: batch.quantity
          })
        }
      });
    } else {
      materialUsages.push({
        materialId: material.id,
        lotNumber: material.sap,
        quantity: 1
      });
    }
  })
  const para = {
    workOrderId: currentOperation.value?.workOrderId,
    operationId: currentOperation.value?.id,
    processedLotNumber: scannedLot.value?.lotNumber,
    isAbnormal,
    parameters: paramList,
    materialUsages
  };
  loading.value = true;
  try {
    await submitOperationRecord(para);
    showToast({ title: '成功' });
    resetForm();
    focusScanInput();
  } finally {
    loading.value = false;
  }
}

const scanInputRef = ref();
/**
 * 获得输入框焦点
 */
const focusScanInput = () => {
  nextTick(() => {
    //降级-获取扫码框焦点
    setTimeout(() => {
      scanInputRef.value.$refs.inputRef.focus();
    }, 500);
  });
};

// 辅助方法
const resetForm = () => {
  scannedLot.value = null;
  parameters.value = {};
  paramErrors.value = {};
  auxMaterials.value = [];
  auxSapCode.value = '';
  snCode.value = '';
  submitError.value = '';
}

const statusLabel = (status: string) => {
  const map = {
    'Created': '已创建',
    'AwaitNext ': '等待下一道',
    'Passed': '已通过',
    'Consumed': '已消耗',
    'Scrapped': '已报废',
  }
  return map[status] !== undefined ? map[status] : '未知状态';
};
const statusDotClass = (status: string) => {
  if (status === 'AwaitNext') return 'dot-process';  // AwaitNext 蓝色
  if (status === 'Passed') return 'dot-done';       // Passed 绿色
  if (status === 'Consumed') return 'dot-ng';     // Consumed 红色（不可用）
  if (status === 'Scrapped') return 'dot-ng';       // Scrapped 红色
  return 'dot-created';                     // Created=0 黄色
};
const statusTextClass = (status: string) => {
  if (status === 'Created') return 'text-created';
  if (status === 'AwaitNext') return 'text-process';
  if (status === 'Passed') return 'text-done';
  if (status === 'Consumed' || status == 'Scrapped') return 'text-ng';
  return ''
};

</script>

<style scoped>
/* ========== 全局复用样式 ========== */
.process-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

.process-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 工序头部卡片 */
.operation-header-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2px;
}

.op-code {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
}

.op-divider {
  color: #d0d0d0;
  font-size: 14px;
  margin: 0 4px;
}

.op-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.op-type-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.type-process {
  background: #ede9fe;
  color: #6d28d9;
}

.op-optional-tag {
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 10px;
}

.header-bottom {
  margin-top: 10px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.stats-label {
  font-size: 12px;
  color: #999;
}

.stats-value {
  font-size: 18px;
  font-weight: 700;
  color: #6d28d9;
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  padding: 8px 6px;
  gap: 0;
}

.step-item {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
}

.step-item:last-child {
  flex: 0 0 auto;
}

.step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #e8e8e8;
  color: #999;
  flex-shrink: 0;
  transition: all 0.3s;
}

.step-active .step-dot {
  background: #6d28d9;
  color: #fff;
  box-shadow: 0 2px 8px rgba(109, 40, 217, 0.35);
}

.step-done .step-dot {
  background: #2ca85c;
  color: #fff;
}

.step-label {
  font-size: 13px;
  color: #999;
  font-weight: 500;
  white-space: nowrap;
}

.step-active .step-label {
  color: #6d28d9;
  font-weight: 600;
}

.step-done .step-label {
  color: #2ca85c;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e8e8e8;
  margin: 0 4px;
  border-radius: 1px;
  transition: background 0.4s;
}

.line-done {
  background: #2ca85c;
}

.step-optional .step-dot {
  border: 1.5px dashed #ccc;
}

.optional-tag {
  font-size: 10px;
  color: #999;
  margin-left: 2px;
}

/* 扫描区域 */
.scan-section-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.scan-section-header {
  margin-bottom: 10px;
}

.scan-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.scan-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.scan-input-wrapper {
  flex: 1;
  min-width: 0;
}

.scan-input {
  border-radius: 10px;
  border: 1.5px solid #e0e0e0;
  padding: 10px 12px;
  font-size: 15px;
  background: #fafbfc;
}

.submit-btn {
  flex-shrink: 0;
  min-width: 72px;
  height: 44px;
  border-radius: 10px;
  font-weight: 600;
}

.scan-hint {
  margin-top: 8px;
  font-size: 11px;
  color: #bbb;
}

/* 物料卡片 */
.material-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  border-left: 4px solid #6d28d9;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.material-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.material-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-created {
  background: #f59e0b;
}

.dot-process {
  background: #3b82f6;
}

.dot-done {
  background: #2ca85c;
}

.dot-ng {
  background: #e8553d;
}

.material-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #6d28d9;
  flex: 1;
}

.unbind-btn {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  color: #999;
  border-color: #ddd;
}

.material-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.material-label {
  font-size: 12px;
  color: #999;
  width: 56px;
  flex-shrink: 0;
}

.material-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex: 1;
  word-break: break-all;
}

.material-value.highlight {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 15px;
}

.material-value.mono {
  font-family: monospace;
}

.text-created {
  color: #f59e0b;
  font-weight: 600;
}

.text-process {
  color: #3b82f6;
}

.text-done {
  color: #2ca85c;
}

.text-ng {
  color: #e8553d;
}

.available-ops {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.available-title {
  font-size: 12px;
  color: #888;
  display: block;
  margin-bottom: 6px;
}

.op-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.op-tag {
  font-size: 11px;
  background: #f3f4f6;
  color: #555;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.op-tag-current {
  background: #ede9fe;
  color: #6d28d9;
  border-color: #c4b5fd;
  font-weight: 600;
}

.op-warning {
  margin-top: 8px;
  font-size: 11px;
  color: #e8553d;
}

/* 参数卡片 */
.param-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.param-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.param-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.param-required-hint {
  font-size: 11px;
  color: #e8553d;
}

.param-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-label {
  font-size: 13px;
  font-weight: 500;
  color: #444;
}

.required-star {
  color: #e8553d;
  margin-left: 2px;
}

.param-unit {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.param-input {
  border-radius: 8px;
  border: 1.5px solid #e0e0e0;
  padding: 8px 12px;
  font-size: 14px;
}

.input-error {
  border-color: #e8553d !important;
  background: #fff5f5;
}

.error-msg {
  font-size: 11px;
  color: #e8553d;
}

/* ========== 辅料卡片全新样式 ========== */
.aux-section-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.aux-header {
  margin-bottom: 12px;
}

.aux-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.aux-sub {
  font-size: 11px;
  color: #999;
  margin-left: 8px;
}

.aux-scan-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
}

.aux-add-btn {
  flex-shrink: 0;
  border-radius: 8px;
}

.aux-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.aux-material-group {
  background: #f9fafb;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #eef0f2;
}

.aux-material-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.aux-material-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.aux-material-name {
  font-size: 14px;
  font-weight: 600;
  color: #222;
}

.aux-material-sap {
  font-size: 11px;
  color: #777;
  font-family: monospace;
}

.aux-material-spec {
  font-size: 11px;
  color: #999;
}

.aux-remove-btn {
  font-size: 10px;
  padding: 2px 8px;
}

.aux-batch-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.aux-batch-item {
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid #eee;
}

.batch-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.batch-label {
  font-size: 11px;
  color: #666;
  width: 28px;
  flex-shrink: 0;
}

.small-input {
  padding: 6px 8px;
  font-size: 13px;
  border-radius: 6px;
}

.quantity-input {
  width: 70px;
  flex-shrink: 0;
}

.batch-remove-btn {
  font-size: 10px;
  padding: 2px 6px;
  color: #e8553d;
}

.add-batch-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-batch-btn {
  font-size: 11px;
  padding: 3px 12px;
  border-radius: 6px;
}

.no-batch-hint {
  font-size: 11px;
  color: #ccc;
}

.aux-empty {
  text-align: center;
  padding: 16px;
  color: #aaa;
  font-size: 12px;
}

/* 提交区域 */
.submit-area {
  margin-top: 8px;
}

.submit-buttons-row {
  display: flex;
  gap: 12px;
}

.submit-btn-ng,
.submit-btn-pass {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
}

.submit-btn-ng {
  background: #fef2f2;
  color: #e8553d;
  border: 1.5px solid #fecaca;
}

.submit-btn-pass {
  background: #ecfdf5;
  color: #2ca85c;
  border: 1.5px solid #a7f3d0;
}

.submit-error {
  font-size: 12px;
  color: #e8553d;
  text-align: center;
  margin-top: 6px;
}

.bottom-safe-area {
  height: 20px;
}

.workbench-btn {
  border-radius: 10px;
  font-weight: 500;
}
</style>
