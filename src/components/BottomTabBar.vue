<template>
  <view class="bottom-tabbar">
    <view
      v-for="(item, index) in tabbarList"
      :key="index"
      class="tabbar-item"
      :class="{ active: selected === index }"
      @click="switchTab(item.pagePath, index)"
    >
      <IconFont
        :name="item.icon"
        size="24"
        class="tabbar-icon"
      />
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script lang="ts">
import { IconFont } from '@nutui/icons-vue-taro'
import { useTabbarStore } from '@/store/tabbar'
import { navigateTo } from '@tarojs/taro'
export default {
  name: 'BottomTabBar',
  components: { IconFont },
  options: {
    addGlobalClass: true,
  },
  data() {
    return {
      tabbarList: [
        {
          pagePath: '/pages/home/index',
          text: '首页',
          icon: 'home',
          // selectedIcon: 'home',
        },
        {
          pagePath: '/pages/work-order/order-list',
          text: '工单',
          icon: 'horizontal',
          // selectedIcon: 'horizontal',
        },
        {
          pagePath: '/pages/work-order/prod-process',
          text: '工序',
          icon: 'setting',
          // selectedIcon: 'setting-fill',
        },
        {
          pagePath: '/pages/home/profile',
          text: '我的',
          icon: 'my',
          // selectedIcon: 'user-fill',
        },
      ],
    }
  },
  computed: {
    selected() {
      return useTabbarStore().selected
    },
  },
  methods: {
    switchTab(url:string, index:number) {
      if (this.selected === index) return
      const store = useTabbarStore()
      store.setSelected(index)
      navigateTo({ url })
    },
  },
}
</script>

<style lang="scss" scoped>
.bottom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height:60rpx;        // 60px，与 navbar 高度一致
  background: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  border-top: 1px solid #eaeef2;
  z-index: 1000;

  .tabbar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;          // 图标与文字间距

    .tabbar-icon {
      width: 24rpx;      // 24px
      height: 24rpx;
      color: #999999;
    }
    .tabbar-text {
      font-size: 12rpx;
      color: #999999;
      line-height: 1.2;
    }

    &.active {
      .tabbar-icon {
        color: #2c68ff;
      }
      .tabbar-text {
        color: #2c68ff;
        font-weight: 500;
      }
    }
  }
}
</style>
