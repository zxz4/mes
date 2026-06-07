<template>
  <view class="tabbar-layout">
    <!-- 页面内容插槽 -->
    <view class="layout-content">
      <slot />
    </view>
    <!-- 底部导航栏 -->
    <BottomTabBar />
  </view>
</template>

<script>
import BottomTabBar from './BottomTabBar.vue'

export default {
  name: 'TabbarLayout',
  components: { BottomTabBar },
  options: {
    addGlobalClass: true,
  },
}
</script>

<style lang="scss" scoped>
.tabbar-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .layout-content {
    flex: 1;
    padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
  }
}
</style>
