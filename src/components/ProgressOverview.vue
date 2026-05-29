<template>
  <view class="progress-section">
    <view class="progress-header">
      <span class="progress-label">工序完成进度</span>
      <span class="progress-percent">{{ completedCount }} / {{ totalSteps }} 道</span>
    </view>
    <view class="progress-bar-outer">
      <nut-progress :percentage="percent" :show-text="false" stroke-color="blue" />
    </view>
    <view class="progress-stats">
      <span><span class="dot green"></span>已完成 {{ doneCount }}</span>
      <span><span class="dot blue"></span>进行中 {{ activeCount }}</span>
      <span><span class="dot red"></span>异常 {{ anomalyCount }}</span>
      <span><span class="dot gray"></span>待处理 {{ pendingCount }}</span>
    </view>
  </view>
</template>

<script setup lang="ts" name="ProgressOverview">
import { computed } from 'vue'
import type { Step } from '@/types/prod-trace'

const props = defineProps<{
  steps: Step[]
}>()

const doneCount = computed(() => props.steps.filter(s => s.status === 'completed').length)
const activeCount = computed(() => props.steps.filter(s => s.status === 'in-progress').length)
const anomalyCount = computed(() => props.steps.filter(s => s.status === 'anomaly').length)
const pendingCount = computed(() => props.steps.filter(s => s.status === 'pending').length)
const totalSteps = computed(() => props.steps.length)
const completedCount = computed(() => doneCount.value + anomalyCount.value)
const percent = computed(() => Math.round((completedCount.value / totalSteps.value) * 100) || 0)
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.progress-section {
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 17px 18px;
  box-shadow: $tp-shadow-sm;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 12px;
  color: $tp-text;
  font-weight: 600;
}

.progress-percent {
  font-size: 16px;
  font-weight: 800;
  color: $tp-primary;
}

.progress-bar-outer {
  height: 8px;
  background: $tp-help;
  border-radius: 10px;
  overflow: hidden;
}

.progress-stats {
  display: flex;
  gap: 18px;
  margin-top: 11px;
  font-size: 12px;
  color: $tp-text;
  flex-wrap: wrap;

  span {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;

  &.green { background: $tp-success; }
  &.blue { background: $tp-primary; }
  &.red { background: $tp-danger; }
  &.gray { background: $tp-disable; }
}
</style>
