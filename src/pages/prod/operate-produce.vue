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
          <view class="step-item" :class="{ 'step-active': !scannedMaterial, 'step-done': scannedMaterial }">
            <view class="step-dot">
              <text v-if="scannedMaterial">✓</text>
              <text v-else>1</text>
            </view>
            <text class="step-label">绑定主物料</text>
            <view class="step-line" :class="{ 'line-done': scannedMaterial }"></view>
          </view>
          <view class="step-item" :class="{ 'step-active': scannedMaterial, 'step-done': false }">
            <view class="step-dot">
              <text>2</text>
            </view>
            <text class="step-label">扫描SN/批次</text>
          </view>
        </view>

        <!-- ===== 主物料信息卡片 ===== -->
        <view class="material-card" v-show="scannedMaterial">
          <view class="material-card-header">
            <view class="material-status-dot"></view>
            <text class="material-card-title">已绑定主物料</text>
            <nut-button size="mini" plain type="default" class="unbind-btn" @click="scannedMaterial = null">
              解绑
            </nut-button>
          </view>
          <view class="material-card-body">
            <view class="material-info-row">
              <text class="material-label">物料名称</text>
              <text class="material-value highlight">
                {{ scannedMaterial?.name }}
              </text>
            </view>
            <view class="material-info-row">
              <text class="material-label">SAP码</text>
              <text class="material-value mono">
                {{ scannedMaterial?.sap }}
              </text>
            </view>
            <view class="material-info-row">
              <text class="material-label">规格</text>
              <text class="material-value">
                {{ scannedMaterial?.specification }}
              </text>
            </view>
          </view>
        </view>

        <!-- ===== 未绑定主物料提示 ===== -->
        <view class="material-placeholder" v-show="!scannedMaterial">
          <view class="placeholder-icon">📱</view>
          <text class="placeholder-title">尚未绑定主物料</text>
          <text class="placeholder-desc">请在下方扫描主物料条码进行绑定</text>
        </view>

        <!-- ===== 扫码输入区 ===== -->
        <view class="scan-section-card">
          <view class="scan-section-header">
            <text class="scan-section-title">
              {{ (scannedMaterial) ? '📷 扫描物料SN码' : '📷 扫描主物料SAP码' }}
            </text>
            <text v-if="(scannedMaterial) && scanCode" class="scan-ready-badge">
              待提交
            </text>
          </view>

          <!-- 输入行 -->
          <view class="scan-input-row">
            <view class="scan-input-wrapper">
              <nut-input ref="scanInputRef" v-model="scanCode"
                :placeholder="scannedMaterial ? '请扫描或输入物料SN码...' : '请扫描或输入主物料SAP码...'" class="scan-input" clearable
                @confirm="handleScan" @clear="scanCode = ''">
                <template #left>
                  <IconFont name="scan2" color="#999" @click="showScanner = true" />
                </template>
              </nut-input>
            </view>
            <nut-button v-if="scannedMaterial" type="primary" class="submit-btn" :loading="loading"
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
            <text v-show="!scannedMaterial">
              💡 扫描枪输入后自动确认，也可手动输入后点击「绑定」
            </text>
            <text v-show="scannedMaterial">
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
                <text class="history-result-tag" :class="record.status != 'Scrapped' ? 'tag-pass' : 'tag-ng'">
                  {{ statusLabel(record.status) }}
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
import { getProductStatusText } from '@/util/statusText';

import ScannerModal from '@/components/ScannerModal.vue';
const showScanner = ref(false);
const onScanSuccess = (result: string) => {
  scanCode.value = result;
  handleScan();
};

const statusLabel = (status: string) => {
  return getProductStatusText(status);
}

// 分页页码
let maxResultCount = 5;
// 加载状态
const loading = ref(true);
// 扫码框
const scanInputRef = ref();
// 工序信息
const currentOperation = ref<WorkOrderOperationDefinition | null>(null);
// 主物料信息
const scannedMaterial = ref<Material | null>(null);
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
  navigateTo({ url: '/pages/work/list-page' });
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
  if (!scannedMaterial.value) {
    const material = await getMaterialBySap(code);
    scanCode.value = '';
    if (!material) {
      showToast({ title: '无法获得该料号信息，请核验BOMS清单', icon: 'error' });
      return;
    }

    scannedMaterial.value = material;
    return;
  }

  // Step 2: 提交记录
  const para = {
    workOrderId: currentOperation.value?.workOrderId,
    operationId: currentOperation.value?.id,
    processedLotNumber: code,
    sap: scannedMaterial.value.sap,
    name: scannedMaterial.value.name,
    specification: scannedMaterial.value.specification,
    isAbnormal: false // 可扩展校验逻辑
  };
  const record = await submitOperationRecord(para);
  scanCode.value = '';
  totalCount.value++;
  historyRecords.value.unshift({
    recordId: record.id,
    endAt: record.recordAt,
    name: scannedMaterial.value.name,
    lotNumber: code,
    isAbnormal: false,
    status: 'Created',
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
    if (oprDef.operationType == 'Produce' && !scannedMaterial.value && processRecord.items.length > 0) {
      const processedLot = processRecord.items[0];
      scannedMaterial.value = await getMaterialBySap(processedLot.sap);
      focusScanInput();
    };
  } finally {
    loading.value = false;
  }
})
</script>

<style>
@import "./operate-produce.css";
</style>
