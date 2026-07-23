<template>
  <TabbarLayout>
    <view class="workbench-page">
      <NavBar :title="'工序作业台'" :show-back="true" />

      <view v-if="!operation" class="error-state">
        <nut-empty description="工序不存在" />
        <nut-button type="primary" class="workbench-btn" @click="backToList">返回工序列表</nut-button>
      </view>

      <view v-else class="workbench-content">
        <!-- 工序信息头部 -->
        <view class="operation-header">
          <view class="op-title">
            <text class="op-code">{{ operation.operationCode }}</text>
            <text class="op-name">{{ operation.operationName }}</text>
            <text class="op-type" :class="typeClass(operation.applicableMaterialType)">
              {{ typeLabel(operation.applicableMaterialType) }}
            </text>
            <text v-if="operation.skipEnabled" class="op-optional">[可选]</text>
          </view>
          <view class="op-stats">
            <text>已处理：{{ totalCount }}</text>
          </view>
        </view>

        <!-- ===== 主物料信息（当前加工/产出对象） ===== -->
        <view class="sap-section">
          <view class="section-title">🔖 主物料信息</view>
          <view class="sap-bound-info" v-show="mainMaterial || processedLot">
            <text class="highlight">
              {{ mainMaterial?.name || processedLot?.name }}
            </text>
            <text>{{ mainMaterial?.sap || processedLot?.sap }}</text>
            <text>{{ mainMaterial?.specification || processedLot?.lotNumber }}</text>
            <nut-button size="small" plain class="workbench-btn" @click="unbindMaterial">重新绑定</nut-button>
          </view>
          <text v-show="!(mainMaterial || processedLot)">
            请扫描主物料号
          </text>
        </view>

        <!-- ===== 统一扫码区 ===== -->
        <view class="scan-section">
          <view class="section-title">📷 扫描输入</view>
          <view class="scan-row">
            <nut-input ref="scanInputRef" v-model="scanCode" placeholder="扫描条码（SAP/LOT/SN）" class="workbench-input"
              @confirm="handleScan" />
            <nut-button v-show="mainMaterial?.id" type="primary" class="workbench-btn" @click="handleScan"
              :loading="loading">提交</nut-button>
          </view>
        </view>

        <template v-if="operation.operationType === 'Process'">
          <!-- ===== 辅料列表（仅 Process 类型） ===== -->
          <view class="card-section auxiliary-section">
            <view class="section-title">
              <text>📦 辅料消耗</text>
              <text class="item-count">{{ auxiliaryList.length }} 项</text>
            </view>
            <view v-if="auxiliaryList.length === 0" class="empty-tip">暂无辅料，请扫描添加</view>
            <view v-else class="material-list">
              <view v-for="(item, idx) in auxiliaryList" :key="idx" class="material-item">
                <view class="item-info">
                  <text class="item-name">{{ item.materialName }}({{ item.materialSap }})</text>
                  <text class="item-spc">{{ item.specification }}</text>
                  <text class="item-lot" v-if="item.lotNumber">批次：{{ item.lotNumber }}</text>
                  <text class="item-qty">×{{ item.quantity }}</text>
                </view>
                <view class="item-actions">
                  <nut-button size="small" type="danger" plain class="workbench-btn workbench-btn--table"
                    @click="removeAuxiliary(idx)">移除</nut-button>
                </view>
              </view>
            </view>
          </view>
          <!-- ===== 参数录入区 （仅 Process 类型且 isParameterRecordEnabled）===== -->
          <template v-if="operation.isParameterRecordEnabled">
            <view class="param-section" v-show="processedLot">
              <view class="section-title">📝 录入参数</view>
              <view class="param-form">
                <view v-for="def in operation.parameterDefinitions" :key="def.parameterName" class="param-item">
                  <text class="param-label">
                    {{ def.parameterName }}
                    <text v-if="def.isRequired" class="required-star">*</text>
                    <text v-if="def.unit" class="param-unit">({{ def.unit }})</text>
                    <text v-if="def.minValue !== null || def.maxValue !== null" class="param-range">
                      [{{ def.minValue ?? '无' }} ~ {{ def.maxValue ?? '无' }}]
                    </text>
                  </text>
                  <nut-input :type="def.parameterType === 'digit' ? 'digit' : 'text'"
                    v-model="paramValues[def.parameterName]" :placeholder="'请输入' + def.parameterName"
                    class="workbench-input" />
                </view>
              </view>
            </view>
          </template>
        </template>

        <!-- ===== 装配列表（仅 Assembly 类型） ===== -->
        <view v-if="operation.operationType === 'Assembly'" class="card-section component-section">
          <view class="section-title">
            <text>🔩 装配子件</text>
            <text class="item-count">{{ componentList.length }} 项</text>
          </view>
          <view v-show="componentList.length > 0" class="material-list">
            <view v-for="(item, idx) in componentList" :key="idx" class="material-item">
              <view class="item-info">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-sap">{{ item.sap }}</text>
                <text class="item-lot">批次/SN：{{ item.lotNumber }}</text>
              </view>
              <view class="item-actions">
                <nut-button size="small" type="danger" plain class="workbench-btn workbench-btn--table"
                  @click="removeComponent(idx)">移除</nut-button>
              </view>
            </view>
          </view>
        </view>



        <!-- ===== 提交按钮 ===== -->
        <view v-if="operation.operationType !== 'Produce'" class="action-section">
          <nut-button type="success" block class="workbench-btn" @click="submitRecord(false)">
            ✅ PASS
          </nut-button>
          <nut-button type="danger" block class="workbench-btn" @click="submitRecord(true)">
            ❌ NG
          </nut-button>
        </view>

        <!-- ===== 已处理列表 ===== -->
        <view v-if="operation.operationType === 'Produce'" class="history-section">
          <view class="section-title">
            <text>📋 近期记录</text>
            <text class="history-count">{{ historyRecords.length }} 条</text>
          </view>
          <view v-if="historyRecords.length === 0" class="empty-history">
            <text>暂无处理记录</text>
          </view>
          <view v-else class="history-list">
            <view v-for="record in historyRecords" :key="record.recordId" class="history-item">
              <view class="history-left">
                <text class="history-index">{{ record.name }}</text>
                <text class="history-lot">{{ record.lotNumber }}</text>
                <text class="history-result" :class="record.isAbnormal ? 'result-ng' : 'result-ok'">
                  {{ record.isAbnormal ? 'NG' : 'PASS' }}
                </text>
              </view>
              <view class="history-right">
                <text class="history-time">{{ new Date(record.endAt).toLocaleString() }}</text>
              </view>
            </view>
          </view>
        </view>

      </view>
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts" name="operate">
import { ref, onMounted, nextTick } from 'vue';
import Taro from '@tarojs/taro';
import NavBar from '@/components/NavBar.vue';
import TabbarLayout from '@/components/TabbarLayout.vue';
import type { WorkOrderOperationDefinition, Material, ProcessedLot } from '@/types/work-order';
import { getOperation } from '@/api/work-order/look-up';
import { getProducedLotByOperationId } from '@/api/record/look-up';
import { getMaterialBySap, createMaterialLot, scanLot, submitOperationRecord } from '@/api/prod';
import { ScannedLot } from '@/types/production';


let CurrentOperationId: string;

const loading = ref(true);
const scanInputRef = ref();

// 工序信息
const operation = ref<WorkOrderOperationDefinition | null>(null);

// 主物料信息
const mainMaterial = ref<Material | null>(null);
// 当前处理的LOT信息
const processedLot = ref<ScannedLot | null>(null);
// 扫描相关
const scanCode = ref('');
// 参数录入
const paramValues = ref<Record<string, string>>({});


interface AuxiliaryLot {
  materialName: string;
  materialSap: string;
  lotNumber: string;
  quantity: number;
  specification: string;
}

// （辅料/装配）列表
const auxiliaryList = ref<Array<AuxiliaryLot>>([]);

// 装配列表（Produce）
const componentList = ref<Array<ScannedLot>>([]);

// 已处理记录
const historyRecords = ref<Array<ProcessedLot>>([]);

// 统计数据
const totalCount = ref(0);

// 辅助函数
const typeLabel = (type: string) => {
  const map: Record<string, string> = { CELL: '电芯', MODULE: '模组', PACK: '电池包' };
  return map[type] || type;
};
const typeClass = (type: string) => {
  const map: Record<string, string> = { CELL: 'type-cell', MODULE: 'type-module', PACK: 'type-pack' };
  return map[type] || '';
};

/**
 * 获得输入框焦点
 */
const focusScanInput = () => {
  nextTick(() => {
    //降级-获取扫码框焦点
    setTimeout(() => {
      // console.log('unshift focus');
      scanInputRef.value.$refs.inputRef.focus();
    }, 500);
  });
};

/**
 * 解绑物料
 */
const unbindMaterial = () => {
  mainMaterial.value = null;
  processedLot.value = null;
  focusScanInput();
};

const removeComponent = (idx: number) => {
  componentList.value.splice(idx, 1);
};

/**
 * 处理扫码逻辑
 */
const handleScan = async () => {
  const code = scanCode.value.trim();
  if (!code) {
    Taro.showToast({ title: '请输入条码', icon: 'none', duration: 300 });
    return;
  }
  switch (operation.value!.operationType) {
    case 'Produce':
      await handleProduceScan(code);
      return
    case 'Process':
      await handleProcessScan(code);
      return;
    case 'Assembly':
      await handleAssemblyScan(code);
      return;
  }
};

/**
 * 产出（Produce）扫描流程
 * 1. 首次扫描 → 识别为 SAP → 绑定产出物料
 * 2. 第二次扫描 → 创建 LOT（作为主物料批次）
 * 3. 后续扫描 → 创建新 LOT（主物料批次）
 */
const handleProduceScan = async (code: string) => {
  // Step 1: 尝试作为SAP查询（查询物料SAP）
  if (!mainMaterial.value) {
    const material = await getMaterialBySap(code);
    mainMaterial.value = material;
    scanCode.value = '';
    return;
  }
  // Step 2: 尝试作为LOT查询（主物料批次）
  if (!processedLot.value) {
    // 直接使用 code 作为 LOT 号创建新 LOT
    var mat = await createMaterialLot(mainMaterial.value!.id, code, operation.value!.workOrderId);
    // 构造参数记录
    const parameters = {
      workOrderId: operation.value?.workOrderId,
      operationId: operation.value?.id,
      processedLotNumber: mat.lotNumber,
      isAbnormal: false // 可扩展校验逻辑
    };
    const record = await submitOperationRecord(parameters);
    historyRecords.value.unshift({
      recordId: record.id,
      lotId: record.processedLotNumber,
      name: mainMaterial.value.name,
      sap: mainMaterial.value.sap,
      specification: mainMaterial.value.specification,
      isAbnormal: false,
      endAt: record.recordAt,
      lotNumber: record.outputLotNumber
    });
    scanCode.value = '';
    totalCount.value++;
    return;
  }
}

// 扫描上下文（用于连续扫码）
const pendingAuxSap = ref<Material | null>(null);        // 暂存的辅料SAP

/**
 *1. 首次扫描 → 识别为 LOT → 绑定主物料
 *2. 后续扫描 → 辅料 LOT/SN（直接添加）
 */
const handleProcessScan = async (code: string) => {
  // Step 1: 绑定主物料 LOT
  if (!processedLot.value) {
    const lot = await scanLot(code, operation.value!.workOrderId);
    if (!lot) {
      Taro.showToast({ title: '未找到该条码对应的物料!', icon: 'error', duration: 1500 });
    }
    if (lot.availableOperations.length == 0) {
      Taro.showToast({ title: '无可进行工序!', icon: 'error', duration: 1500 });
      return;
    }
    if (lot.availableOperations.findIndex(op => op.operationId == CurrentOperationId) == -1) {
      const op = lot.availableOperations.find(i => !i.skipEnabled);
      Taro.showToast({ title: `待处理前置工序:${op?.operationName}!`, icon: 'error', duration: 1500 });
      return;
    }
    processedLot.value = lot;
    return;
  }

  if (!pendingAuxSap.value) {
    const material = await getMaterialBySap(code);
    if (!material) {
      Taro.showToast({ title: `未找料号:${code}，请核验BOM清单后重试！`, icon: 'error', duration: 1500 });
    }
    pendingAuxSap.value = material;
    Taro.showToast({ title: `获取辅料信息成功，请继续扫描批次码。`, duration: 1500 });
    return;
  }
  addAuxiliaryItem(pendingAuxSap.value, code);
  return;
  // Step 2: 添加辅料
};

/**
 *
 * 1. 首次扫描 → 识别为 SAP → 绑定产出父件批次物料
 * 2. 后续扫描 → 子件 LOT/SN（添加至装配列表）
 */
const handleAssemblyScan = async (code: string) => {
  const lot = await scanLot(code, operation.value!.workOrderId);
  if (!lot) {
    Taro.showToast({ title: '未找到该条码对应批次物料!', icon: 'error', duration: 1500 });
    return;
  }
  // Step 1: 绑定父件 SAP
  if (!processedLot.value) {
    processedLot.value = lot;
    return;
  }

  if (lot.status != 'Passed') {
    if (lot.status == 'Consumed') {
    }
    switch (lot.status) {
      case 'Consumed':
        Taro.showToast({ title: `${lot.name}（${lot.lotNumber}）已使用。`, icon: 'error', duration: 1500 });
        break;
      case 'Scrapped':
        Taro.showToast({ title: `${lot.name}（${lot.lotNumber}）已报废。`, icon: 'error', duration: 1500 });
        break;
      default:
        Taro.showToast({ title: `${lot.name}待加工。`, icon: 'error', duration: 1500 });
        break;
    }
    return;
  }
  addComponentItem(lot);
};

const addAuxiliaryItem = (mat: Material, lotNumber: string) => {
  // 查找是否已存在相同 sap 和 lot 的组合
  const existing = auxiliaryList.value.find(
    item => item.materialSap === mat.sap && item.lotNumber === lotNumber
  );
  if (existing) {
    existing.quantity++;
  } else {
    auxiliaryList.value.push({
      materialSap: mat.sap,
      materialName: mat.name,
      specification: mat.specification,
      lotNumber,
      quantity: 1
    });
  }
};

const removeAuxiliary = (index: number) => {
  auxiliaryList.value.splice(index, 1);
};

const addComponentItem = (lot: ScannedLot) => {
  // 检查是否已存在
  const existing = componentList.value.find(item => item.id == lot.id);
  if (!existing) {
    // 获取物料信息（通过查询 LOT）
    // 这里简化，实际应查询后得到名称和 SAP
    componentList.value.push(lot);
  }
};

const validateParameter = () => {
  const missingFields: string[] = [];
  if (operation.value && operation.value.isParameterRecordEnabled) {
    for (const def of operation.value.parameterDefinitions) {
      if (def.isRequired && !paramValues.value[def.parameterName]?.trim()) {
        missingFields.push(def.parameterName);
      }
    }
    if (missingFields.length) {
      Taro.showToast({ title: `请填写: ${missingFields.join('、')}`, icon: 'none' });
      return false;
    }
  }
  return true;
}

const submitRecord = async (isAbnormal: boolean) => {
  if (!operation.value) return;
  // 校验主物料是否存在
  if (!mainMaterial.value && !processedLot.value) {
    Taro.showToast({ title: '请先绑定主物料批次号', duration: 1000 });
    return;
  }
  if (operation.value.isParameterRecordEnabled && !validateParameter()) {
    return;
  }
  // 构造请求体
  const payload: any = {
    workOrderId: operation.value!.workOrderId,
    operationId: operation.value.id,
    processedLotNumber: processedLot.value?.lotNumber || '',
    parameters: operation.value.parameterDefinitions.map(def => ({
      parameterName: def.parameterName,
      value: paramValues.value[def.parameterName] || ''
    })),
    isAbnormal
  };

  // 添加辅料（Process）
  payload.materialUsages = auxiliaryList.value.map(item => ({
    lotNumber: item.lotNumber || '',
    quantity: item.quantity
  }));

  // 处理装配件
  payload.componentLotNumbers = componentList.value.map(item => item.lotNumber);

  // 调用API提交
  await submitOperationRecord(payload);
};



const backToList = () => {
  Taro.navigateTo({ url: '/pages/work/order-list' });
};

onMounted(async () => {
  const instance = Taro.getCurrentInstance();
  CurrentOperationId = instance?.router?.params?.operationId || '';
  if (!CurrentOperationId) {
    Taro.showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => backToList(), 1500);
    return;
  }
  loading.value = true;
  try {
    const [oprDef, processRecord] = await Promise.all([getOperation(CurrentOperationId), getProducedLotByOperationId(CurrentOperationId, { skipCount: 0, maxResultCount: 1 })]);
    operation.value = oprDef;
    totalCount.value = processRecord.totalCount;
    historyRecords.value = processRecord.items;
    if (oprDef.operationType == 'Produce' && !mainMaterial.value && processRecord.items.length > 0) {
      const processedLot = processRecord.items[0];
      mainMaterial.value = await getMaterialBySap(processedLot.sap);
      focusScanInput();
    };
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss">
@import './operate-execute.scss';
</style>
