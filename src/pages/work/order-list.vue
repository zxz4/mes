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
          <OrderCard v-for="order in list" :key="order.id" :order="order" @click="goToOverview" />
        </view>

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
import { getLWorkOrderList } from '../../apis/work-order/look-up';
import type { WorkOrderListItem } from '@/types/work-order';
import OrderCard from "@/components/OrderCard.vue";

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
</script>

<style scoped>
@import './order-list.css';
</style>
