<template>
  <TabbarLayout>
    <view class="workbench-page">
      <NavBar :title="'工序作业台'" :show-back="true" />

      <!-- ========== 工序不存在 ========== -->
      <view v-if="!currentOperation" class="error-state">
        <nut-empty description="工序不存在" />
        <nut-button type="primary" class="workbench-btn" @click="backToList">
          返回工序列表
        </nut-button>
      </view>

      <!-- ========== 正常作业区 ========== -->
      <view v-else class="workbench-content">
        <!-- 工序信息头部（紧凑卡片） -->
        <view class="operation-header-card">
          <view class="header-top">
            <view class="header-left">
              <text class="op-code">{{ currentOperation.operationCode }}</text>
              <text class="op-divider">｜</text>
              <text class="op-name">{{ currentOperation.operationName }}</text>
            </view>
            <view class="header-right">
              <text class="op-type-tag" :class="typeClass(currentOperation.applicableMaterialType)">
                {{ typeLabel(currentOperation.applicableMaterialType) }}
              </text>
              <text v-if="currentOperation.skipEnabled" class="op-optional-tag">可选工序</text>
            </view>
          </view>
          <view class="header-bottom">
            <text class="stats-label">已处理</text>
            <text class="stats-value">{{ totalCount }}</text>
            <text class="stats-unit">件</text>
          </view>
        </view>

        <!-- ===== 步骤指示器 ===== -->
        <view class="step-indicator">
          <view class="step-item" :class="{ 'step-active': !mainMaterial, 'step-done': mainMaterial }">
            <view class="step-dot">
              <text v-if="mainMaterial">✓</text>
              <text v-else>1</text>
            </view>
            <text class="step-label">绑定主物料</text>
            <view class="step-line" :class="{ 'line-done': mainMaterial }"></view>
          </view>
          <view class="step-item" :class="{ 'step-active': mainMaterial, 'step-done': false }">
            <view class="step-dot">
              <text>2</text>
            </view>
            <text class="step-label">扫描SN/批次</text>
          </view>
        </view>

        <!-- ===== 主物料信息卡片 ===== -->
        <view class="material-card" v-show="mainMaterial">
          <view class="material-card-header">
            <view class="material-status-dot"></view>
            <text class="material-card-title">已绑定主物料</text>
            <nut-button size="mini" plain type="default" class="unbind-btn" @click="mainMaterial = null">
              解绑
            </nut-button>
          </view>
          <view class="material-card-body">
            <view class="material-info-row">
              <text class="material-label">物料名称</text>
              <text class="material-value highlight">
                {{ mainMaterial?.name }}
              </text>
            </view>
            <view class="material-info-row">
              <text class="material-label">SAP码</text>
              <text class="material-value mono">
                {{ mainMaterial?.sap }}
              </text>
            </view>
            <view class="material-info-row">
              <text class="material-label">规格</text>
              <text class="material-value">
                {{ mainMaterial?.specification }}
              </text>
            </view>
          </view>
        </view>

        <!-- ===== 未绑定主物料提示 ===== -->
        <view class="material-placeholder" v-show="!mainMaterial">
          <view class="placeholder-icon">📱</view>
          <text class="placeholder-title">尚未绑定主物料</text>
          <text class="placeholder-desc">请在下方扫描主物料条码进行绑定</text>
        </view>

        <!-- ===== 扫码输入区 ===== -->
        <view class="scan-section-card">
          <view class="scan-section-header">
            <text class="scan-section-title">
              {{ (mainMaterial) ? '📷 扫描物料SN码' : '📷 扫描主物料SAP码' }}
            </text>
            <text v-if="(mainMaterial) && scanCode" class="scan-ready-badge">
              待提交
            </text>
          </view>

          <!-- 输入行 -->
          <view class="scan-input-row">
            <view class="scan-input-wrapper">
              <nut-input ref="scanInputRef" v-model="scanCode"
                :placeholder="mainMaterial ? '请扫描或输入物料SN码...' : '请扫描或输入主物料SAP码...'" class="scan-input" clearable
                @confirm="handleScan" @clear="scanCode = ''">
                <template #left>
                  <IconFont name="scan2" color="#999" @click="showScanner = true" />
                </template>
              </nut-input>
            </view>
            <nut-button v-if="mainMaterial" type="primary" class="submit-btn" :loading="loading"
              :disabled="!scanCode.trim()" @click="handleScan">
              提交
            </nut-button>
            <nut-button v-else type="primary" class="submit-btn" :loading="loading" :disabled="!scanCode.trim()"
              @click="handleScan">
              绑定
            </nut-button>
          </view>

          <!-- 快捷提示 -->
          <view class="scan-hint">
            <text v-show="!mainMaterial">
              💡 扫描枪输入后自动确认，也可手动输入后点击「绑定」
            </text>
            <text v-show="mainMaterial">
              💡 扫描SN/批次后点击「提交」保存记录，可连续扫描
            </text>
          </view>
        </view>

        <!-- ===== 近期记录（仅生产工序） ===== -->
        <view class="history-section">
          <view class="history-header">
            <view class="history-title-row">
              <text class="history-title">📋 近期处理记录</text>
              <text class="history-count-badge">{{ historyRecords.length }} 条</text>
            </view>
            <!-- <view v-if="historyRecords.length > 0" class="history-summary">
              <text class="summary-pass">
                合格 <text class="summary-num">{{ passCount }}</text>
              </text>
              <text class="summary-ng">
                异常 <text class="summary-num">{{ ngCount }}</text>
              </text>
            </view> -->
          </view>

          <!-- 空状态 -->
          <view v-show="historyRecords.length === 0" class="history-empty">
            <text class="empty-icon">📭</text>
            <text class="empty-text">暂无处理记录</text>
            <text class="empty-sub">扫描SN并提交后，记录将显示在此处</text>
          </view>

          <!-- 记录列表 -->
          <view v-show="historyRecords.length > 0" class="history-list">
            <view v-for="(record, index) in historyRecords" :key="record.recordId || index" class="history-item">
              <view class="history-item-left">
                <!-- :class="record.isAbnormal ? 'dot-ng' : 'dot-pass'" -->
                <view class="history-status-dot dot-pass"></view>
                <view class="history-item-info">
                  <text class="history-item-name">{{ record.name }}</text>
                  <text class="history-item-lot">{{ record.lotNumber }}</text>
                </view>
              </view>
              <view class="history-item-right">
                <text class="history-result-tag tag-pass">
                  CREATED
                </text>
                <text class="history-time">{{ new Date(record.endAt).toLocaleString() }}</text>
              </view>
            </view>
          </view>

          <!-- 查看更多 -->
          <view v-if="totalCount > historyRecords.length" class="history-more">
            <nut-button size="small" plain type="default" @click="loadMoreHistory">
              加载更多记录
            </nut-button>
          </view>
        </view>

        <!-- 底部安全距离 -->
        <view class="bottom-safe-area"></view>
      </view>
    </view>
  </TabbarLayout>
  <ScannerModal v-model:visible="showScanner" @success="onScanSuccess" />
</template>

<script lang="ts" name="Produce" setup>
import { ref, onMounted, nextTick } from 'vue';
import TabbarLayout from '@/components/TabbarLayout.vue';
import type { WorkOrderOperationDefinition, Material, ProcessedLot } from '@/types/work-order';
import { navigateTo, showToast, getCurrentInstance } from '@tarojs/taro';
import { getMaterialBySap, submitOperationRecord } from '@/api/prod';
import { getOperation } from '@/api/work-order/look-up';
import { getProducedLotByOperationId } from '@/api/record/look-up';
import { IconFont } from '@nutui/icons-vue-taro';

import ScannerModal from '@/components/ScannerModal.vue';
const showScanner = ref(false);
const onScanSuccess = (result: string) => {
  scanCode.value = result;
  handleScan();
};


// 分页页码
let maxResultCount = 5;
// 加载状态
const loading = ref(true);
// 扫码框
const scanInputRef = ref();
// 工序信息
const currentOperation = ref<WorkOrderOperationDefinition | null>(null);
// 主物料信息
const mainMaterial = ref<Material | null>(null);
// 扫码相关
const scanCode = ref('');

type HistoryLot = Omit<ProcessedLot, 'lotId' | 'sap' | 'specification'>;

// 已处理记录
const historyRecords = ref<Array<HistoryLot>>([]);
// 统计数据
const totalCount = ref(0);


// 样式辅助函数
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

// 返回列表
const backToList = () => {
  navigateTo({ url: '/pages/work/order-list' });
};

/**
 * 处理扫码逻辑
 */
const handleScan = async () => {

  const code = scanCode.value?.trim();

  if (!code) {
    showToast({ title: '请输入条码', icon: 'none', duration: 300 });
    return;
  }
  // Step 1: 尝试作为SAP查询（查询物料SAP）
  if (!mainMaterial.value) {
    const material = await getMaterialBySap(code);
    scanCode.value = '';
    if (!material) {
      showToast({ title: '无法获得该料号信息，请核验BOMS清单', icon: 'error' });
      return;
    }

    mainMaterial.value = material;
    return;
  }

  // Step 2: 提交记录
  const para = {
    workOrderId: currentOperation.value?.workOrderId,
    operationId: currentOperation.value?.id,
    processedLotNumber: code,
    sap: mainMaterial.value.sap,
    name: mainMaterial.value.name,
    specification: mainMaterial.value.specification,
    isAbnormal: false // 可扩展校验逻辑
  };
  const record = await submitOperationRecord(para);
  scanCode.value = '';
  totalCount.value++;
  historyRecords.value.unshift({
    recordId: record.id,
    endAt: record.recordAt,
    name: mainMaterial.value.name,
    lotNumber: code,
    isAbnormal: false
  });
}

/**
 * 加载历史
 */
const loadMoreHistory = async () => {
  if (totalCount.value > historyRecords.value.length) {
    const data = await getProducedLotByOperationId(currentOperation.value!.id, {
      skipCount: historyRecords.value.length,
      maxResultCount
    });
    historyRecords.value.splice(historyRecords.value.length, 0, ...data.items);
  }
}

onMounted(async () => {
  const instance = getCurrentInstance();
  // 工序id
  const currentOperationId = instance?.router?.params?.operationId || instance?.router?.params?.id || '';
  if (!currentOperationId) {
    showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => backToList(), 1500);
    return;
  }
  loading.value = true;
  try {
    const [oprDef, processRecord] = await Promise.all([getOperation(currentOperationId), getProducedLotByOperationId(currentOperationId, { skipCount: 0, maxResultCount })]);
    currentOperation.value = oprDef;
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
})
</script>

<style scoped>
/* ========== 页面整体 ========== */
.workbench-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

.workbench-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ========== 工序信息头部卡片 ========== */
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
  letter-spacing: 0.5px;
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
  letter-spacing: 0.5px;
}

.type-cell {
  background: #e8f4fd;
  color: #2b7de9;
}

.type-module {
  background: #fef3e2;
  color: #e8942c;
}

.type-pack {
  background: #e8f8ef;
  color: #2ca85c;
}

.type-default {
  background: #f0f0f0;
  color: #666;
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
  font-size: 22px;
  font-weight: 700;
  color: #2b7de9;
  line-height: 1;
}

.stats-unit {
  font-size: 12px;
  color: #999;
}

/* ========== 步骤指示器 ========== */
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
  background: #2b7de9;
  color: #fff;
  box-shadow: 0 2px 8px rgba(43, 125, 233, 0.35);
  animation: pulse-dot 2s infinite;
}

.step-done .step-dot {
  background: #2ca85c;
  color: #fff;
}

@keyframes pulse-dot {

  0%,
  100% {
    box-shadow: 0 2px 8px rgba(43, 125, 233, 0.35);
  }

  50% {
    box-shadow: 0 2px 18px rgba(43, 125, 233, 0.55);
  }
}

.step-label {
  font-size: 13px;
  color: #999;
  font-weight: 500;
  white-space: nowrap;
}

.step-active .step-label {
  color: #2b7de9;
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

/* ========== 主物料卡片 ========== */
.material-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  border-left: 4px solid #2ca85c;
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
  background: #2ca85c;
  animation: blink-dot 1.5s infinite;
}

@keyframes blink-dot {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.material-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #2ca85c;
  flex: 1;
}

.unbind-btn {
  font-size: 11px;
  padding: 2px 10px;
  height: auto;
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
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  letter-spacing: 0.5px;
}

/* ========== 未绑定主物料占位 ========== */
.material-placeholder {
  background: #fff;
  border-radius: 14px;
  padding: 28px 16px;
  text-align: center;
  border: 2px dashed #d0d5dd;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.placeholder-icon {
  font-size: 36px;
  margin-bottom: 4px;
}

.placeholder-title {
  font-size: 15px;
  font-weight: 600;
  color: #555;
}

.placeholder-desc {
  font-size: 12px;
  color: #aaa;
}

/* ========== 扫码输入卡片 ========== */
.scan-section-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.scan-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.scan-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.scan-ready-badge {
  font-size: 11px;
  background: #fef3e2;
  color: #e8942c;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  animation: fade-in-out 1.5s infinite;
}

@keyframes fade-in-out {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
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
  transition: border-color 0.2s;
}

.scan-input:focus-within {
  border-color: #2b7de9;
  background: #fff;
}

.submit-btn {
  flex-shrink: 0;
  min-width: 72px;
  height: 44px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1px;
}

.scan-hint {
  margin-top: 8px;
  font-size: 11px;
  color: #bbb;
  line-height: 1.5;
}

/* ========== 历史记录区 ========== */
.history-section {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.history-header {
  margin-bottom: 10px;
}

.history-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.history-count-badge {
  font-size: 11px;
  background: #f0f0f0;
  color: #888;
  padding: 2px 10px;
  border-radius: 12px;
}

.history-summary {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
}

.summary-pass {
  color: #2ca85c;
}

.summary-ng {
  color: #e8553d;
}

.summary-num {
  font-weight: 700;
  font-size: 15px;
  margin-left: 2px;
}

/* 空状态 */
.history-empty {
  text-align: center;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.empty-icon {
  font-size: 32px;
}

.empty-text {
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.empty-sub {
  font-size: 11px;
  color: #bbb;
}

/* 记录列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafbfc;
  border-radius: 10px;
  gap: 8px;
}

.history-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.history-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-pass {
  background: #2ca85c;
}

.dot-ng {
  background: #e8553d;
}

.history-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.history-item-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-lot {
  font-size: 11px;
  color: #999;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}

.history-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

.history-result-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.tag-pass {
  background: #e8f8ef;
  color: #2ca85c;
}

.tag-ng {
  background: #fde8e4;
  color: #e8553d;
}

.history-time {
  font-size: 10px;
  color: #bbb;
}

.history-more {
  text-align: center;
  margin-top: 10px;
}

/* ========== 错误状态 ========== */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 80px;
  gap: 16px;
}

/* ========== 底部安全距离 ========== */
.bottom-safe-area {
  height: 20px;
}

/* ========== 通用按钮微调 ========== */
.workbench-btn {
  border-radius: 10px;
  font-weight: 500;
}
</style>
