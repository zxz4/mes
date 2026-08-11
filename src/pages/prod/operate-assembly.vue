<template>
  <TabbarLayout>
    <view class="assembly-page">
      <NavBar :title="'工序装配台'" :show-back="true" />

      <!-- 工序不存在 -->
      <view v-if="!currentOperation" class="error-state">
        <nut-empty description="工序不存在" />
        <nut-button type="primary" class="workbench-btn" @click="backToList">返回</nut-button>
      </view>

      <!-- 正常装配区 -->
      <view v-else class="assembly-content">
        <!-- 工序头部卡片 -->
        <view class="operation-header-card">
          <view class="header-top">
            <view class="header-left">
              <text class="op-code">{{ currentOperation.operationCode }}</text>
              <text class="op-divider">｜</text>
              <text class="op-name">{{ currentOperation.operationName }}</text>
            </view>
            <view class="header-right">
              <text class="op-type-tag type-assembly">装配工序</text>
              <text v-if="currentOperation.skipEnabled" class="op-optional-tag">可选</text>
            </view>
          </view>
          <view class="header-bottom" v-if="scannedLot">
            <text class="stats-label">当前主物料</text>
            <text class="stats-value">{{ scannedLot.lotNumber }}</text>
          </view>
        </view>

        <StepIndicator :steps="steps" />

        <MaterialInfoCard :material="scannedLot" :status="scannedLot?.status" title="当前物料" placeholder-icon="📱"
          placeholder-title="尚未扫描SN" placeholder-desc="请扫描SN码获取信息" @unbind="scannedLot = null">
          <!-- 插槽：物料状态和可执行工序 -->
          <template #extra>
            <view class="material-info-row">
              <text class="material-label">状态</text>
              <text class="material-value" :class="statusTextClass(scannedLot?.status ?? '')">
                {{ statusLabel }}
              </text>
            </view>
            <!-- 可执行工序标签 -->
            <view class="available-ops" v-show="scannedLot">
              <text class="available-title">可执行工序：</text>
              <view class="op-tags">
                <text v-for="op in scannedLot?.availableOperations" :key="op.operationId" class="op-tag"
                  :class="{ 'op-tag-current': op.operationId === currentOperation.id }">
                  {{ op.operationCode }} {{ op.operationName }}
                </text>
              </view>
              <view v-show="!isCurrentOpAvailable" class="op-warning">
                ⚠️ 当前工序不在可执行列表中
              </view>
              <view v-show="!canProcessMainLot" class="op-warning">
                ⚠️ 主物料状态为“{{ statusLabel }}”，无法进行装配
              </view>
            </view>
          </template>
        </MaterialInfoCard>

        <!-- 扫描主物料SN区域 -->
        <view class="scan-section-card" v-show="!isCurrentOpAvailable">
          <view class="scan-section-header">
            <text class="scan-section-title"> 扫描主物料SN码</text>
          </view>
          <view class="scan-input-row">
            <view class="scan-input-wrapper">
              <nut-input ref="scanInputRef" v-model="scanCode" placeholder="扫描或输入主物料SN/批次号" clearable
                @confirm="handleScanMainSN">
              </nut-input>
            </view>
            <nut-button type="primary" class="submit-btn" :loading="loading" :disabled="!scanCode.trim()"
              @click="handleScanMainSN">
              查询
            </nut-button>
          </view>
          <view class="scan-hint">💡 扫描主物料SN获取工序及状态</view>
        </view>

        <!-- 参数表单卡片 -->
        <view class="param-card"
          v-if="scannedLot && currentOperation.parameterDefinitions && currentOperation.parameterDefinitions.length > 0">
          <view class="param-card-header">
            <text class="param-title">📝 工艺参数</text>
            <text v-if="currentOperation.isParameterRecordEnabled" class="param-required-hint">
              * 必填项
            </text>
          </view>
          <view class="param-form">
            <view v-for="(param, index) in currentOperation.parameterDefinitions" :key="index" class="param-item">
              <view class="param-label">
                {{ param.parameterName }}
                <text v-if="param.isRequired" class="required-star">*</text>
                <text v-if="param.unit" class="param-unit">({{ param.unit }})</text>
              </view>
              <nut-input v-model="parameters[param.parameterName]" :placeholder="`请输入${param.parameterName}`"
                :type="param.parameterType" class="param-input"
                :class="{ 'input-error': paramErrors[param.parameterName] }" @blur="validateParam(param)" />
              <text v-if="paramErrors[param.parameterName]" class="error-msg">
                {{ paramErrors[param.parameterName] }}
              </text>
            </view>
          </view>
        </view>

        <!-- 装配组件扫描区 -->
        <view class="assembly-section-card" v-show="canProcessMainLot">
          <view class="assembly-header">
            <text class="assembly-title">🔧 装配组件</text>
            <text class="assembly-sub">扫描组件SN（仅Passed状态可装配）</text>
          </view>

          <!-- 组件SN扫描行 -->
          <view class="assembly-scan-row">
            <view class="scan-input-wrapper">
              <nut-input v-model="componentSnCode" placeholder="扫描组件SN码" clearable @confirm="handleScanComponentSN" />
            </view>
            <nut-button type="default" size="small" class="assembly-add-btn" :loading="loading"
              :disabled="!componentSnCode.trim()" @click="handleScanComponentSN">
              添加
            </nut-button>
          </view>

          <!-- 已添加组件列表 -->
          <view v-if="componentList.length > 0" class="component-list">
            <view v-for="(comp, index) in componentList" :key="comp.id" class="component-item">
              <view class="component-info">
                <view class="component-status-dot" :class="statusDotClass('Passed')"></view>
                <view class="component-text">
                  <text class="component-name">{{ comp.name }}</text>
                  <text class="component-lot mono">{{ comp.lotNumber }}</text>
                  <text class="component-sap">{{ comp.sap }}</text>
                </view>
              </view>
              <nut-button size="mini" type="danger" plain class="component-remove-btn" @click="removeComponent(index)">
                移除
              </nut-button>
            </view>
          </view>
          <view v-else class="component-empty">
            <text>暂无组件，扫描SN码添加（仅支持Passed状态）</text>
          </view>
        </view>

        <!-- ===== 底部单个装配按钮 ===== -->
        <view class="submit-area" v-if="scannedLot">
          <nut-button type="primary" class="assembly-submit-btn" :loading="loading" :disabled="!canSubmit"
            @click="handleAssemblySubmit">
            🔧 装配
          </nut-button>
          <text v-if="submitError" class="submit-error">{{ submitError }}</text>
        </view>

        <view class="bottom-safe-area"></view>
      </view>
    </view>
  </TabbarLayout>
</template>

<script lang="ts" setup name="Assembly">
import type { WorkOrderOperationDefinition, ParameterDefinition } from '@/types/work-order';
import { ScannedLot } from '@/types/production';
import { navigateTo, getCurrentInstance, showToast } from '@tarojs/taro';
import { scanLot, submitOperationRecord } from '../../apis/prod';
import { ref, onMounted, nextTick, computed } from 'vue';
import { getOperation } from '../../apis/work-order/look-up';
import { getProductStatusText } from '../../utils/statusText';
import StepIndicator from '@/components/StepIndicator.vue';
import type { StepItem } from '@/components/StepIndicator.vue';
import MaterialInfoCard from '@/components/MaterialInfoCard.vue';


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

const loading = ref(true);
const currentOperation = ref<WorkOrderOperationDefinition | null>(null);
const scannedLot = ref<ScannedLot | null>(null);
const scanCode = ref('');
const componentSnCode = ref('');
const parameters = ref<Record<string, string>>({});
const paramErrors = ref<Record<string, string>>({});

type PartComponent = Omit<ScannedLot, 'availableOperations' | 'materialType' | 'status'>;
const componentList = ref<PartComponent[]>([]);

const steps = computed<StepItem[]>(() => {
  const list: StepItem[] = [
    {
      key: 'scan',
      label: '扫描SN',
      status: scannedLot.value ? 'done' : 'active',
      optional: false,
    },
  ];
  if (currentOperation.value?.isParameterRecordEnabled) {
    const paramDone = paramCompleted.value;
    list.push({
      key: 'params',
      label: '填写参数',
      status: !scannedLot.value ? 'pending' : (paramDone ? 'done' : 'active'),
      optional: false,
    });
  }
  list.push({
    key: 'assembly',
    label: '装配组件',
    status: scannedLot.value ? 'active' : 'pending',
    optional: true,
  });
  return list;
});

const isCurrentOpAvailable = computed(() => {
  if (!scannedLot.value) return false;
  return scannedLot.value.availableOperations.some(
    op => op.operationId == currentOperation.value!.id
  );
});

const canProcessMainLot = computed(() => {
  if (!scannedLot.value) return false;
  return scannedLot.value.status === 'AwaitNext' || scannedLot.value.status === 'Passed';
});

const paramCompleted = computed(() => {
  if (!scannedLot.value || !currentOperation.value?.isParameterRecordEnabled || currentOperation.value?.parameterDefinitions?.length === 0) {
    return true;
  }
  const defs = currentOperation.value!.parameterDefinitions;
  return defs
    .filter(p => p.isRequired)
    .every(p => parameters.value[p.parameterName] !== null && parameters.value[p.parameterName] !== '');
});

const canSubmit = computed(() => {
  if (!scannedLot.value || !isCurrentOpAvailable.value || !canProcessMainLot.value) return false;
  if (scannedLot.value.materialType != currentOperation.value?.applicableMaterialType) return false;
  if (currentOperation.value?.isParameterRecordEnabled && !paramCompleted.value) return false;
  if (componentList.value.length === 0) return false;
  return true;
});

const backToList = () => {
  navigateTo({ url: '/pages/work/order-list' });
};

const handleScanMainSN = async () => {
  if (!scanCode.value.trim() || loading.value) return;
  const code = scanCode.value.trim();
  loading.value = true;
  try {
    const lot = await scanLot(code, currentOperation.value!.workOrderId);
    scannedLot.value = lot;
    scanCode.value = '';
    // if (lot.materialType != currentOperation.value?.applicableMaterialType) {
    //   showToast({ title: `${lot.name}与工序类型不匹配.`, icon: 'error' });
    //   return;
    // }
    // let hit = '';
    // switch (lot.status) {
    //   case 'Consumed':
    //     hit = `(${code})已消耗`;
    //     break;
    //   case 'Scrapped':
    //     hit = `(${code})已报废`;
    //     break;
    //   case 'Passed':
    //     hit = `(${code})已完工`;
    //     break;
    // }

    // if (hit) {
    //   showToast({ title: hit, icon: 'error' });
    //   return;
    // }
    if (canProcessMainLot.value) initParameters();
  } finally {
    loading.value = false;
  }
};

const initParameters = () => {
  parameters.value = {};
  paramErrors.value = {};
  if (currentOperation.value?.parameterDefinitions) {
    currentOperation.value.parameterDefinitions.forEach(p => {
      parameters.value[p.parameterName] = '';
    });
  }
};

const validateParam = (param: ParameterDefinition) => {
  const value = parameters.value[param.parameterName];
  if (param.isRequired && (value === '' || value === null)) {
    paramErrors.value[param.parameterName] = `${param.parameterName}不能为空`;
    return;
  }
  if (param.parameterType === 'digit') {
    const num = parseFloat(value);
    if (isNaN(num)) {
      paramErrors.value[param.parameterName] = '请输入有效数字';
      return;
    }
  }
  delete paramErrors.value[param.parameterName];
};

// 扫描组件SN（增加自身装配检查）
const handleScanComponentSN = async () => {
  if (!componentSnCode.value.trim() || loading.value) return;
  const code = componentSnCode.value.trim();
  loading.value = true;
  try {
    const response = await scanLot(code, currentOperation.value!.workOrderId);
    if (response.status !== "Passed") {
      let hit = '';
      switch (response.status) {
        case 'Consumed':
          hit = '该物料已被使用';
          break;
        case 'Scrapped':
          hit = '该物料已报废';
          break;
        default:
          hit = '该物料尚未完工';
          break;
      }
      componentSnCode.value = '';
      showToast({ title: hit, icon: 'error' });
      return;
    }
    // 禁止装配自身
    if (response.lotNumber === scannedLot.value?.lotNumber) {
      showToast({ title: '不能装配自身', icon: 'none' });
      componentSnCode.value = '';
      return;
    }
    if (componentList.value.some(c => c.id === response.id)) {
      showToast({ title: '该组件已添加', icon: 'error' });
      componentSnCode.value = '';
      return;
    }
    componentList.value.push({
      id: response.id,
      lotNumber: response.lotNumber,
      sap: response.sap,
      name: response.name,
      specification: response.specification,
    });
    componentSnCode.value = '';
  } finally {
    loading.value = false;
  }
};

const removeComponent = (index: number) => {
  componentList.value.splice(index, 1);
};

const submitError = ref('');

// 装配提交（固定 isAbnormal 为 false）
const handleAssemblySubmit = async () => {
  if (!canSubmit.value) return;

  if (currentOperation.value?.isParameterRecordEnabled && currentOperation.value.parameterDefinitions?.length > 0) {
    for (let param of currentOperation.value.parameterDefinitions) {
      validateParam(param);
    }
    if (Object.values(paramErrors.value).some(e => e)) {
      submitError.value = '请更正参数错误';
      return;
    }
  }

  const paramList: Array<Record<string, string>> = [];
  if (currentOperation.value?.isParameterRecordEnabled && currentOperation.value?.parameterDefinitions) {
    currentOperation.value.parameterDefinitions.forEach(p => {
      paramList.push({
        parameterName: p.parameterName,
        value: String(parameters.value[p.parameterName] || ''),
      });
    });
  }

  const payload = {
    workOrderId: currentOperation.value?.workOrderId,
    operationId: currentOperation.value?.id,
    processedLotNumber: scannedLot.value?.lotNumber,
    isAbnormal: false, // 装配默认为合格
    parameters: paramList,
    componentLotNumbers: componentList.value.map(c => c.id),
  };

  loading.value = true;
  try {
    await submitOperationRecord(payload);
    showToast({ title: '装配成功' });
    // 重置表单
    scannedLot.value = null;
    componentList.value = [];
    parameters.value = {};
    paramErrors.value = {};
    componentSnCode.value = '';
    scanCode.value = '';
    focusScanInput();
  } catch (error) {
    submitError.value = '提交失败，请重试';
  } finally {
    loading.value = false;
  }
};

const scanInputRef = ref();

const focusScanInput = () => {
  nextTick(() => {
    setTimeout(() => {
      scanInputRef.value?.$refs?.inputRef?.focus();
    }, 500);
  });
};

const statusLabel = computed(() => {
  return scannedLot.value == null ? '' : getProductStatusText(scannedLot?.value.status);
})

const statusDotClass = (status: string) => {
  switch (status) {
    case 'AwaitNext': return 'dot-process';
    case 'Passed': return 'dot-done';
    case 'Consumed':
    case 'Scrapped':
      return 'dot-ng';
    default: return 'dot-created';
  }
};

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
@import './operate-assembly.css';
</style>
