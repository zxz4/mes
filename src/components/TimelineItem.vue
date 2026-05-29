<template>
  <li class="timeline-node" @click="toggle">
    <view class="timeline-line-col" :class="lineClass">
      <view class="timeline-dot" :class="step.status">
        <view v-if="step.status === 'completed'">✓</view>
        <view v-else-if="step.status === 'in-progress'">●</view>
        <view v-else-if="step.status === 'anomaly'">!</view>
        <view v-else>○</view>
      </view>
    </view>

    <view class="timeline-content">
      <view class="timeline-step-header">
        <span class="step-name-group">
          <span class="step-name">{{ index + 1 }}. {{ step.stepName }}</span>
          <view v-if="step.hasAnomaly" class="anomaly-flag-inline">⚠ 含异常记录</view>
        </span>
        <span class="expand-icon" :class="{ open: isExpanded }">▼</span>
      </view>
      <view class="step-subtitle">
        <span>🕘 {{ step.startTime || '--' }}</span>
        <span v-if="step.endTime"> → {{ step.endTime }}</span>
        <span>👤 {{ step.operator || '--' }}</span>
      </view>

      <TimelineDetail v-if="isExpanded" :step="step" />
    </view>
  </li>
</template>

<script setup lang="ts" name="TimelineItem">
import { ref } from 'vue'
import TimelineDetail from './TimelineDetail.vue'
import type { Step } from '@/types/prod-trace'

const props = defineProps<{
  step: Step
  index: number
  lineClass: string
}>()

const isExpanded = ref(false)
const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';
.timeline-node {
  display: flex;
  gap: 13px;
  cursor: pointer;
  position: relative;
  padding: 4px 0;

  &:active .timeline-dot {
    transform: scale(1.18);
  }
}

.timeline-line-col {
  position: relative;
  width: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    position: absolute;
    top: -5px;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 2.5px;
    z-index: 1;
    border-radius: 2px;
  }

  &.line-done::after {
    background: $tp-success;
  }

  &.line-active::after {
    background: linear-gradient(to bottom, $tp-success 0%, $tp-primary 60%, $tp-help 100%);
  }

  &.line-pending::after {
    background: repeating-linear-gradient(to bottom, $tp-disable 0px, $tp-disable 4px, transparent 4px, transparent 8px);
  }

  &.line-none::after {
    display: none;
  }
}

.timeline-dot {
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  z-index: 2;
  transition: transform 0.25s, box-shadow 0.25s;
  font-weight: 800;
  background: $tp-white;

  &.completed {
    border: 3px solid $tp-success;
    color: $tp-success;
  }

  &.in-progress {
    border: 3px solid $tp-primary;
    color: $tp-primary;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  &.anomaly {
    border: 3px solid $tp-danger;
    color: $tp-danger;
  }

  &.pending {
    border: 3px solid $tp-disable;
    color: $tp-disable;
  }
}

@keyframes pulse-dot {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba($tp-primary, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba($tp-primary, 0);
  }
}

.timeline-content {
  flex: 1;
  padding: 3px 0 14px;
  min-width: 0;
}

.timeline-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.step-name {
  font-size: 15px;
  font-weight: 600;
  color: $tp-title;
}

.step-name-group {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.anomaly-flag-inline {
  font-size: 11px;
  color: $tp-danger;
  background: rgba($tp-danger, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
  margin-left: 5px;
}

.step-subtitle {
  font-size: 12px;
  color: $tp-text;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  span {
    white-space: nowrap;
  }
}

.expand-icon {
  font-size: 12px;
  color: $tp-text;
  transition: transform 0.3s ease;
  flex-shrink: 0;

  &.open {
    transform: rotate(180deg);
  }
}
</style>
