<template>
  <TabbarLayout>
    <view class="profile-content">
      <!-- 页面原有内容 -->
       个人中心
    </view>
  </TabbarLayout>
</template>

<script lang="ts">
import TabbarLayout from '@/components/TabbarLayout.vue'
import { useTabbarStore } from '@/store/tabbar'

export default {
  components: { TabbarLayout },
  onShow() {
    useTabbarStore().setSelected(3)
  },
}
</script>

<style lang="scss" scoped>
.profile-content {
  // 页面内容样式
}
</style>
