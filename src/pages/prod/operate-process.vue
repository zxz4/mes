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

        <StepIndicator :steps="steps" />

        <MaterialInfoCard :material="scannedLot" :status="scannedLot?.status" title="当前物料" placeholder-icon="📱"
          placeholder-title="尚未扫描物料" placeholder-desc="请扫描物料SN码获取信息" @unbind="scannedLot = null">
          <!-- 插槽：物料状态和可执行工序 -->
          <template #extra="{ material }">
            <view class="material-info-row">
              <text class="material-label">状态</text>
              <text class="material-value" :class="statusTextClass(material.status ?? '')">
                {{ statusLabel }}
              </text>
            </view>

            <view class="available-ops" v-if="material.availableOperations?.length">
              <text class="available-title">可执行工序：</text>
              <view class="op-tags">
                <text v-for="op in material.availableOperations" :key="op.operationId" class="op-tag"
                  :class="{ 'op-tag-current': op.operationId === currentOperation?.id }">
                  {{ op.operationCode }} {{ op.operationName }}
                </text>
              </view>
            </view>
          </template>
        </MaterialInfoCard>

        <!-- ===== 扫描SN区域 ===== -->
        <view class="scan-section-card">
          <view class="scan-section-header">
            <text class="scan-section-title">📷 扫描物料SN码</text>
          </view>
          <view class="scan-input-row">
            <view class="scan-input-wrapper">
              <nut-input ref="scanInputRef" v-model="scanCode" placeholder="扫描或输入物料SN/批次号" clearable
                @confirm="handleScanSN">
              </nut-input>
            </view>
            <nut-button type="primary" class="submit-btn" :loading="loading" :disabled="!scanCode.trim()"
              @click="handleScanSN">
              查询
            </nut-button>
          </view>
          <view class="scan-hint">💡 扫描SN获取可执行工序及物料状态</view>
        </view>

        <!-- ===== 参数表单卡片 ===== -->
        <view class="param-card"
          v-show="isCurrentOpAvailable && scannedLot && currentOperation?.isParameterRecordEnabled && currentOperation.parameterDefinitions.length">
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
              <nut-input v-model="auxSapCode" placeholder="扫描辅料SAP码" clearable @confirm="handleAuxSapScan" />
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
import { getMaterialBySap, scanLot, submitOperationRecord } from '../../apis/prod';
import { ref, onMounted, nextTick, computed } from 'vue';
import { getOperation } from '../../apis/work-order/look-up';
import { getProductStatusText } from '../../utils/statusText';
import StepIndicator from '@/components/StepIndicator.vue';
import type { StepItem } from '@/components/StepIndicator.vue';
import MaterialInfoCard from '@/components/MaterialInfoCard.vue';

const steps = computed<StepItem[]>(() => {
  const list: StepItem[] = [
    {
      key: 'scan',
      label: '扫描SN',
      status: scannedLot.value ? 'done' : 'active',
    },
  ];

  // 参数步骤：仅当有参数定义时显示
  if (currentOperation.value && currentOperation.value.parameterDefinitions?.length > 0) {
    list.push({
      key: 'params',
      label: '填写参数',
      status: !scannedLot.value ? 'pending' : (paramCompleted.value ? 'done' : 'active'),
    });
  }

  // 辅料始终显示但选填
  list.push({
    key: 'aux',
    label: '辅料录入',
    status: scannedLot.value ? 'active' : 'pending',
    optional: true,
  });

  return list;
});

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
const scanCode = ref('');

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
  navigateTo({ url: '/pages/work/list-page' });
};



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
  if (!scanCode.value.trim() || loading.value) return;
  const code = scanCode.value.trim();
  loading.value = true;
  try {
    scannedLot.value = await scanLot(code, currentOperation.value!.workOrderId);
    scanCode.value = ''
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
  scanCode.value = '';
  submitError.value = '';
}

const statusLabel = computed(() => {
  return scannedLot.value == null ? '' : getProductStatusText(scannedLot.value.status);
});


const statusTextClass = (status: string) => {
  switch (status) {
    case 'AwaitNext': return 'text-process';
    case 'Passed': return 'text-done';
    case 'Consumed':
    case 'Scrapped':
      return 'text-ng';
    default: return 'text-created';
  }
};
</script>

<style scoped>
@import './operate-process.css';
</style>
