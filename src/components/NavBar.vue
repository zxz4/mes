<template>
  <nav class="nav-bar">
    <view class="nav-back" @click="handleBack"> <!-- 添加包裹容器 -->
      <IconFont name="rect-left" size="18"></IconFont>
    </view>
    <span class="nav-title">{{ title }}</span>
  </nav>
</template>
<script setup lang="ts" name="NavBar">

import { IconFont } from '@nutui/icons-vue-taro'
import { navigateBack } from '@tarojs/taro'
// import { ref } from 'vue';

const props = defineProps<{
  title: string
}>()

const handleBack = () => {
  navigateBack()
}

</script>
<style lang="scss" scoped>
/* ===== 顶部导航 ===== */
.nav-bar {
  position: static;
  top: 0;
  z-index: 100;
  background: $white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid $help-color;
}

.nav-back {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: $white;
  font-size: $font-size-4; // 18px
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: $title-color;
  transition: background 0.15s;
}

.nav-back:active {
  background: rgba(0, 0, 0, 0.05); // 科技主题无直接深色变量，使用半透明叠加
}

.nav-title {
  font-size: $font-size-4; // 18px
  font-weight: 500;
  color: $title-color;
  letter-spacing: 0.3px;
}
</style>
