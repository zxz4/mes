<template>
  <nav class="nav-bar">
    <IconFont name="rect-left" size="18"></IconFont>
    <span class="nav-title">{{ title }}</span>
    </nav>
</template>
<script setup lang="ts" name="NavBar">

import { IconFont } from '@nutui/icons-vue-taro'
// import { ref } from 'vue';

// const title = ref('生产领料');

const props = defineProps<{
  title: string
}>()

</script>
<style type="css">
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
      box-shadow: var(--shadow-sm);
      border-bottom: 1px solid var(--border);
    }
    .nav-back {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: none;
      background: #fff;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #333;
      transition: background 0.15s;
    }
    .nav-back:active { background: #e1e4e8; }
    .nav-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--text-primary);
      letter-spacing: 0.3px;
    }
    /* .nav-badge {
      margin-left: auto;
      font-size: 11px;
      background: #e6f7ff;
      color: var(--blue);
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 0.2px;
      border: 1px solid #bae7ff;
    } */
</style>
