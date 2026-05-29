<template>
<nav class="nav-bar">
  <view class="nav-back">        <!-- 添加包裹容器 -->
    <IconFont name="rect-left" size="18"></IconFont>
  </view>
  <span class="nav-title">{{ title }}</span>
</nav>
</template>
<script setup lang="ts" name="NavBar">

import { IconFont } from '@nutui/icons-vue-taro'
// import { ref } from 'vue';

const props = defineProps<{
  title: string
}>()

</script>
<style lang="scss" scoped>
    /* ===== 顶部导航 ===== */
    .nav-bar {
      position: static;
      top: 0;
      z-index: 100;
      background: #fff;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);            // 保留：NutUI 无阴影变量
      border-bottom: 1px solid $help-color;    // 替换 #e8ecf1
    }
    .nav-back {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: none;
      background: #fff;
      font-size: $font-size-4;                 // 18px
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: $title-color;                     // 替换 #333
      transition: background 0.15s;
    }
    .nav-back:active {
      background: #e6e6e6;     // #f5f5f5 加深6% ≈ #e6e6e6，替换 #e1e4e8
    }
    .nav-title {
      font-size: $font-size-4;                 // 18px
      font-weight: 500;
      color: $title-color;                     // 替换 #1a1a2e
      letter-spacing: 0.3px;
    }
</style>
