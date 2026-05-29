<template>
  <view class="timeline-detail">
    <view class="detail-grid" :class="{ 'single-col': !hasParams }">
      <view v-if="step.equipment" class="detail-kv">
        <span class="detail-k">设备编号</span>
        <span class="detail-v">{{ step.equipment }}</span>
      </view>
      <view v-if="step.equipmentName" class="detail-kv">
        <span class="detail-k">设备名称</span>
        <span class="detail-v">{{ step.equipmentName }}</span>
      </view>
      <view class="detail-kv">
        <span class="detail-k">操作人员</span>
        <span class="detail-v">{{ step.operator || '--' }}</span>
      </view>
      <view class="detail-kv">
        <span class="detail-k">工位号</span>
        <span class="detail-v">{{ step.station || '--' }}</span>
      </view>
      <view class="detail-kv">
        <span class="detail-k">开始时间</span>
        <span class="detail-v">{{ step.startTime || '--' }}</span>
      </view>
      <view class="detail-kv">
        <span class="detail-k">结束时间</span>
        <span class="detail-v">{{ step.endTime || '进行中...' }}</span>
      </view>
    </view>

    <!-- 工艺参数 -->
    <view v-if="step.params && step.params.length > 0" class="params-section">
      <view v-for="p in step.params" :key="p.name" class="param-row">
        <span class="param-name">{{ p.name }}</span>
        <span class="param-value" :class="{ abnormal: p.isAbnormal }">
          <span v-if="p.isAbnormal" class="warn-icon">⚠</span>
          {{ p.value }} {{ p.unit }}
        </span>
      </view>
    </view>

    <!-- 检验结果 -->
    <view v-if="step.inspection" class="inspection-badge">
      ✅ 检验结果：{{ step.inspection }}
    </view>

    <!-- 异常记录 -->
    <view v-if="step.anomalyRecords && step.anomalyRecords.length > 0">
      <view v-for="(rec, ri) in step.anomalyRecords" :key="ri" class="anomaly-record">
        <view class="anomaly-record-title">🚨 异常记录 #{{ ri + 1 }}</view>
        <view class="anomaly-record-desc">
          {{ rec.time }} — {{ rec.description }}
          <br />处理措施：{{ rec.action }}
          <br />处理结果：{{ rec.result }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts" name="TimelineDetail">
import { computed } from 'vue'
import type { Step } from '@/types/prod-trace'

const props = defineProps<{
  step: Step
}>()

const hasParams = computed(() => props.step.params && props.step.params.length > 0)
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
.timeline-detail {
  margin-top: 10px;
  background: $tp-help;
  border-radius: 10px;
  padding: 13px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  animation: detailIn 0.3s ease;
}

@keyframes detailIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px 16px;

  &.single-col {
    grid-template-columns: 1fr;
  }
}

.detail-kv {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-k {
  font-size: 11px;
  color: $tp-text;
}

.detail-v {
  font-size: 13px;
  font-weight: 500;
  color: $tp-title;
}

.params-section {
  margin-top: 12px;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
  font-size: 12px;
}

.param-name {
  color: $tp-text;
}

.param-value {
  font-weight: 600;
  color: $tp-title;

  &.abnormal {
    color: $tp-danger;
  }

  .warn-icon {
    font-size: 10px;
    margin-right: 4px;
  }
}

.inspection-badge {
  margin-top: 10px;
  padding: 7px 10px;
  background: rgba($tp-success, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: $tp-success;
  font-weight: 500;
  border-left: 3px solid $tp-success;
}

.anomaly-record {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba($tp-danger, 0.1);
  border-radius: 8px;
  border-left: 3px solid $tp-danger;
}

.anomaly-record-title {
  font-size: 12px;
  font-weight: 700;
  color: $tp-danger;
  margin-bottom: 4px;
}

.anomaly-record-desc {
  font-size: 11px;
  color: $tp-danger;
  line-height: 1.6;
}
</style>
