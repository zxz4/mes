<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="scanner-modal">
        <!-- 背景遮罩 -->
        <div class="modal-bg" @click="handleClose"></div>

        <!-- 扫码内容区 -->
        <div class="modal-content">
          <div class="header">
            <span>扫描条码</span>
            <i class="close-icon" @click="handleClose">✕</i>
          </div>

          <div class="scanner-box">
            <H5ScannerCore ref="scannerRef" @success="handleSuccess" @error="handleError" />
            <!-- 扫描框装饰角标 -->
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
            <div class="scan-line"></div>
          </div>

          <p class="tip">将二维码放入框内，即可自动扫描</p>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import H5ScannerCore from './H5Scanner.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void; (e: 'success', result: string): void }>();

const scannerRef = ref<InstanceType<typeof H5ScannerCore> | null>(null);

// 监听 visible 变化，启动/停止扫描
const handleVisibleChange = async (newVal: boolean) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'; // 禁止背景滚动
    await nextTick();
    scannerRef.value?.startScan();
  } else {
    document.body.style.overflow = '';
    scannerRef.value?.stopScan();
  }
};

// 简单 watch 实现（Vue3 中也可用 watchEffect）
import { watch } from 'vue';
watch(() => props.visible, handleVisibleChange);

const handleClose = () => emit('update:visible', false);
const handleError = (err: any) => console.error(err);
const handleSuccess = (res: string) => {
  emit('success', res);
  handleClose();
};
</script>

<style scoped>
.scanner-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
}

.modal-content {
  position: relative;
  width: 90vw;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  color: white;
  margin-bottom: 20px;
  font-size: 16px;
}

.close-icon {
  font-size: 24px;
  cursor: pointer;
}

.scanner-box {
  position: relative;
  width: 100%;
  /* 关键：使用 aspect-ratio 确保容器始终是正方形，与视频流比例一致 */
  aspect-ratio: 1 / 1;
  background: transparent;
  /* 背景透明，透出下面的视频 */
  z-index: 10;
  /* 确保装饰层在视频之上 */
}

/* 装饰角标示例 */
.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #3b82f6;
  border-style: solid;
  border-width: 0;
  z-index: 20;
}

.top-left {
  top: 0;
  left: 0;
  border-top-width: 4px;
  border-left-width: 4px;
}

.top-right {
  top: 0;
  right: 0;
  border-top-width: 4px;
  border-right-width: 4px;
}

.bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-width: 4px;
  border-left-width: 4px;
}

.bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-width: 4px;
  border-right-width: 4px;
}

.scan-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: #3b82f6;
  animation: scan 2s infinite linear;
  box-shadow: 0 0 4px #3b82f6;
}

@keyframes scan {
  0% {
    top: 0;
  }

  50% {
    top: 100%;
  }

  100% {
    top: 0;
  }
}

.tip {
  color: rgba(255, 255, 255, 0.7);
  margin-top: 15px;
  font-size: 12px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
