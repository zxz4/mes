<template>
  <TabbarLayout>
    <view class="workbench-page">
      <NavBar :title="`工序作业台`" :show-back="true" />

      <view v-if="!operation" class="error-state">
        <nut-empty description="工序不存在" />
        <nut-button type="primary" @click="backToOverview">返回工序列表</nut-button>
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
            <text>已完成：<text class="highlight">{{ completedCount }}</text> / {{ totalCount }}</text>
          </view>
        </view>

        <!-- ===== 1. SAP 绑定区（仅 Produce 类型） ===== -->
        <view v-if="operation.operationType === 'Produce'" class="sap-section">
          <view class="section-title">🔗 绑定产出物料（SAP）</view>
          <view v-if="!sapBound" class="sap-bind-form">
            <view class="sap-input-row">
              <nut-input v-model="sapInput" placeholder="请输入物料 SAP 码" @confirm="handleSapBind" class="sap-input" />
              <nut-button type="primary" @click="handleSapBind" :loading="sapLoading">查询并绑定</nut-button>
            </view>
            <view v-if="sapError" class="sap-error">
              <!-- <nut-icon name="warning" color="#f5222d" size="14" /> -->
              <text>{{ sapError }}</text>
            </view>
            <view v-if="sapQueryResult" class="sap-result">
              <text>物料名称：<text class="highlight">{{ sapQueryResult.name }}</text></text>
              <text>物料规格：{{ sapQueryResult.specification }}</text>
              <text>SAP：{{ sapQueryResult.sapCode }}</text>
              <nut-button size="small" type="success" @click="confirmSapBind">确认绑定</nut-button>
            </view>
          </view>
          <view v-else class="sap-bound-info">
            <!-- <nut-icon name="check-circle" color="#0ed57d" size="18" /> -->
            <text>已绑定物料：<text class="highlight">{{ boundMaterial?.name }}</text></text>
            <text>SAP：{{ boundMaterial?.sapCode }}</text>
            <text>规格：{{ boundMaterial?.specification }}</text>
            <nut-button size="small" plain @click="unbindSap">重新绑定</nut-button>
          </view>
        </view>

        <!-- ===== 2. 扫描区（Produce：创建LOT；Process：查询已有LOT） ===== -->
        <view class="scan-section" v-show="operation.operationType === 'Process' || sapBound">
          <view class="section-title">
            📷 扫描条码
          </view>
          <!-- 对于 Process 类型，直接显示扫描区，不依赖SAP绑定 -->
          <view class="scan-row">
            <nut-input ref="scanInputRef" v-model="scanCode" placeholder="扫描条码" :autofocus="true" @confirm="handleScan"
              class="scan-input" />
            <nut-button type="primary" @click="handleScan" :loading="scanning">
              扫描
            </nut-button>
          </view>

          <!-- 扫描结果 -->
          <view v-if="currentLot" class="scan-result">
            <view class="result-info">
              <text class="result-label">物料：</text>
              <text class="result-value">{{ currentLot.materialName }}</text>
              <text class="result-label">条码：</text>
              <text class="result-value highlight">{{ currentLot.lotNumber }}</text>
              <text class="result-label">状态：</text>
              <text class="result-status" :class="getLotStatusClass(currentLot.status)">
                {{ getLotStatusText(currentLot.status) }}
              </text>
              <text v-if="operation.operationType === 'Produce'" class="result-create-tip">✅ 新LOT已创建</text>
            </view>
            <view v-if="scanError" class="scan-error">
              <!-- <nut-icon name="warning" color="#f5222d" size="14" /> -->
              <text>{{ scanError }}</text>
            </view>
          </view>
        </view>

        <!-- ===== 3. 参数录入区 ===== -->
        <view class="param-section" v-show="currentLot && canRecord">
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
                v-model="paramValues[def.parameterName]" :placeholder="'请输入' + def.parameterName" class="param-input" />
            </view>
          </view>
          <view class="param-actions">
            <nut-button type="success" block :loading="submitting" @click="submitRecord">
              ✅ 提交记录
            </nut-button>
            <nut-button plain block @click="resetForm">重置</nut-button>
          </view>
        </view>

        <!-- ===== 4. 已处理列表 ===== -->
        <view class="history-section">
          <view class="section-title">
            <text>📋 已处理记录</text>
            <text class="history-count">{{ historyRecords.length }} 条</text>
          </view>
          <view v-if="historyRecords.length === 0" class="empty-history">
            <text>暂无处理记录</text>
          </view>
          <view v-else class="history-list">
            <view v-for="(record, idx) in historyRecords" :key="idx" class="history-item">
              <view class="history-left">
                <text class="history-index">{{ idx + 1 }}</text>
                <text class="history-lot">{{ record.lotNumber }}</text>
                <text class="history-result" :class="record.isAbnormal ? 'result-ng' : 'result-ok'">
                  {{ record.isAbnormal ? 'NG' : 'PASS' }}
                </text>
              </view>
              <view class="history-right">
                <text class="history-time">{{ formatTime(record.endAt) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts" name="operate">
import { ref, computed, onMounted, nextTick } from 'vue';
import Taro from '@tarojs/taro';
import NavBar from '@/components/NavBar.vue';
import TabbarLayout from '@/components/TabbarLayout.vue';
import type { WorkOrderOperationDefinition, Material, MaterialLot, OperationRecord, ParameterRecord } from '@/types/work-order';
import { getOperation } from '@/api/work-order/look-up';
import { getMaterialBySap, createMaterialLot, scanLot } from '@/api/prod'

// ========== 页面状态 ==========
const loading = ref(true);
const submitting = ref(false);
const scanning = ref(false);
const scanInputRef = ref();

// 工序信息
const operation = ref<WorkOrderOperationDefinition | null>(null);

// SAP 绑定
const sapBound = ref(false);
const sapInput = ref('');
const sapLoading = ref(false);
const sapError = ref('');
const sapQueryResult = ref<Material | null>(null);
const boundMaterial = ref<Material | null>(null);

// 扫描相关
const scanCode = ref('');
const currentLot = ref<MaterialLot | null>(null);
const scanError = ref('');

// 参数录入
const paramValues = ref<Record<string, string>>({});
const canRecord = computed(() => {
  if (!currentLot.value) return false;
  // 检查该物料是否已处理过此工序
  const existing = historyRecords.value.find(r => r.processedLotId === currentLot.value?.id);
  return !existing;
});

// 已处理记录
const historyRecords = ref<Array<{
  id: string;
  lotNumber: string;
  processedLotId: string;
  isAbnormal: boolean;
  endAt: string;
}>>([]);

// 统计数据
const totalCount = ref(0);
const completedCount = computed(() => historyRecords.value.length);

// ========== 辅助函数 ==========
const typeLabel = (type: string) => {
  const map: Record<string, string> = { CELL: '电芯', MODULE: '模组', PACK: '电池包' };
  return map[type] || type;
};
const typeClass = (type: string) => {
  const map: Record<string, string> = { CELL: 'type-cell', MODULE: 'type-module', PACK: 'type-pack' };
  return map[type] || '';
};
const getLotStatusText = (status: string) => {
  const map: Record<string, string> = { INPROCESS: '在制', PASSED: '通过', SCRAPPED: '报废', CONSUMED: '已消耗' };
  return map[status] || status;
};
const getLotStatusClass = (status: string) => {
  const map: Record<string, string> = { INPROCESS: 'status-inprocess', PASSED: 'status-passed', SCRAPPED: 'status-scrapped', CONSUMED: 'status-consumed' };
  return map[status] || '';
};
const formatTime = (timeStr: string) => {
  if (!timeStr) return '--';
  const d = new Date(timeStr);
  return d.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ========== SAP 绑定逻辑 ==========
const handleSapBind = async () => {
  const sap = sapInput.value.trim();
  if (!sap) {
    Taro.showToast({ title: '请输入SAP码', icon: 'none' });
    return;
  }
  sapLoading.value = true;
  sapError.value = '';
  sapQueryResult.value = null;
  try {
    const material = await getMaterialBySap(sap);
    if (!material) {
      sapError.value = '未找到该SAP对应的物料，请核验BOM清单后重试';
      return;
    }
    // 检查物料类型是否匹配工序适用类型
    if (operation.value && material.materialType !== operation.value.applicableMaterialType) {
      sapError.value = `物料类型 (${typeLabel(material.materialType)}) 与工序适用类型 (${typeLabel(operation.value.applicableMaterialType)}) 不匹配`;
      return;
    }
    sapQueryResult.value = material;
    Taro.showToast({ title: '物料信息查询成功，请确认绑定', icon: 'success' });
  } catch (err) {
    sapError.value = '查询失败，请重试';
  } finally {
    sapLoading.value = false;
  }
};

const confirmSapBind = () => {
  if (!sapQueryResult.value) return;
  boundMaterial.value = sapQueryResult.value;
  sapBound.value = true;
  sapQueryResult.value = null;
  sapInput.value = '';
  nextTick(() => {
    // scanInputRef.value?.focus();
    console.log(scanInputRef.value.$refs.inputRef.focus);
    scanInputRef.value.$refs.inputRef.focus();
  });
};

const unbindSap = () => {
  sapBound.value = false;
  boundMaterial.value = null;
  currentLot.value = null;
  scanCode.value = '';
  scanError.value = '';
  paramValues.value = {};
};

// ========== 扫描逻辑（增加 SAP 校验） ==========
const handleScan = async () => {
  const code = scanCode.value.trim();
  if (!code) {
    Taro.showToast({ title: '请输入条码', icon: 'none' });
    return;
  }
  // 如果是 Produce 类型，必须已绑定SAP
  if (operation.value?.operationType === 'Produce' && !sapBound.value) {
    Taro.showToast({ title: '请先绑定 SAP', icon: 'none' });
    return;
  }

  scanning.value = true;
  scanError.value = '';
  try {
    let lot: MaterialLot | null = null;
    if (operation.value?.operationType === 'Produce') {
      // ----- 产出模式：创建新LOT -----
      if (!boundMaterial.value) {
        scanError.value = '未绑定物料，请先绑定 SAP';
        currentLot.value = null;
        return;
      }
      // 调用 createMaterialLot，传入物料ID和条码号
      lot = await createMaterialLot(
        boundMaterial.value.id,
        code,
        operation.value.workOrderId
      );
      if (!lot) {
        scanError.value = '创建LOT失败，请确认条码是否重复';
        currentLot.value = null;
        return;
      }
      // 补充物料名称（从 boundMaterial 获取）
      lot.materialName = boundMaterial.value.name;
    } else {
      // ----- 加工模式：查询已有LOT -----
      lot = await scanLot(code, operation.value!.id);
      if (!lot) {
        scanError.value = '未找到该条码，请确认后重试';
        currentLot.value = null;
        return;
      }
    }
    // 校验该物料是否已处理过此工序
    const existing = historyRecords.value.find(r => r.processedLotId === lot.id);
    if (existing) {
      scanError.value = '该物料已处理，不可重复录入';
      currentLot.value = null;
      return;
    }
    currentLot.value = lot;
    scanError.value = '';
  } catch (err: any) {
    scanError.value = err.message || '操作失败，请重试';
  } finally {
    scanning.value = false;
  }
};

// ========== 提交参数记录 ==========
const submitRecord = async () => {
  if (!currentLot.value || !operation.value) return;
  // 校验必填参数
  const missingFields: string[] = [];
  for (const def of operation.value.parameterDefinitions) {
    if (def.isRequired && !paramValues.value[def.parameterName]?.trim()) {
      missingFields.push(def.parameterName);
    }
  }
  if (missingFields.length) {
    Taro.showToast({ title: `请填写: ${missingFields.join('、')}`, icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    // 构造参数记录
    const parameters: ParameterRecord[] = operation.value.parameterDefinitions.map(def => ({
      parameterName: def.parameterName,
      unit: def.unit || '',
      value: paramValues.value[def.parameterName] || null,
      isAbnormal: false // 可扩展校验逻辑
    }));
    // 调用API保存记录
    const record = await mockSubmitRecord({
      workOrderId: operation.value!.workOrderId,
      operationId: operation.value!.id,
      processedLotId: currentLot.value!.id,
      parameters,
      isAbmoral: false
    });
    // 添加到历史记录
    historyRecords.value.unshift({
      id: record.id,
      lotNumber: currentLot.value!.lotNumber,
      processedLotId: currentLot.value!.id,
      isAbnormal: record.isAbmoral,
      endAt: record.endAt
    });
    Taro.showToast({ title: '记录已保存', icon: 'success' });
    // 重置表单（保持SAP绑定）
    resetForm();
    // 焦点回到扫描框
    await nextTick();
    scanInputRef.value?.focus();
  } catch (err) {
    Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

// 重置表单（不清除SAP绑定）
const resetForm = () => {
  currentLot.value = null;
  scanCode.value = '';
  scanError.value = '';
  paramValues.value = {};
};

// ========== 模拟数据（实际替换为真实 API） ==========
const mockSubmitRecord = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    id: `REC-${Date.now()}`,
    ...data,
    endAt: new Date().toISOString(),
    isAbmoral: false
  };
};

// ========== 跳转 ==========
const backToOverview = () => {
  Taro.navigateBack();
};
// ========== 加载数据 ==========
const loadData = async () => {
  const instance = Taro.getCurrentInstance();
  const operationId = instance?.router?.params?.operationId || '';
  if (!operationId) {
    Taro.showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => backToOverview(), 1500);
    return;
  }
  loading.value = true;
  try {
    //实际调用API获取工序定义
    operation.value = await getOperation(operationId);
    totalCount.value = 2; // 模拟应处理数量
    // 模拟已处理记录
    historyRecords.value = [
      { id: 'REC-1003', lotNumber: 'CELL-001', processedLotId: 'LOT-CELL-001', isAbnormal: false, endAt: new Date().toISOString() }
    ];
  } catch (err) {
    console.error('加载工序失败:', err);
    Taro.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
@import './operate-execute.scss';
</style>
