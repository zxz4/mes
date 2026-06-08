<template>
  <TabbarLayout>
    <view class="home-content">
      <!-- 页面原有内容 -->
       首页
    </view>
  </TabbarLayout>
</template>

<script lang="ts">
import TabbarLayout from '@/components/TabbarLayout.vue'
import { useTabbarStore } from '@/store/tabbar'

export default {
  components: { TabbarLayout },
  onShow() {
    useTabbarStore().setSelected(0)
  },
}
</script>

<style lang="scss" scoped>
.home-content {
  // 页面内容样式
}
</style>
