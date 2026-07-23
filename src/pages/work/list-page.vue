<template>
  <TabbarLayout>
    <view class="order-list-page">
      <NavBar :title="'工单列表'" :show-back="false" />
      <!-- 搜索栏 -->
      <view class="search-bar">
        <nut-searchbar v-model="filterKeyword" placeholder="搜索工单编码或名称" @change="onSearchChange"
          @clear="onSearchClear" />
      </view>

      <!-- 状态筛选标签 -->
      <view class="status-filter">
        <view v-for="status in statusOptions" :key="status.value" class="filter-tag"
          :class="{ 'tag-active': currentStatus === status.value }" @click="switchStatus(status.value)">
          {{ status.label }}
        </view>
      </view>

      <!-- 列表区域 -->
      <view class="list-container">

        <view v-show="list.length === 0" class="empty-state">
          <nut-empty description="暂无工单" />
        </view>

        <view v-if="list.length > 0" class="order-list">
          <view v-for="order in list" :key="order.id" class="order-card" @click="goToOverview(order.id)">
            <view class="card-header">
              <view class="header-left">
                <text class="order-code">{{ order.code }}</text>
                <text class="order-name">{{ order.name }}</text>
              </view>
              <text class="status-tag" :class="statusClass(order.status)">
                {{ statusLabel(order.status) }}
              </text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="info-label">产品名称</text>
                <text class="info-value">{{ order.productName }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">产品SAP</text>
                <text class="info-value mono">{{ order.productSap }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">计划数量</text>
                <text class="info-value">{{ order.plannedQty }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">完成数量</text>
                <text class="info-value highlight">{{ order.completedQty }}</text>
              </view>
            </view>

            <view class="card-footer">
              <view class="progress-bar">
                <view class="progress-fill" :style="{ width: getProgress(order) + '%' }"></view>
              </view>
              <text class="progress-text">{{ getProgress(order) }}%</text>
            </view>
          </view>
        </view>

        <!-- 加载更多按钮（替代 infiniteloading） -->
        <view v-if="list.length > 0" class="load-section">
          <nut-button v-if="hasMore" :loading="loading" plain size="small" @click="loadMore">
            加载更多
          </nut-button>
          <view v-else class="no-more">没有更多了</view>
        </view>
      </view>

      <view class="bottom-safe-area"></view>
    </view>
  </TabbarLayout>
</template>

<script lang="ts" setup name="WorkOrderList">
import { ref, computed, onMounted } from 'vue';
import { navigateTo } from '@tarojs/taro';
import { getLWorkOrderList } from '@/api/work-order/look-up';
import type { WorkOrderListItem } from '@/types/work-order';

const filterKeyword = ref('');
const currentStatus = ref(''); // 空字符串表示全部
const statusOptions = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'Pending' },
  { label: '进行中', value: 'Processing' },
  { label: '异常', value: 'Exception' },
  { label: '已完成', value: 'Completed' },
];

const pageSize = 10;
const pageIndex = ref(1);
const totalCount = ref(0);
const list = ref<WorkOrderListItem[]>([]);
const loading = ref(false);
const hasMore = computed(() => list.value.length < totalCount.value);

onMounted(() => {
  fetchData(true);
});

const fetchData = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;

  if (reset) {
    pageIndex.value = 1;
    list.value = [];
  }

  const skipCount = (pageIndex.value - 1) * pageSize;
  try {
    const res = await getLWorkOrderList({
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
    totalCount.value = res.totalCount;
  } catch (error) {
    console.error('获取工单列表失败', error);
  } finally {
    loading.value = false;
  }
};

// 点击加载更多
const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  pageIndex.value++;
  fetchData(false);
};

// 切换筛选状态
const switchStatus = (status: string) => {
  if (currentStatus.value === status) return;
  currentStatus.value = status;
  fetchData(true);
};

// 搜索防抖
let searchTimer: any | undefined;
const onSearchChange = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchData(true);
  }, 400);
};

const onSearchClear = () => {
  filterKeyword.value = '';
  fetchData(true);
};

// 跳转到工序概览
const goToOverview = (workOrderId: string) => {
  navigateTo({ url: `/pages/prod/overview-page?workOrderId=${workOrderId}` });
};

// 计算完成进度
const getProgress = (order: WorkOrderListItem): number => {
  if (order.plannedQty === 0) return 0;
  return Math.min(Math.round((order.completedQty / order.plannedQty) * 100), 100);
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    'Pending': '待处理',
    'Processing': '进行中',
    'Exception': '异常',
    'Completed': '已完成',
  };
  return map[status] || status;
};

const statusClass = (status: string) => {
  if (status === 'Processing') return 'status-processing';
  if (status === 'Exception') return 'status-exception';
  if (status === 'Completed') return 'status-completed';
  return 'status-pending';
};
</script>

<style scoped>
.order-list-page {
  min-height: 100vh;
  background: #f5f6f8;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 10px 14px 0;
}

.status-filter {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

.filter-tag {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  color: #555;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.tag-active {
  background: #2b7de9;
  color: #fff;
  border-color: #2b7de9;
}

.list-container {
  flex: 1;
  padding: 0 14px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 80px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.1s;
}

.order-card:active {
  background: #f9fafb;
  transform: scale(0.98);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

@media (hover: hover) {
  .order-card:hover {
    background: #f5f5f5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.order-card:active {
  transform: scale(0.98);
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

.order-code {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.order-name {
  font-size: 13px;
  color: #777;
}

.status-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.status-pending {
  background: #f3f4f6;
  color: #6b7280;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-exception {
  background: #fee2e2;
  color: #dc2626;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-label {
  font-size: 12px;
  color: #999;
  width: 64px;
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.info-value.mono {
  font-family: monospace;
}

.info-value.highlight {
  font-weight: 700;
  color: #2b7de9;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2b7de9;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: #555;
  font-weight: 600;
  min-width: 32px;
  text-align: right;
}

/* 加载更多区域 */
.load-section {
  display: flex;
  justify-content: center;
  padding: 16px 0 10px;
}

.no-more {
  font-size: 12px;
  color: #bbb;
}

.bottom-safe-area {
  height: 20px;
}
</style>
