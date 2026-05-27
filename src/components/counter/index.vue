<template>
  <div class="counter-wrapper" :class="{ 'is-readonly': readonly }">
    <!-- 减号按钮 -->
    <button
      type="button"
      class="counter-btn minus-btn"
      :disabled="readonly || modelValue <= min"
      @click="handleDecrease"
      aria-label="Decrease quantity"
    >
      <!-- 假设 IconFont 是全局注册的组件，如果未注册，请替换为实际图标实现 -->
      <IconFont name="minus" size="13" />
    </button>

    <!-- 数值显示区域 -->
    <div class="counter-value">
      {{ displayValue }}
    </div>

    <!-- 加号按钮 -->
    <button
      type="button"
      class="counter-btn plus-btn"
      :disabled="readonly || modelValue >= max"
      @click="handleIncrease"
      aria-label="Increase quantity"
    >
      <!-- 假设 IconFont 是全局注册的组件 -->
      <IconFont name="plus" size="13" />
    </button>
  </div>
</template>

<script setup lang="ts" name="Counter">
import { computed } from 'vue';

// 定义 Props
interface CounterProps {
  modelValue: number; // v-model 绑定的值
  min?: number;       // 最小值
  max?: number;       // 最大值
  readonly?: boolean; // 是否只读
  step?: number;      // 步长
}

const props = withDefaults(defineProps<CounterProps>(), {
  min: 0,
  max: Infinity,
  readonly: false,
  step: 1
});

// 定义 Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

// 计算显示值，确保即使在外部传入非法值时也能正确显示边界值
const displayValue = computed(() => {
  let val = props.modelValue;
  if (val < props.min) val = props.min;
  if (val > props.max) val = props.max;
  return val;
});

// 减少数量
const handleDecrease = () => {
  if (props.readonly) return;

  const newValue = props.modelValue - props.step;
  if (newValue >= props.min) {
    emit('update:modelValue', newValue);
  } else {
    // 如果低于最小值，强制设为最小值（可选策略，也可以不发射）
    emit('update:modelValue', props.min);
  }
};

// 增加数量
const handleIncrease = () => {
  if (props.readonly) return;

  const newValue = props.modelValue + props.step;
  if (newValue <= props.max) {
    emit('update:modelValue', newValue);
  } else {
    // 如果超过最大值，强制设为最大值
    emit('update:modelValue', props.max);
  }
};
</script>

<style scoped>
.counter-wrapper {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
  transition: all 0.3s;
}

.counter-wrapper.is-readonly {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f7fa;
}

.counter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #606266;
  transition: background-color 0.2s, color 0.2s;
  padding: 0;
}

.counter-btn:hover:not(:disabled) {
  background-color: #f5f7fa;
  color: #409eff;
}

.counter-btn:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  background-color: transparent;
}

.counter-value {
  width: 40px;
  text-align: center;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  user-select: none;
}

/* 可选：添加聚焦样式以提升无障碍体验 */
.counter-btn:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: -2px;
}
</style>
