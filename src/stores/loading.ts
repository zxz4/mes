import { defineStore } from 'pinia';
import { ref } from 'vue';
import { hideLoading, showLoading } from '@tarojs/taro';

export const useLoadingStore = defineStore('loading', () => {
  let loadingCount = 0;
  // 只暴露一个响应式状态，按需使用
  const isLoading = ref(false);
  const startLoading = () => {
    if (loadingCount === 0) {
      isLoading.value = true;
      showLoading({ title: '加载中', mask: true });
    }
    loadingCount++;
  };

  const stopLoading = () => {
    if (loadingCount > 0) loadingCount--;
    if (loadingCount === 0) {
      isLoading.value = false;
      hideLoading();
    }
  };

  return {
    isLoading,
    startLoading,
    stopLoading
  };
});
