<template>

  <view class="prod-trace-page">
    <NavBar title="生产追踪" />
    <view class="prod-trace-content">
      <!-- 搜索栏 -->
      <view class="search-wrapper">
        <!-- 1. 输入框区域 -->
        <view class="search-input-wrap">
          <nut-input class="search-input" type="text" placeholder="输入项目编号 / SAP" />
        </view>

        <!-- 2. 扫描图标 -->
        <view class="scan-icon" @click="scanCode">
          <IconFont name="scan2" size="16" />
        </view>

        <!-- 3. 搜索按钮 -->
        <nut-button type="info" shape="square" :loading="isLoading" class="search-btn">
          追溯
        </nut-button>
      </view>

      <view class="content-area">
        <!-- ===== 卡片列表 ===== -->
        <view class="product-list">
          <!-- 产品信息卡片 -->
          <view class="product-card">
            <view class="product-header">
              <span class="product-name">PT043D-280-R2.1</span>
              <span class="status-tag" :class="'done'">
                已完成
              </span>
            </view>
            <view class="product-info-grid">
              <view class="info-item">
                <span class="info-label">SAP码</span>
                <span class="info-value highlight">91071573</span>
              </view>
              <view class="info-item">
                <span class="info-label">批次号</span>
                <span class="info-value">91071573-A001</span>
              </view>
              <view class="info-item">
                <span class="info-label">产品型号</span>
                <span class="info-value">LF280K-V3</span>
              </view>
              <view class="info-item">
                <span class="info-label">产品规格</span>
                <span class="info-value">1P48S</span>
              </view>
            </view>
          </view>
          <view class="product-card">
            <view class="product-header">
              <span class="product-name">PT043D-280-R2.1</span>
              <span class="status-tag" :class="'abnormal'">
                异常
              </span>
            </view>
            <view class="product-info-grid">
              <view class="info-item">
                <span class="info-label">SAP码</span>
                <span class="info-value highlight">91071573</span>
              </view>
              <view class="info-item">
                <span class="info-label">批次号</span>
                <span class="info-value">91071573-A002</span>
              </view>
              <view class="info-item">
                <span class="info-label">产品型号</span>
                <span class="info-value">LF280K-V3</span>
              </view>
              <view class="info-item">
                <span class="info-label">产品规格</span>
                <span class="info-value">1P48S</span>
              </view>
            </view>
          </view>
          <view class="product-card">
            <view class="product-header">
              <span class="product-name">PT043D-280-R2.1</span>
              <span class="status-tag" :class="'processing'">
                加工中
              </span>
            </view>
            <view class="product-info-grid">
              <view class="info-item">
                <span class="info-label">SAP码</span>
                <span class="info-value highlight">91071573</span>
              </view>
              <view class="info-item">
                <span class="info-label">批次号</span>
                <span class="info-value">91071573-A003</span>
              </view>
              <view class="info-item">
                <span class="info-label">产品型号</span>
                <span class="info-value">LF280K-V3</span>
              </view>
              <view class="info-item">
                <span class="info-label">产品规格</span>
                <span class="info-value">1P48S</span>
              </view>
            </view>
          </view>
        </view>

        <!-- 进度概览 -->
        <view class="progress-section">
          <view class="progress-header">
            <span class="progress-label">工序完成进度</span>
            <span class="progress-percent">{{ completedCount }} / {{ traceResult.steps.length }} 道</span>
          </view>
          <view class="progress-bar-outer">
            <!--             <view class="progress-bar-inner"
              :style="{ width: Math.round((completedCount / traceResult.steps.length) * 100) + '%' }" /> -->
            <nut-progress :percentage="Math.round((completedCount / traceResult.steps.length) * 100)" :show-text="false"
              text-inside stroke-color="blue" />
          </view>
          <view class="progress-stats">
            <span><span class="dot green"></span>已完成 {{ doneCount }}</span>
            <span><span class="dot blue"></span>进行中 {{ activeCount }}</span>
            <span><span class="dot red"></span>异常 {{ anomalyCount }}</span>
            <span><span class="dot gray"></span>待处理 {{ pendingCount }}</span>
          </view>
        </view>

        <!-- 工序时间线 -->
        <view class="timeline-section">
          <view class="timeline-title">完整工序追溯链路</view>
          <ul class="timeline-list">
            <li class="timeline-node" v-for="(step, idx) in traceResult.steps" :key="step.id"
              @click="toggleStep(step.id)">
              <!-- 左侧节点+连接线 -->
              <view class="timeline-line-col" :class="getLineClass(step.status, idx)">
                <view class="timeline-dot" :class="step.status">
                  <view v-if="step.status === 'completed'">&#10003;</view>
                  <view v-else-if="step.status === 'in-progress'">&#9679;</view>
                  <view v-else-if="step.status === 'anomaly'">!</view>
                  <view v-else>&#9675;</view>
                </view>
              </view>

              <!-- 右侧工序内容 -->
              <view class="timeline-content">
                <view class="timeline-step-header">
                  <span class="step-name">{{ idx + 1 }}. {{ step.stepName }}</span>
                  <span class="expand-icon" :class="{ open: expandedId === step.id }">&#9660;</span>
                </view>
                <view class="step-subtitle">
                  <span>&#128337; {{ step.startTime || '--' }}</span>
                  <span v-if="step.endTime">&rarr; {{ step.endTime }}</span>
                  <span>&#128100; {{ step.operator || '--' }}</span>
                </view>
                <view v-if="step.hasAnomaly" class="anomaly-flag">&#9888; 含异常记录</view>

                <!-- 展开详情 -->
                <view v-if="expandedId === step.id" class="timeline-detail">
                  <view class="detail-grid" :class="{ 'single-col': !step.params || step.params.length === 0 }">
                    <view class="detail-kv" v-if="step.equipment">
                      <span class="detail-k" >设备编号</span>
                      <span class="detail-v">{{ step.equipment || '--' }}</span>
                    </view>
                    <view class="detail-kv" v-if="step.equipmentName">
                      <span class="detail-k">设备名称</span>
                      <span class="detail-v">{{ step.equipmentName || '--' }}</span>
                    </view>
                    <view class="detail-kv">
                      <span class="detail-k">操作人员</span>
                      <span class="detail-v">{{ step.operator || '--' }}</span>
                    </view>
                    <view class="detail-kv">
                      <span class="detail-k">工位号</span>
                      <span class="detail-v">{{ step.station || '--' }}</span>
                    </view>
                    <view class="detail-kv">
                      <span class="detail-k">开始时间</span>
                      <span class="detail-v">{{ step.startTime || '--' }}</span>
                    </view>
                    <view class="detail-kv">
                      <span class="detail-k">结束时间</span>
                      <span class="detail-v">{{ step.endTime || '进行中...' }}</span>
                    </view>
                  </view>

                  <!-- 工艺参数 -->
                  <view v-if="step.params && step.params.length > 0" style="margin-top:12px;">
                    <view v-for="p in step.params" :key="p.name" class="param-row">
                      <span class="param-name">{{ p.name }}</span>
                      <span class="param-value" :class="{ abnormal: p.isAbnormal }">
                        {{ p.value }} {{ p.unit }}
                        <span v-if="p.isAbnormal" style="font-size:10px;color:#f5222d;">&#9888;超标</span>
                      </span>
                    </view>
                  </view>

                  <!-- 检验结果 -->
                  <view v-if="step.inspection" class="inspection-badge">
                    &#9989; 检验结果：{{ step.inspection }}
                  </view>

                  <!-- 异常记录 -->
                  <view v-if="step.anomalyRecords && step.anomalyRecords.length > 0">
                    <view class="anomaly-record" v-for="(rec, ri) in step.anomalyRecords" :key="ri">
                      <view class="anomaly-record-title">&#128680; 异常记录 #{{ ri + 1 }}</view>
                      <view class="anomaly-record-desc">
                        {{ rec.time }} &mdash; {{ rec.description }}
                        <!-- <br />处理措施：{{ rec.action }}
                        <br />处理结果：{{ rec.result }} -->
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </li>
          </ul>
        </view>

      </view>



    </view>

  </view>
</template>

<script setup lang="ts" name="ProdTrace">
import { ref, reactive, computed } from 'vue'
import NavBar from '@/components/nav-bar/nav-bar.vue'
import { IconFont } from '@nutui/icons-vue-taro'
const isLoading = ref(false);


const scanCode = () => {
  // 模拟扫码功能
  setTimeout(() => {
    // 模拟扫码结果，实际应用中应替换为扫码获取的真实数据
    const scannedCode = '91071573-A003'
    alert('扫码结果:' + scannedCode)
  }, 500)
};

// ---------- 模拟追溯数据 ----------
const mockProduct = {
  productName: '精密轴承组件 BP-300K',
  batchNo: 'B20260525-A03',
  serialNo: 'SN-BP3K-2026-05892',
  spec: 'BP-300K / Φ42×18mm',
  planQty: 500,
  workshop: '精密加工三车间',
  overallStatus: 'processing',
  steps: [
    {
      id: 1,
      stepName: '短板加工',
      status: 'completed', // anomaly 表示有异常，in-progress 进行中，pending 待处理
      startTime: '2026-05-25 08:30',
      endTime: '2026-05-25 09:15',
      operator: '王鹏',
      station: '149872',
      hasAnomaly: false,
      params: [
        { name: '外观检查', value: '合格', unit: '', isAbnormal: false },
        { name: '尺寸测量', value: '8.00', unit: 'mm', isAbnormal: false },
      ],
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
      params: [
        { name: '单体电压', value: '12.3', unit: 'V', isAbnormal: false },
        { name: '交流内阻', value: '45', unit: 'Ω', isAbnormal: false },
        { name: '电压级差', value: '12', unit: '', isAbnormal: false },
      ],
      inspection: '电芯性能指标全检合格，符合后续工序要求',
      anomalyRecords: []
    },
    {
      id: 3,
      stepName: '模组堆叠',
      status: 'completed',
      startTime: '2026-05-25 14:00',
      endTime: '2026-05-25 16:20',
      operator: '张铁军',
      station: '149873',
      hasAnomaly: false,
      inspection: '',
      anomalyRecords: [
      ]
    },
    {
      id: 4,
      stepName: '模组吊运',
      status: 'completed',
      startTime: '2026-05-26 07:45',
      endTime: '2026-05-26 09:30',
      operator: '赵永刚',
      station: '45321',
      hasAnomaly: false,
      params: [
        { name: '吸盘压力', value: '0.3', unit: 'MPa', isAbnormal: false },
      ],
      inspection: '吊具无变形，吊盘焊接处完好，吊钩完好',
      anomalyRecords: []
    },
    {
      id: 5,
      stepName: 'CSS组装',
      status: 'completed',
      startTime: '2026-05-26 09:30',
      endTime: '2026-05-26 11:45',
      operator: '陈晓明',
      equipment: 'ASM-056',
      equipmentName: '自动组装机',
      station: '52345',
      hasAnomaly: true,
      params: [
        { name: '洁净', value: 'true', unit: '', isAbnormal: false },
      ],
      inspection: "赃污检测发现极柱表面有轻微赃污，已打磨处理，后续工序需加强监控",
      anomalyRecords: [
        {
          time: '2026-05-26 10:15',
          description: 'CSS组装过程中发现极柱表面有轻微赃污，已使用酒精棉球进行打磨处理，后续工序需加强监控'
        }
      ]
    },
    {
      id: 6,
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
      id: 7,
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
}

const traceResult = ref(mockProduct)

// ---------- 计算属性 ----------
const doneCount = computed(() =>
  traceResult.value
    ? traceResult.value.steps.filter(s => s.status === 'completed').length
    : 0
)
const activeCount = computed(() =>
  traceResult.value
    ? traceResult.value.steps.filter(s => s.status === 'in-progress').length
    : 0
)
const anomalyCount = computed(() =>
  traceResult.value
    ? traceResult.value.steps.filter(s => s.status === 'anomaly').length
    : 0
)
const pendingCount = computed(() =>
  traceResult.value
    ? traceResult.value.steps.filter(s => s.status === 'pending').length
    : 0
)
const completedCount = computed(() =>
  traceResult.value
    ? traceResult.value.steps.filter(s => s.status === 'completed' || s.status === 'anomaly').length
    : 0
)

const expandedId = ref(null)  // 当前展开的工序ID，null表示全部收起;

const toggleStep = (stepId) => {
    // 如果点击的是当前已展开的节点，则关闭它（设为 null）
  // 否则展开点击的节点（自动关闭之前打开的）
  expandedId.value = expandedId.value === stepId ? null : stepId;
}

const getLineClass = (status, idx) => {
  // 找到第一个 in-progress 状态的索引
  const activeIndex = traceResult.value.steps.findIndex(s => s.status === 'in-progress');

  // 如果当前节点在 in-progress 之后，并且状态是 pending，则隐藏连接线
  if (activeIndex !== -1 && idx > activeIndex && status === 'pending') {
    return 'line-none';
  }

  // 原有逻辑
  if (status === 'completed') return 'line-done';
  if (status === 'in-progress' || status === 'anomaly') return 'line-active';
  return 'line-pending';
}
</script>

<style lang="scss" scoped>
@use './search.scss';
@use './prod-card.scss';
@use './process.scss';

.prod-trace-page {
  min-height: 100vh;
  background-color: #f5f6f7;
  padding-bottom: 20px;
}


.content-area {
  padding: 0 16px 24px;
}

/* ===== 工序时间线 ===== */
.timeline-section {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 6px 16px 14px;
  box-shadow: var(--shadow-md);
}

.timeline-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  padding: 14px 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1.5px solid #f0f2f5;
  margin-bottom: 6px;
}

.timeline-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #1890ff, #69c0ff);
  border-radius: 3px;
}

.timeline-list {
  list-style: none;
  position: relative;
}

/* 时间线节点 */
.timeline-node {
  display: flex;
  gap: 13px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  position: relative;
  padding: 4px 0;
}

.timeline-node:last-child .timeline-line-col::after {
  display: none;
}

/* 左侧列 */
.timeline-line-col {
  position: relative;
  width: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  z-index: 2;
  position: relative;
  transition: transform 0.25s, box-shadow 0.25s;
  font-weight: 800;
}

.timeline-node:active .timeline-dot {
  transform: scale(1.18);
}

.timeline-dot.completed {
  background: #f6ffed;
  border: 3px solid var(--green);
  color: var(--green);
}

.timeline-dot.in-progress {
  background: #e6f7ff;
  border: 3px solid var(--blue);
  color: var(--blue);
  animation: pulse-dot 2s ease-in-out infinite;
}

.timeline-dot.anomaly {
  background: #fff1f0;
  border: 3px solid var(--red);
  color: var(--red);
}

.timeline-dot.pending {
  background: #fafafa;
  border: 3px solid var(--gray);
  color: var(--gray);
}

@keyframes pulse-dot {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4);
  }

  50% {
    box-shadow: 0 0 0 10px rgba(24, 144, 255, 0);
  }
}

.timeline-line-col::after {
  content: '';
  position: absolute;
  /* 向上/下各溢出 4px，恰好填满 .timeline-node 的 padding: 4px 0 造成的间隙 */
  top: -5px;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 2.5px;
  z-index: 1;                /* 置于圆点下方（圆点 z-index:2） */
  border-radius: 2px;
}

.timeline-line-col.line-done::after    { background: var(--green); }

.timeline-line-col.line-none::after {
  display: none;   /* 彻底隐藏连接线 */
}
/* 进行中：渐变线（绿→蓝→灰） */
.timeline-line-col.line-active::after  { background: linear-gradient(to bottom, var(--green) 30%, var(--blue) 60%, #e8ecf1 100%); }

/* 待处理：虚线 */
.timeline-line-col.line-pending::after { background: repeating-linear-gradient(to bottom, #d9dde3 0px, #d9dde3 4px, transparent 4px, transparent 8px); }

/* 右侧内容 */
.timeline-content {
  flex: 1;
  padding: 3px 0 14px;
  min-width: 0;
}

.timeline-step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.step-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.2px;
}

.step-time {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.step-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.step-subtitle span {
  white-space: nowrap;
}

/* 展开箭头 */
.expand-icon {
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.expand-icon.open {
  transform: rotate(180deg);
}

/* 异常标记 */
.anomaly-flag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--red);
  background: #fff1f0;
  padding: 3px 9px;
  border-radius: 12px;
  font-weight: 600;
  margin-top: 5px;
}

/* 展开详情 */
.timeline-detail {
  margin-top: 10px;
  background: #f8f9fb;
  border-radius: 10px;
  padding: 13px;
  border: 1px solid #eef1f5;
  animation: detailIn 0.3s ease;
}

@keyframes detailIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px 16px;
}

.detail-grid.single-col {
  grid-template-columns: 1fr;
}

.detail-kv {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-k {
  font-size: 11px;
  color: var(--text-muted);
}

.detail-v {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.detail-v.warn {
  color: var(--red);
  font-weight: 700;
}

/* 参数列表 */
.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #e8ecf1;
  font-size: 12px;
}

.param-name {
  color: var(--text-secondary);
}

.param-value {
  font-weight: 600;
  color: var(--text-primary);
}

.param-value.abnormal {
  color: var(--red);
}

/* 检验结果 */
.inspection-badge {
  margin-top: 10px;
  padding: 7px 10px;
  background: #f6ffed;
  border-radius: 8px;
  font-size: 12px;
  color: #389e0d;
  font-weight: 500;
  border-left: 3px solid var(--green);
}

/* 异常记录 */
.anomaly-record {
  margin-top: 10px;
  padding: 10px 12px;
  background: #fff1f0;
  border-radius: 8px;
  border-left: 3px solid var(--red);
}

.anomaly-record-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--red);
  margin-bottom: 4px;
}

.anomaly-record-desc {
  font-size: 11px;
  color: #a8071a;
  line-height: 1.6;
}
</style>
