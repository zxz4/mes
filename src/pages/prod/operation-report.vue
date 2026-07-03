<!-- src/pages/operation-material/index.vue -->
<template>
  <view class="container">
    <!-- 头部统计 -->
    <view class="header">
      <view class="header-left">
        <view class="header-icon">
          <text class="icon-text">📊</text>
        </view>
        <view>
          <text class="header-title">线体参数明细表</text>
          <text class="header-subtitle">编号：{{ batchNo }}</text>
        </view>
      </view>
      <view class="stats">
        <view class="stat-item">
          <text class="stat-value">{{ totalRows }}</text>
          <text class="stat-label">总记录</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ operations.length }}</text>
          <text class="stat-label">工序数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value abnormal-count">{{ abnormalCount }}</text>
          <text class="stat-label">异常</text>
        </view>
      </view>
    </view>

    <!-- 桌面表格视图（窗口宽度 ≥ 768px 时显示） -->
    <view v-if="!isMobile" class="desktop-table">
      <table>
        <thead>
          <tr>
            <th>工序编号</th>
            <th>工序名称</th>
            <th>物料名称</th>
            <th>SAP</th>
            <th>实际物料编码</th>
            <th>参数名称</th>
            <th>单位</th>
            <th>参数值</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in flatRows" :key="index" :class="{ 'row-abnormal': row.isAbnormal }">
            <!-- 工序编号（合并单元格） -->
            <td v-if="spanInfo[index].opCode > 0" :rowspan="spanInfo[index].opCode" class="col-op-code">
              <text class="badge">{{ row.operationCode }}</text>
            </td>
            <!-- 工序名称（合并单元格） -->
            <td v-if="spanInfo[index].opName > 0" :rowspan="spanInfo[index].opName" class="col-op-name">
              {{ row.operationName }}
            </td>
            <!-- 物料名称（合并单元格） -->
            <td v-if="spanInfo[index].matName > 0" :rowspan="spanInfo[index].matName" class="col-mat-name">
              {{ row.materialName }}
            </td>
            <!-- SAP（合并单元格） -->
            <td v-if="spanInfo[index].matSap > 0" :rowspan="spanInfo[index].matSap" class="col-mat-sap">
              {{ row.materialSap }}
            </td>
            <!-- 实际物料编码（合并单元格） -->
            <td v-if="spanInfo[index].lot > 0" :rowspan="spanInfo[index].lot" class="col-lot-code">
              {{ row.lotCode }}
            </td>
            <td>{{ row.parameterName }}</td>
            <td>{{ row.unit }}</td>
            <td class="col-value">
              <text :class="['value-highlight', { 'value-abnormal': row.isAbnormal }]">
                {{ row.value }}
              </text>
              <text v-if="row.isAbnormal" class="abnormal-badge">⚠ 异常</text>
            </td>
          </tr>
        </tbody>
      </table>
    </view>

    <!-- 移动端卡片视图（窗口宽度 < 768px 时显示） -->
    <view v-else class="mobile-cards">
      <view v-for="(card, cardIdx) in mobileCards" :key="cardIdx" :class="['card', { abnormal: card.hasAbnormal }]">
        <view class="card-header">
          <view class="operation-info">
            <text class="badge">{{ card.operationCode }}</text>
            <text class="op-name">{{ card.operationName }}</text>
          </view>
          <text v-if="card.hasAbnormal" class="abnormal-tag">异常</text>
        </view>
        <view class="card-body">
          <view class="info-row">
            <text class="label">物料名称</text>
            <text class="value name">{{ card.materialName }}</text>
          </view>
          <view class="info-row">
            <text class="label">SAP</text>
            <text class="value">{{ card.materialSap }}</text>
          </view>
          <view class="info-row">
            <text class="label">物料编码</text>
            <text class="value">{{ card.lotCode }}</text>
          </view>
          <view v-for="(param, pIdx) in card.parameters" :key="pIdx"
            :class="['param-item', { abnormal: param.isAbnormal }]">
            <text class="param-name">{{ param.parameterName }}</text>
            <text class="param-value">{{ param.value }}</text>
            <text class="param-unit">{{ param.unit }}</text>
            <text v-if="param.isAbnormal" class="abnormal-tag">异常</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer">
      <text>📋 共 {{ totalRows }} 条记录</text>
      <text class="footer-time">当前视图：{{ isMobile ? '移动端卡片' : '桌面表格' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Taro from '@tarojs/taro'
import type { ProductionOperation , ProductionParameter} from '@/types/work-order'
import {getListByBatchNo} from '@/api/prod/look-up'


interface FlatRow {
  operationCode: string
  operationName: string
  materialName: string
  materialSap: string
  lotCode: string
  parameterName: string
  unit: string
  value: string | number
  isAbnormal: boolean
}

interface SpanInfo {
  opCode: number
  opName: number
  matName: number
  matSap: number
  lot: number
}

const batchNo = ref('')
const operations = ref<ProductionOperation[]>([])


// ---------- 响应式窗口尺寸 ----------
const BREAKPOINT = 768
const isMobile = ref(false)

// 获取初始窗口宽度并设置 isMobile
const updateIsMobile = () => {
  try {
    const systemInfo = Taro.getSystemInfoSync()
    isMobile.value = systemInfo.windowWidth < BREAKPOINT
  } catch (e) {
    // 降级处理：默认非移动端
    isMobile.value = false
  }
}

// 监听窗口尺寸变化
let resizeHandler: ((res) => void);
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const instance = Taro.getCurrentInstance()
  batchNo.value = instance.router?.params?.batchNo || 'SN2026063000001';

  getListByBatchNo(batchNo.value).then(res => {
    operations.value = res
  })

  updateIsMobile()
  if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
    // web环境使用ResizeObserver监听
    resizeObserver = new ResizeObserver(() => {
      updateIsMobile()
    })
    resizeObserver.observe(document.documentElement)
  } else {
    resizeHandler = (res) => {
      isMobile.value = res.windowWidth < BREAKPOINT
    }
    Taro.onWindowResize(resizeHandler)
  }
})

onUnmounted(() => {
  if (resizeHandler) {
    Taro.offWindowResize(resizeHandler)
  }
})

// ---------- 数据展平 ----------
const flatRows = computed<FlatRow[]>(() => {
  const rows: FlatRow[] = []
  operations.value.forEach(op => {
    op.inputs?.forEach(input => {
      input.parameters?.forEach(param => {
        rows.push({
          operationCode: op.operationCode,
          operationName: op.operationName,
          materialName: input.materialName,
          materialSap: input.materialSap,
          lotCode: input.lotCode,
          parameterName: param.parameterName,
          unit: param.unit ,
          value: param.value,
          isAbnormal: param.isAbnormal
        })
      })
    })
  })
  return rows
})

// ---------- 合并单元格信息 ----------
const spanInfo = computed<SpanInfo[]>(() => {
  const rows = flatRows.value
  const total = rows.length
  const spans: SpanInfo[] = Array.from({ length: total }, () => ({
    opCode: 1, opName: 1, matName: 1, matSap: 1, lot: 1
  }))

  // 工序合并
  let start = 0
  for (let i = 1; i <= total; i++) {
    if (i === total || rows[i].operationCode !== rows[start].operationCode) {
      const span = i - start
      spans[start].opCode = span
      spans[start].opName = span
      for (let j = start + 1; j < i; j++) {
        spans[j].opCode = 0
        spans[j].opName = 0
      }
      start = i
    }
  }

  // 物料合并
  start = 0
  for (let i = 1; i <= total; i++) {
    const key = (r: FlatRow) => r.operationCode + '|' + r.lotCode
    if (i === total || key(rows[i]) !== key(rows[start])) {
      const span = i - start
      spans[start].matName = span
      spans[start].matSap = span
      spans[start].lot = span
      for (let j = start + 1; j < i; j++) {
        spans[j].matName = 0
        spans[j].matSap = 0
        spans[j].lot = 0
      }
      start = i
    }
  }

  return spans
})

// ---------- 统计 ----------
const totalRows = computed(() => flatRows.value.length)
const abnormalCount = computed(() => flatRows.value.filter(r => r.isAbnormal).length)

// ---------- 移动端卡片数据 ----------
const mobileCards = computed(() => {
  const cards: {
    operationCode: string
    operationName: string
    materialName: string
    materialSap: string
    lotCode: string
    parameters: ProductionParameter[]
    hasAbnormal: boolean
  }[] = []
  operations.value.forEach(op => {
    op.inputs?.forEach(input => {
      const hasAbnormal = input.parameters?.some(p => p.isAbnormal) ?? false
      cards.push({
        operationCode: op.operationCode,
        operationName: op.operationName,
        materialName: input.materialName,
        materialSap: input.materialSap,
        lotCode: input.lotCode,
        parameters: input.parameters ?? [],
        hasAbnormal
      })
    })
  })
  return cards
})
</script>

<style scoped>
/* 全局容器 */
.container {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #f8f9fa;
  min-height: 100vh;
  color: #212529;
  line-height: 1.5;
}

/* 头部 */
.header {
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 36px;
  height: 36px;
  background: #1a73e8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-text {
  font-size: 18px;
  color: #fff;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.header-subtitle {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
  display: block;
}

.stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 6px 14px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  min-width: 64px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 10px;
  color: #868e96;
  text-transform: uppercase;
}

.abnormal-count {
  color: #c62828;
}

/* 桌面表格 */
.desktop-table {
  overflow-x: auto;
  padding: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

th {
  background: #e8edf3;
  font-weight: 600;
  font-size: 13px;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #d5dbe3;
  white-space: nowrap;
}

td {
  padding: 10px 12px;
  border-bottom: 1px solid #eef0f4;
  font-size: 13px;
  color: #495057;
  background: #fff;
  vertical-align: middle;
}

tr:hover td {
  background: #f1f5f9;
}

.row-abnormal td {
  background: #fff0f0 !important;
  color: #5d1a1a;
}

.col-op-code {
  font-family: "SF Mono", Consolas, monospace;
  font-weight: 600;
  color: #1a1a2e;
}

.col-op-name {
  font-weight: 600;
  color: #1a1a2e;
}

.col-mat-name {
  font-weight: 500;
  color: #1a1a2e;
}

.col-mat-sap,
.col-lot-code {
  font-family: "SF Mono", Consolas, monospace;
  font-size: 12px;
}

.col-value {
  text-align: center;
}

.value-highlight {
  font-weight: 600;
  font-family: "SF Mono", Consolas, monospace;
  color: #1a1a2e;
}

.value-abnormal {
  color: #c62828 !important;
  font-weight: 700;
}

.abnormal-badge {
  display: inline-block;
  background: #fce4e4;
  color: #c62828;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 6px;
}

.badge {
  display: inline-block;
  background: #e8f0fe;
  color: #1a56c4;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 5px;
  font-family: "SF Mono", Consolas, monospace;
}

/* 移动端卡片 */
.mobile-cards {
  padding: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card.abnormal {
  border-left: 4px solid #c62828;
  background: #fffbfb;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fb;
  border-bottom: 1px solid #eef0f4;
  flex-wrap: wrap;
  gap: 8px;
}

.operation-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.op-name {
  font-weight: 600;
  color: #1a1a2e;
}

.abnormal-tag {
  background: #c62828;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 13px;
}

.label {
  font-weight: 600;
  color: #495057;
  min-width: 80px;
  font-size: 12px;
  text-transform: uppercase;
}

.value {
  color: #212529;
  font-family: "SF Mono", Consolas, monospace;
}

.value.name {
  font-family: inherit;
  font-weight: 500;
}

.param-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.param-item.abnormal {
  background: #fff0f0;
}

.param-name {
  font-weight: 600;
  color: #1a1a2e;
  min-width: 60px;
}

.param-value {
  font-family: "SF Mono", Consolas, monospace;
  font-weight: 600;
  color: #1a1a2e;
}

.param-unit {
  color: #6c757d;
  font-size: 12px;
}

/* 底部 */
.footer {
  padding: 14px 24px;
  border-top: 1px solid #eef0f4;
  font-size: 12px;
  color: #868e96;
  display: flex;
  justify-content: space-between;
  background: #fafbfc;
}

.footer-time {
  color: #6c757d;
}
</style>
