<template>
  <view class="step-indicator">
    <view v-for="(step, index) in steps" :key="step.key || index" class="step-item" :class="{
      'step-active': step.status === 'active',
      'step-done': step.status === 'done',
      'step-optional': step.optional,
    }">
      <view class="step-dot">
        <text v-show="step.status === 'done'">✓</text>
        <text v-show="step.status !== 'done'">{{ index + 1 }}</text>
      </view>
      <text class="step-label">
        {{ step.label }}
        <text v-show="step.optional" class="optional-tag">(选填)</text>
      </text>
      <view v-show="index < steps.length - 1" class="step-line" :class="{ 'line-done': step.status === 'done' }"></view>
    </view>
  </view>
</template>

<script setup lang="ts" name="StepIndicator">
export interface StepItem {
  key?: string;      // 唯一标识（可选）
  label: string;     // 步骤名称
  status: 'pending' | 'active' | 'done'; // 状态
  optional?: boolean; // 是否选填
}
defineProps<{
  steps: StepItem[];
}>();
</script>

<style type="scss">
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
}

.step-done .step-dot {
  background: #2ca85c;
  color: #fff;
}

.step-label {
  font-size: 14px;
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

.step-optional .step-dot {
  border: 1.5px dashed #ccc;
}

.optional-tag {
  font-size: 10px;
  color: #999;
  margin-left: 2px;
}
</style>
