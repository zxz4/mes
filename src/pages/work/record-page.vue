<template>
  <TabbarLayout>
    <view class="record-page">
      <NavBar :title="'作业记录查询'" :show-back="true" />

      <!-- 搜索筛选区 -->
      <view class="filter-section">
        <view class="filter-row">
          <nut-input v-model="query.workOrderCode" placeholder="工单号" class="filter-input" clearable />
          <nut-input v-model="query.materialLot" placeholder="物料SN" class="filter-input" clearable />
        </view>
        <view class="filter-row">
          <nut-input v-model="query.operationCode" placeholder="工序代码" class="filter-input" clearable />
          <view class="date-picker-wrapper">
            <nut-datepicker v-model="query.startDate" placeholder="开始日期" class="filter-input date-input" />
            <text class="date-separator">至</text>
            <nut-datepicker v-model="query.endDate" placeholder="结束日期" class="filter-input date-input" />
          </view>
        </view>
        <view class="filter-actions">
          <view class="pass-filter">
            <text :class="{ active: query.isQualified === undefined }" @click="query.isQualified = undefined">全部</text>
            <text :class="{ active: query.isQualified === true }" @click="query.isQualified = true">合格</text>
            <text :class="{ active: query.isQualified === false }" @click="query.isQualified = false">不合格</text>
          </view>
          <nut-button size="small" type="primary" @click="search">搜索</nut-button>
        </view>
      </view>

      <!-- 列表 -->
      <view class="list-container">
        <view v-if="loading && records.length === 0" class="loading-state">
        </view>
        <view v-else-if="records.length === 0" class="empty-state">
          <nut-empty description="暂无记录" />
        </view>
        <view v-else class="record-list">
          <view v-for="record in records" :key="record.id" class="record-card" @click="showDetail(record)">
            <view class="card-left">
              <view class="record-header">
                <text class="lot">{{ record.processedLotNumber }}</text>
                <text class="result-tag" :class="record.isAbnormal ? 'tag-ng' : 'tag-pass'">
                  {{ record.isAbnormal ? 'NG' : 'PASS' }}
                </text>
              </view>
              <view class="record-info">
                <text class="info-line">{{ record.operationCode }} {{ record.operationName }}</text>
                <text class="info-line mono">{{ record.workOrderCode }}</text>
                <text class="info-line time">{{ formatTime(record.createdAt) }}</text>
              </view>
            </view>
            <view class="card-right">
              <text class="arrow">›</text>
            </view>
          </view>
        </view>
        <view v-if="records.length > 0" class="load-section">
          <nut-button v-if="hasMore" :loading="loading" plain size="small" @click="loadMore">
            加载更多
          </nut-button>
          <view v-else class="no-more">没有更多了</view>
        </view>
      </view>

      <!-- 详情弹窗 -->
      <nut-popup v-model:visible="detailVisible" position="bottom" round>
        <view class="detail-popup">
          <view class="detail-header">
            <text class="detail-title">作业详情</text>
            <nut-button size="mini" plain @click="detailVisible = false">关闭</nut-button>
          </view>
          <view v-if="currentDetail" class="detail-content">
            <view class="detail-row">
              <text class="label">物料SN</text>
              <text class="value">{{ currentDetail.processedLotNumber }}</text>
            </view>
            <view class="detail-row">
              <text class="label">工序</text>
              <text class="value">{{ currentDetail.operationCode }} {{ currentDetail.operationName }}</text>
            </view>
            <view class="detail-row">
              <text class="label">工单号</text>
              <text class="value">{{ currentDetail.workOrderCode }}</text>
            </view>
            <view class="detail-row">
              <text class="label">时间</text>
              <text class="value">{{ formatTime(currentDetail.createdAt) }}</text>
            </view>
            <view class="detail-row">
              <text class="label">结果</text>
              <text class="value" :class="currentDetail.isAbnormal ? 'text-ng' : 'text-pass'">
                {{ currentDetail.isAbnormal ? '不合格' : '合格' }}
              </text>
            </view>
            <view v-if="currentDetail.parameters.length" class="param-section">
              <text class="label">工艺参数</text>
              <view v-for="p in currentDetail.parameters" :key="p.parameterName" class="param-item">
                <text>{{ p.parameterName }}: {{ p.value }}</text>
              </view>
            </view>
            <view v-if="currentDetail.materialUsages?.length" class="param-section">
              <text class="label">辅料使用</text>
              <view v-for="m in currentDetail.materialUsages" :key="m.materialId" class="param-item">
                <text>{{ m.materialId }} / 批次: {{ m.lotNumber }} × {{ m.quantity }}</text>
              </view>
            </view>
            <view v-if="currentDetail.componentLotNumbers?.length" class="param-section">
              <text class="label">装配组件</text>
              <text class="value">{{ currentDetail.componentLotNumbers.join(', ') }}</text>
            </view>
          </view>
        </view>
      </nut-popup>
    </view>
  </TabbarLayout>
</template>

<script lang="ts" setup name="OperationRecords">
import { ref, reactive, computed, onMounted } from 'vue';
import { showToast } from '@tarojs/taro';
import { getOperationRecords } from '@/api/prod';
import type { OperationRecord } from '@/types/production';

const query = reactive({
  workOrderCode: '',
  operationCode: '',
  materialLot: '',
  startDate: '',
  endDate: '',
  isQualified: undefined as boolean | undefined,
});

const pageIndex = ref(1);
const pageSize = 10;
const totalCount = ref(0);
const records = ref<OperationRecord[]>([]);
const loading = ref(false);
const hasMore = computed(() => records.value.length < totalCount.value);

// 详情弹窗
const detailVisible = ref(false);
const currentDetail = ref<OperationRecord | null>(null);

onMounted(() => {
  fetchData(true);
});

const fetchData = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;
  if (reset) {
    pageIndex.value = 1;
    records.value = [];
  }
  const skip = (pageIndex.value - 1) * pageSize;
  try {
    const res = await getOperationRecords({
      workOrderCode: query.workOrderCode || undefined,
      operationCode: query.operationCode || undefined,
      materialLot: query.materialLot || undefined,
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      isAbnormal: query.isQualified !== undefined ? query.isQualified : undefined,
      skipCount: skip,
      maxResultCount: pageSize,
    });
    if (reset) {
      records.value = res.items;
    } else {
      records.value.push(...res.items);
    }
    totalCount.value = res.totalCount;
  } catch (error) {
    showToast({ title: '查询失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const search = () => fetchData(true);

const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  pageIndex.value++;
  fetchData(false);
};

const showDetail = (record: OperationRecord) => {
  currentDetail.value = record;
  detailVisible.value = true;
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
</script>

<style scoped>
.record-page {
  min-height: 100vh;
  background: #f5f6f8;
}

.filter-section {
  background: #fff;
  margin: 12px 14px;
  border-radius: 12px;
  padding: 12px;
}

.filter-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.filter-input {
  flex: 1;
  font-size: 13px;
}

.date-picker-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-input {
  width: 0;
  flex: 1;
}

.date-separator {
  font-size: 12px;
  color: #999;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.pass-filter {
  display: flex;
  gap: 12px;
}

.pass-filter text {
  font-size: 13px;
  color: #888;
  padding: 4px 10px;
  border-radius: 12px;
  background: #f3f4f6;
}

.pass-filter text.active {
  background: #2b7de9;
  color: #fff;
}

.list-container {
  padding: 0 14px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  padding-top: 80px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.record-card:active {
  background: #f9fafb;
}

.card-left {
  flex: 1;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.lot {
  font-weight: 600;
  font-size: 15px;
}

.result-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.tag-pass {
  background: #e6f7ed;
  color: #2ca85c;
}

.tag-ng {
  background: #fde8e4;
  color: #e8553d;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-line {
  font-size: 12px;
  color: #666;
}

.info-line.mono {
  font-family: monospace;
}

.info-line.time {
  color: #aaa;
}

.card-right .arrow {
  font-size: 22px;
  color: #ccc;
  margin-left: 8px;
}

.load-section {
  display: flex;
  justify-content: center;
  padding: 16px 0 10px;
}

.no-more {
  font-size: 12px;
  color: #bbb;
}

/* 弹窗 */
.detail-popup {
  padding: 20px 18px 30px;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
}

.detail-row .label {
  width: 72px;
  color: #888;
  font-size: 13px;
}

.detail-row .value {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.text-pass {
  color: #2ca85c;
  font-weight: 600;
}

.text-ng {
  color: #e8553d;
  font-weight: 600;
}

.param-section {
  margin-top: 4px;
}

.param-section .label {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
  display: block;
}

.param-item {
  font-size: 13px;
  color: #555;
  margin-left: 8px;
}
</style>
