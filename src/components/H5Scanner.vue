<template>
  <div class="scanner-core" id="qr-reader" ref="qrReaderRef"></div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';

const qrReaderRef = ref<HTMLElement | null>(null);
let html5QrCode: Html5Qrcode | null = null;

const emit = defineEmits<{
  (e: 'success', result: string): void;
  (e: 'error', err: any): void;
}>();

const startScan = async () => {
  if (!qrReaderRef.value) return;
  if (html5QrCode) await stopScan();

  try {
    html5QrCode = new Html5Qrcode('qr-reader');

    // 【关键步骤】获取容器实际宽度
    const containerWidth = qrReaderRef.value.clientWidth;
    const containerHeight = qrReaderRef.value.clientHeight;

    // 计算一个合理的扫描框大小（例如宽度的 80%，且不超过高度）
    const scanBoxSize = Math.min(containerWidth * 0.8, containerHeight * 0.8);

    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        // 【关键步骤】使用动态计算的尺寸
        qrbox: { width: scanBoxSize, height: scanBoxSize },
        aspectRatio: 1.0, // 强制视频流保持正方形比例，避免拉伸
      },
      (decodedText: string) => {
        emit('success', decodedText);
        stopScan();
      },
      (errorMessage: string) => {
        // ignore
      }
    );
  } catch (err) {
    emit('error', err);
  }
};


const stopScan = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      html5QrCode.clear();
      html5QrCode = null;
    } catch (err) { console.error(err); }
  }
};

defineExpose({ startScan, stopScan });
onBeforeUnmount(() => stopScan());
</script>

<style scoped>
.scanner-core {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  /* 关键：防止视频溢出 */
  background: #000;
}

/* 强制重置 html5-qrcode 内部元素样式 */
:deep(#reader__video_section) {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(video) {
  object-fit: cover !important;
  /* 保持比例填充，避免变形留白 */
  width: 100% !important;
  height: 100% !important;
}

/* 隐藏库自带的扫描框（因为我们要用自己的 UI 装饰） */
:deep(#reader__scan_region) {
  display: none !important;
}

:deep(#reader__dashboard_section_csr) {
  display: none !important;
}
</style>
