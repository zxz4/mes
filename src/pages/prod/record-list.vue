<template>
  <TabbarLayout>
    <view class="record-page">
      <NavBar title="作业记录" :show-back="true" />

      <!-- 工序头部卡片 -->
      <view class="operation-header-card">
        <view class="header-top">
          <view class="header-left">
            <text class="op-code">{{ currentOperation?.operationCode }}</text>
            <text class="op-divider">｜</text>
            <text class="op-name">{{ currentOperation?.operationName }}</text>
          </view>
        </view>
        <view class="header-bottom">
          <text class="stats-label">已处理</text>
          <text class="stats-value">{{ currentOperation?.totalCount }}</text>
          <text class="stats-unit">件</text>
        </view>
      </view>

      <!-- 搜索栏 -->
      <view class="search-bar">
        <nut-searchbar v-model="filter" placeholder="搜索批次号" @change="onSearchChange" @clear="onSearchClear" />
      </view>

      <!-- 状态筛选标签 -->
      <view class="status-filter">
        <view v-for="status in statusOptions" :key="status.id" class="filter-tag"
          :class="{ 'tag-active': selectedStatus === status.value }" @click="switchStatus(status.value)">
          {{ status.label }}
        </view>
      </view>

      <!-- 记录列表 -->
      <view class="list-container">
        <view v-if="records.length === 0" class="empty-state">
          <nut-empty description="暂无记录" />
        </view>
        <view v-else class="record-list">
          <view v-for="record in records" :key="record.id" class="record-card">
            <view class="card-main" @click="goToTrace(record.processedLotId)"
              :class="record.isAbnormal ? 'card-ng' : 'card-pass'">
              <!-- 左侧状态条 -->
              <view class="status-bar"></view>

              <view class="card-left">
                <!-- 主物料信息（大字体突出） -->
                <view class="material-primary">
                  <text class="material-name">{{ record.processLot?.name || '未知物料' }}</text>
                  <text class="material-lot-number">{{ record.processLot?.lotNumber || '' }}</text>
                </view>
                <!-- 物料附属信息（规格、SAP、状态） -->
                <view class="material-secondary" v-if="record.processLot">
                  <text class="material-spec">{{ record.processLot.specification }}</text>
                  <text class="material-sap">{{ record.processLot.sap }}</text>
                  <text class="material-status-tag" :class="materialStatusClass(record.processLot.status)">
                    {{ productStatusLabel(record.processLot.status) }}
                  </text>
                </view>
                <!-- 时间 -->
                <text class="record-time">{{ formatTime(record.recordAt) }}</text>
              </view>

              <view class="card-right">
                <text class="result-tag" :class="record.isAbnormal ? 'result-ng' : 'result-pass'">
                  {{ record.isAbnormal ? 'NG' : 'PASS' }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <!-- 分页加载 -->
        <view v-if="records.length > 0" class="load-section">
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

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { getCurrentInstance, navigateTo } from '@tarojs/taro';
import { getRecordList } from '@/apis/record/look-up';
import type { OperationRecord } from '@/types/work-order';
import { getProductStatusText } from '@/utils/statusText';



const currentOperation = ref<{
  operationCode: string,
  operationName: string,
  totalCount: number
} | null>(null);

// 搜索筛选
const filter = ref('');
const selectedStatus = ref<boolean | null>(null);
const statusOptions = [
  { id: 'all', label: '全部', value: null },
  { id: 'pass', label: '合格', value: false },
  { id: 'ng', label: '不合格', value: true },
];

// 分页
const pageSize = 10;
let pageIndex = 1;
let operationId: string | null = null;
const totalCount = ref(0);
const records = ref<OperationRecord[]>([]);
const loading = ref(false);
const hasMore = computed(() => records.value.length < totalCount.value);

onMounted(() => {
  const instance = getCurrentInstance();
  operationId = instance?.router?.params?.operationId || '';
  fetchRecords(true);
});

const fetchRecords = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;
  if (reset) {
    pageIndex = 1;
    records.value = [];
  }
  const skipCount = (pageIndex - 1) * pageSize;
  try {
    const res = await getRecordList({
      isAbnormal: selectedStatus.value,
      filter: filter.value,
      skipCount,
      operationId,
      maxResultCount: pageSize,
    });

    if (!currentOperation.value && res.totalCount > 0) {
      currentOperation.value = {
        operationCode: res.items[0].operationCode,
        operationName: res.items[0].operationName,
        totalCount: res.totalCount
      };
    }

    if (reset) {
      records.value = res.items;
    } else {
      records.value.push(...res.items);
    }
    totalCount.value = res.totalCount;
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  pageIndex++;
  fetchRecords(false);
};

let searchTimer: any;
const onSearchChange = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchRecords(true), 800);
};
const onSearchClear = () => {
  filter.value = '';
  fetchRecords(true);
};
const switchStatus = (val: boolean | null) => {
  if (selectedStatus.value === val) return;
  selectedStatus.value = val;
  fetchRecords(true);
};

const goToTrace = (id: string) => {
  navigateTo({
    url: `/pages/record/produce-trace?id=${id}`
  });
};

const formatTime = (isoStr: string) => {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString();
};

const productStatusLabel = (status?: string) => {
  return getProductStatusText(status ?? '');
};

const materialStatusClass = (status?: string) => {
  if (!status) return '';
  if (status === 'Consumed') return 'mat-consumed';
  if (status === 'Passed') return 'mat-passed';
  if (status === 'Scrapped') return 'mat-scrapped';
  return 'mat-default';
};
</script>

<style scoped>
@import './record-list.css';
</style>
