<template>
  <view class="prod-trace-page">
    <NavBar title="生产追踪" />

    <!-- 搜索栏 -->
    <view class="search-wrapper">
      <view class="search-input-wrap">
        <nut-input class="search-input" type="text" placeholder="输入项目编号 / SAP" />
      </view>
      <view class="scan-icon" @click="scanCode">
        <IconFont name="scan2" size="16" />
      </view>
      <nut-button type="info" shape="square" :loading="isLoading" class="search-btn">
        追溯
      </nut-button>
    </view>

    <!-- 产品列表（自然滚动，无加载提示） -->
    <view class="product-list">
      <ProductCard v-for="prod in prodList" :key="prod.batchNo" :product="prod" @click="handleProductClick(prod)" />
      <!-- 哨兵元素，用于触发加载更多（无文字提示） -->
      <view v-if="hasMore" class="load-trigger"></view>
    </view>

    <!-- NutUI Popup 弹窗：展示选中的产品详情 -->
    <nut-popup v-model:visible="showDetailPopup" position="bottom" :style="{ height: '100%' }" :round="false" closeable
      close-icon-position="top-right" class="full-screen-popup">
      <view class="popup-content" v-if="selectedProduct">
        <view class="product-info-header">
          <view class="product-name">{{ selectedProduct.productName }}</view>
          <view class="product-meta">批次号：{{ selectedProduct.batchNo }}</view>
          <view class="product-meta">SAP物料号：{{ selectedProduct.sap }}</view>
        </view>
        <ProgressOverview :steps="currentSteps" />
        <view class="timeline-section">
          <view class="timeline-title">完整工序追溯链路</view>
          <ul class="timeline-list">
            <TimelineItem v-for="(step, idx) in currentSteps" :key="step.id" :step="step" :index="idx"
              :line-class="getLineClass(step.status, idx)" />
          </ul>
        </view>
      </view>
    </nut-popup>
  </view>
</template>

<script setup lang="ts" name="ProdTrace">
import { ref, onMounted, onUnmounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import ProductCard from '@/components/ProductCard.vue'
import ProgressOverview from '@/components/ProgressOverview.vue'
import TimelineItem from '@/components/TimelineItem.vue'
import { IconFont } from '@nutui/icons-vue-taro'
import type { ProductInfo, Step } from '@/types/prod-trace'

// ---------- 模拟产品数据（首屏） ----------
const prodList = ref<ProductInfo[]>([
  {
    productName: 'PT043D-280-R2.1',
    sap: '91071573',
    batchNo: '91071573-A001',
    productCode: 'LF280K-V3',
    spec: '1P48S',
    status: 'done'
  },
  {
    productName: 'PT043D-280-R2.1',
    sap: '91071573',
    batchNo: '91071573-A002',
    productCode: 'LF280K-V3',
    spec: '1P48S',
    status: 'abnormal'
  },
  {
    productName: 'PT043D-280-R2.1',
    sap: '91071573',
    batchNo: '91071573-A003',
    productCode: 'LF280K-V3',
    spec: '1P48S',
    status: 'processing'
  }
])

// 分页状态（无加载提示）
const hasMore = ref(true)
let observer: IntersectionObserver | null = null

// 模拟异步加载更多
const loadMore = async () => {
  if (!hasMore.value) return
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  // 最多两页演示
  if (prodList.value.length < 6) {
    const newProducts: ProductInfo[] = []
    for (let i = 1; i <= 2; i++) {
      newProducts.push({
        productName: `模拟产品${prodList.value.length + i}`,
        sap: '91071573',
        batchNo: `BATCH-${prodList.value.length + i}`,
        productCode: 'LF280K-V3',
        spec: '1P48S',
        status: 'processing'
      })
    }
    prodList.value.push(...newProducts)
  } else {
    hasMore.value = false
  }
}

// 监听哨兵元素，实现滚动加载
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value) {
        loadMore()
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px 100px 0px' }
  )
  const trigger = document.querySelector('.load-trigger')
  if (trigger) observer.observe(trigger)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// ---------- Popup 相关 ----------
const showDetailPopup = ref(false)
const selectedProduct = ref<ProductInfo | null>(null)
const currentSteps = ref<Step[]>([])

// 工序数据映射（模拟不同产品的工序）
const stepsMap = new Map<string, Step[]>()

const defaultSteps: Step[] = [
  {
    id: 1,
    stepName: '短板加工',
    status: 'completed',
    startTime: '2026-05-25 08:30',
    endTime: '2026-05-25 09:15',
    operator: '王鹏',
    station: '149872',
    hasAnomaly: false,
    params: [{ name: '外观检查', value: '合格', unit: '', isAbnormal: false }],
    inspection: '端板尺寸全检合格，外观无异常',
    anomalyRecords: []
  },
  {
    id: 2,
    stepName: '电芯三合一检测',
    status: 'completed',
    startTime: '2026-05-25 10:15',
    endTime: '2026-05-25 12:40',
    operator: '王小鹏',
    equipment: 'STP-105',
    equipmentName: '电芯检测仪',
    station: '119872',
    hasAnomaly: false,
    params: [],
    inspection: '电芯性能指标全检合格',
    anomalyRecords: []
  },
  {
    id: 3,
    stepName: 'CSS组装',
    status: 'completed',
    startTime: '2026-05-26 09:30',
    endTime: '2026-05-26 11:45',
    operator: '陈晓明',
    equipment: 'ASM-056',
    equipmentName: '自动组装机',
    station: '52345',
    hasAnomaly: true,
    params: [{ name: '洁净', value: '脏污', unit: '', isAbnormal: true }],
    inspection: '工艺人员现场排查，发现极柱表面有轻微赃污。已打磨处理。',
    anomalyRecords: [{
      time: '2026-05-26 10:15',
      action: '打磨处理',
      result: '已处理',
      description: 'CSS组装过程会存在极柱表面赃污情况'
    }]
  },
  {
    id: 4,
    stepName: '激光焊接',
    status: 'in-progress',
    startTime: null,
    endTime: null,
    operator: null,
    equipment: 'TST-089',
    equipmentName: '半自动激光焊接平台',
    station: '',
    hasAnomaly: false,
    params: [],
    inspection: null,
    anomalyRecords: []
  },
  {
    id: 5,
    stepName: '模组EOL测试',
    status: 'pending',
    startTime: null,
    endTime: null,
    operator: null,
    equipment: 'PKG-012',
    equipmentName: '模组自动测试机',
    station: 'PKG-STN-07',
    hasAnomaly: false,
    params: [],
    inspection: null,
    anomalyRecords: []
  }
]

stepsMap.set('91071573-A001', defaultSteps)
stepsMap.set('91071573-A002', defaultSteps.map(s => ({ ...s, status: 'pending' })))
stepsMap.set('91071573-A003', defaultSteps.map(s => ({ ...s, status: 'anomaly' })))
// 为模拟加载的新增产品也设置默认工序
stepsMap.set('BATCH-5', defaultSteps)
stepsMap.set('BATCH-6', defaultSteps)

const handleProductClick = (product: ProductInfo) => {
  selectedProduct.value = product
  currentSteps.value = stepsMap.get(product.batchNo) || defaultSteps
  showDetailPopup.value = true
}

// 扫码模拟
const isLoading = ref(false)
const scanCode = () => {
  setTimeout(() => {
    alert('扫码结果: 91071573-A003')
  }, 500)
}

// 工序连线样式类
const getLineClass = (status: Step['status'], idx: number) => {
  const activeIndex = currentSteps.value.findIndex(s => s.status === 'in-progress')
  if (activeIndex !== -1 && idx > activeIndex && status === 'pending') {
    return 'line-none'
  }
  if (status === 'completed') return 'line-done'
  if (status === 'in-progress' || status === 'anomaly') return 'line-active'
  return 'line-pending'
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.prod-trace-page {
  min-height: 100vh;
  background-color: $tp-help;
  padding-bottom: 30px;
}

/* 搜索栏 */
.search-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: $tp-white;
  border-radius: $tp-radius-base;
  padding: 5px;
  box-shadow: $tp-shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin: 12px 16px;
  min-height: 44px;
  flex-shrink: 0;

  .search-input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    background: $tp-help;
    border-radius: 10px;
    height: 100%;

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: $font-size-2;
      color: $tp-title;
      padding: 0;
      line-height: 1.5;
    }

    .search-input::placeholder {
      color: $tp-disable;
    }
  }

  .scan-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: $tp-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $tp-text;
    transition: background 0.15s;

    &:active {
      background: $tp-help;
    }
  }

  .search-btn {
    flex-shrink: 0;
    padding: 11px 22px;
    border-radius: 10px;
    font-size: $font-size-2;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 6px rgba($tp-primary, 0.3);
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:active {
      opacity: 0.82;
      transform: scale(0.97);
    }
  }
}

/* 产品列表 - 自然滚动 */
.product-list {
  margin: 0 16px;
}

.load-trigger {
  height: 20px;
  margin: 10px 0;
  // 完全透明，无任何提示
}

// 全屏弹窗样式
.full-screen-popup {
  // 确保弹窗容器占满
  .nut-popup {
    height: 100% !important;
    max-height: 100% !important;
    border-radius: 0 !important;
  }

  // 隐藏弹窗内部滚动条（内容区域滚动）
  .popup-content {
    height: 100%;
    overflow-y: auto;
    // 隐藏滚动条（WebKit）
    &::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE/Edge
  }
}

/* Popup 内容样式 */
.popup-content {
  background: $tp-white;
  border-radius: 16px 16px 0 0;
  padding: 20px 16px 30px;
  overflow-y: auto;
  max-height: 80vh;
}

.product-info-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.product-name {
  font-size: $font-size-4;
  font-weight: 600;
  color: $tp-title;
  margin-bottom: 8px;
}

.product-meta {
  font-size: $font-size-2;
  color: $tp-text;
  margin-top: 4px;
}

.timeline-section {
  margin-top: 16px;
}

.timeline-title {
  font-size: $font-size-3;
  font-weight: 700;
  color: $tp-title;
  padding: 14px 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1.5px solid $tp-help;
  margin-bottom: 6px;

  &::before {
    content: '';
    width: 4px;
    height: 18px;
    background: $tp-primary;
    border-radius: 3px;
  }
}

.timeline-list {
  list-style: none;
  position: relative;
}

// 隐藏 Popup 内部滚动条（可选）
:deep(.nut-popup) {
  &::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }

  scrollbar-width: none;
}
</style>
