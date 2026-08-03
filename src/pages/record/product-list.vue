<template>
  <TabbarLayout>
    <view class="product-list-page">
      <NavBar :title="'产品追溯'" :show-back="true" />

      <!-- 搜索栏 -->
      <view class="search-bar">
        <nut-searchbar v-model="filterKeyword" placeholder="搜索产品名称/SAP/批次号" @change="onSearchChange"
          @clear="onSearchClear" />
      </view>

      <!-- 状态筛选 -->
      <view class="status-filter">
        <view v-for="status in statusOptions" :key="status.value" class="filter-tag"
          :class="{ 'tag-active': currentStatus === status.value }" @click="switchStatus(status.value)">
          {{ status.label }}
        </view>
      </view>

      <!-- 产品列表 -->
      <view class="list-container">

        <view v-if="list.length === 0" class="empty-state">
          <nut-empty description="暂无产品" />
        </view>

        <view v-else class="product-list">
          <view v-for="product in list" :key="product.id" class="product-card" @click="goToTrace(product.id)">
            <view class="card-header">
              <view class="header-left">
                <text class="product-name">{{ product.name }}</text>
                <text class="product-sap">{{ product.sap }}</text>
              </view>
              <text class="status-badge" :class="statusClass(product.status)">
                {{ statusLabel(product.status) }}
              </text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="info-label">批次号</text>
                <text class="info-value highlight">{{ product.lotNumber }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">物料类型</text>
                <text class="info-value">{{ typeLabel(product.materialType) }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">规格</text>
                <text class="info-value">{{ product.specification || 0 }}</text>
              </view>
            </view>

            <view class="card-footer">
              <text class="enter-text">查看追溯详情</text>
              <text class="enter-arrow">→</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="list.length > 0" class="load-section">
          <nut-button v-if="hasMore" :loading="loading" plain size="small" @click="loadMore">
            加载更多
          </nut-button>
          <text v-else class="no-more">没有更多了</text>
        </view>
      </view>

      <view class="bottom-safe-area"></view>
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { navigateTo } from '@tarojs/taro';
import { getProductList } from '@/apis/prod'; // 需根据实际路径调整
import type { Product } from '@/types/work-order';
import { getProductStatusText } from '@/utils/statusText';
// 搜索筛选
const filterKeyword = ref('');
const currentStatus = ref('');
const statusOptions = [
  { label: '全部', value: '' },
  { label: '已完工', value: 'Passed' },
  { label: '已装配', value: 'Consumed' },
  { label: '已报废', value: 'Scrapped' },
];

// 分页
let pageSize = 10;
let pageIndex = 1;
let totalCount = 0;

const list = ref<Product[]>([]);
const loading = ref(false);
const hasMore = computed(() => list.value.length < totalCount);

onMounted(() => {
  fetchData(true);
});

const fetchData = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;

  if (reset) {
    pageIndex = 1;
    list.value = [];
  }

  const skipCount = (pageIndex - 1) * pageSize;
  try {
    // TODO: 替换为真实API调用
    const res = await getProductList({
      filter: filterKeyword.value || undefined,
      status: currentStatus.value || undefined,
      skipCount,
      maxResultCount: pageSize,
    });

    if (reset) {
      list.value = res.items;
    } else {
      list.value.push(...res.items);
    }
    totalCount = res.totalCount;
  } catch (error) {
    console.error('获取产品列表失败', error);
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  pageIndex++;
  fetchData(false);
};

// 状态切换
const switchStatus = (status: string) => {
  if (currentStatus.value === status) return;
  currentStatus.value = status;
  fetchData(true);
};

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const onSearchChange = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchData(true), 400);
};

const onSearchClear = () => {
  filterKeyword.value = '';
  fetchData(true);
};

// 跳转详情
const goToTrace = (productId: string) => {
  navigateTo({
    url: `/pages/record/produce-trace?id=${productId}`,
  });
};

// 辅助方法
const statusLabel = (status: string) => {
  return getProductStatusText(status);
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    'Passed': 'badge-pass',
    'Consumed': 'badge-consumed',
    'Scrapped': 'badge-scrapped'
  };
  return map[status] || 'badge-default';
};

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    'PACK': '电池包',
    'MODULE': '模组',
    'CELL': '电芯',
  };
  return map[type] || type;
};
</script>

<style scoped>
.product-list-page {
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
}

/* 搜索栏 */
.search-bar {
  padding: 10px 14px 0;
}

/* 状态筛选 */
.status-filter {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

.filter-tag {
  padding: 6px 16px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  color: #666;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.tag-active {
  background: #2b7de9;
  color: #fff;
  border-color: #2b7de9;
}

/* 列表容器 */
.list-container {
  flex: 1;
  padding: 10px 14px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 80px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 产品卡片 */
.product-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s;
}

.product-card:active {
  transform: scale(0.98);
  background: #f9fafb;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-size: 17px;
  font-weight: 700;
  color: #1a1d23;
}

.product-sap {
  font-size: 13px;
  color: #969ba6;
  font-family: monospace;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}

.badge-pass {
  background: #e8f8ef;
  color: #1f7b3b;
}

.badge-consumed {
  background: #f3f4f6;
  color: #6b7280;
}

.badge-scrapped {
  background: #fef4f2;
  color: #e8553d;
}

.badge-default {
  background: #e8f4fd;
  color: #2b7de9;
}

/* 卡片信息 */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: #969ba6;
  width: 72px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.info-value.highlight {
  font-weight: 700;
  color: #2563eb;
  font-family: monospace;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.enter-text {
  font-size: 13px;
  font-weight: 500;
  color: #2b7de9;
}

.enter-arrow {
  font-size: 16px;
  color: #2b7de9;
}

/* 加载更多 */
.load-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.no-more {
  font-size: 12px;
  color: #bbb;
}

.bottom-safe-area {
  height: 20px;
}
</style>
