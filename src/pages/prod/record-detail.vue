<template>
  <view class="detail-page">
    <NavBar title="工序记录详情" :show-back="true" />

    <view v-if="!record" class="error-state">
      <nut-empty description="记录不存在" />
    </view>

    <view v-else class="detail-content">
      <!-- 顶部工序信息 -->
      <view class="header-card">
        <view class="header-top">
          <text class="op-code">{{ record.operationCode }}</text>
          <text class="op-divider">｜</text>
          <text class="op-name">{{ record.operationName }}</text>
        </view>
        <view class="header-bottom">
          <text class="time-text">{{ formatTime(record.recordAt) }}</text>
          <text class="result-tag" :class="record.isAbnormal ? 'tag-ng' : 'tag-pass'">
            {{ record.isAbnormal ? '不合格' : '合格' }}
          </text>
        </view>
      </view>

      <!-- 物料信息卡片 -->
      <view class="info-card" v-if="record.processLot">
        <view class="card-title">📦 物料信息</view>
        <view class="material-grid">
          <view class="material-primary">
            <text class="lot-number">{{ record.processLot.lotNumber }}</text>
            <text class="material-name">{{ record.processLot.name }}</text>
          </view>
          <view class="material-secondary">
            <view class="info-row">
              <text class="label">SAP</text>
              <text class="value mono">{{ record.processLot.sap }}</text>
            </view>
            <view class="info-row">
              <text class="label">规格</text>
              <text class="value">{{ record.processLot.specification || '—' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 参数卡片 -->
      <view class="info-card" v-if="record.parameters && record.parameters.length > 0">
        <view class="card-title">📝 工艺参数</view>
        <view class="param-list">
          <view v-for="(param, index) in record.parameters" :key="index" class="param-item">
            <view class="param-left">
              <view class="param-index">{{ index + 1 }}</view>
              <text class="param-name">{{ param.parameterName }}<text v-if="param.unit" class="param-unit"> ({{
                param.unit }})</text></text>
            </view>
            <text class="param-value" :class="record.isAbnormal ? 'value-ng' : 'value-normal'">
              {{ param.value }}
            </text>
          </view>
        </view>
      </view>

      <!-- 辅料使用卡片 -->
      <view class="info-card" v-if="record.materialUsages && record.materialUsages.length > 0">
        <view class="card-title">🧪 辅料消耗</view>
        <view class="usage-list">
          <view v-for="(material, index) in record.materialUsages" :key="index" class="usage-item">
            <view class="usage-left">
              <text class="usage-icon">🧴</text>
              <view class="usage-info">
                <text class="usage-name">{{ material.materialName || material.lotNumber }}</text>
                <text class="usage-sap mono">{{ material.materialSap || '—' }}</text>
              </view>
            </view>
            <view class="usage-right">
              <text class="batch-tag" v-if="material.lotNumber">{{ material.lotNumber }}</text>
              <text class="quantity-text">×{{ material.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 装配组件卡片 -->
      <view class="info-card" v-if="record.subComponents && record.subComponents.length > 0">
        <view class="card-title">🔧 装配组件</view>
        <view class="usage-list">
          <view v-for="(comp, index) in record.subComponents" :key="index" class="usage-item">
            <view class="usage-left">
              <text class="usage-icon">⚙️</text>
              <view class="usage-info">
                <text class="usage-name">{{ comp.materialName }}</text>
                <text class="usage-sap mono">{{ comp.materialSap }}</text>
              </view>
            </view>
            <view class="usage-right">
              <text class="batch-tag" v-if="comp.lotNumber">{{ comp.lotNumber }}</text>
              <text class="quantity-text" v-if="comp.quantity">×{{ comp.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-safe"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getCurrentInstance } from '@tarojs/taro';
import { getRecordDetail } from '@/apis/record/look-up';
import type { OperationRecord } from '@/types/work-order';

const loading = ref(true);
const record = ref<OperationRecord | null>(null);

onMounted(async () => {
  const instance = getCurrentInstance();
  const recordId = instance?.router?.params?.id || '';
  if (!recordId) {
    loading.value = false;
    return;
  }
  try {
    record.value = await getRecordDetail(recordId);
  } finally {
    loading.value = false;
  }
});

const formatTime = (isoStr: string) => {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString();
};
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f5f6f8;
}

.detail-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.loading-state,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

/* 头部工序卡片 */
.header-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.header-top {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
}

.op-code {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.op-divider {
  color: #d0d0d0;
  font-size: 16px;
  margin: 0 6px;
}

.op-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.header-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.time-text {
  font-size: 12px;
  color: #999;
}

.result-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.tag-pass {
  background: #e8f8ef;
  color: #2ca85c;
  border: 1px solid #bbf7d0;
}

.tag-ng {
  background: #fde8e4;
  color: #e8553d;
  border: 1px solid #fecaca;
}

/* 通用卡片 */
.info-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 14px;
}

/* 物料信息 */
.material-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.material-primary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lot-number {
  font-size: 20px;
  font-weight: 700;
  color: #2563eb;
  font-family: monospace;
  word-break: break-all;
}

.material-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.material-secondary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
}

.label {
  font-size: 13px;
  color: #888;
  width: 40px;
  flex-shrink: 0;
}

.value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex: 1;
}

.value.mono {
  font-family: monospace;
}

/* 参数列表 */
.param-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.param-item:last-child {
  border-bottom: none;
}

.param-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.param-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e8f0fe;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.param-name {
  font-size: 14px;
  color: #444;
}

.param-unit {
  font-size: 12px;
  color: #999;
  margin-left: 2px;
}

.param-value {
  font-size: 18px;
  font-weight: 700;
  font-family: monospace;
  padding-left: 12px;
}

.value-normal {
  color: #1a1a1a;
}

.value-ng {
  color: #e8553d;
}

/* 辅料/组件通用列表 */
.usage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.usage-item:last-child {
  border-bottom: none;
}

.usage-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.usage-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.usage-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.usage-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-sap {
  font-size: 11px;
  color: #888;
  font-family: monospace;
}

.usage-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.batch-tag {
  font-size: 11px;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
  color: #555;
  font-family: monospace;
}

.quantity-text {
  font-size: 15px;
  font-weight: 700;
  color: #2563eb;
}

.bottom-safe {
  height: 20px;
}
</style>
