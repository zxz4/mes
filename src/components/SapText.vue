<!-- components/SapText.vue -->
<template>
  <text class="sap-text" :class="customClass" @click.stop="goToBom">
    {{ sap }}
  </text>
</template>

<script setup lang="ts">
import { navigateTo } from '@tarojs/taro';

const props = defineProps<{
  sap: string;
  customClass?: string;
}>();

const goToBom = () => {
  if (!props.sap) return;
  navigateTo({
    url: `/pages/bom-view?sap=${props.sap}`,
  });
};
</script>

<style scoped>
.sap-text {
  font-size: 14px;
  color: #2563eb;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.sap-text:active {
  opacity: 0.7;
}
</style>
