<template>
  <TabbarLayout>
    <view class="prod-operation-page">
      <NavBar title="生产执行" />

      <!-- 统计卡片 -->
      <scroll-view scroll-x class="stats-row">
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'all' }" @click="filterStatus = 'all'">
          <view class="stat-number blue">{{ processes.length }}</view>
          <view class="stat-label">全部工艺</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'pending' }"
          @click="filterStatus = 'pending'">
          <view class="stat-number blue">{{ pendingCount }}</view>
          <view class="stat-label">待处理</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'progressing' }"
          @click="filterStatus = 'progressing'">
          <view class="stat-number orange">{{ inProgressCount }}</view>
          <view class="stat-label">进行中</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'completed' }"
          @click="filterStatus = 'completed'">
          <view class="stat-number green">{{ completedCount }}</view>
          <view class="stat-label">已完成</view>
        </view>
      </scroll-view>

      <!-- 工艺列表 -->
      <view class="process-list">
        <view v-for="process in filteredProcesses" :key="process.id">
          <view class="process-card"
            :class="[`status-${process.status}`, { 'has-anomaly': process.anomalies.length > 0 && process.status === 'progressing' }]">
            <view class="process-header">
              <text class="process-name">{{ process.processName }}</text>
              <view class="process-badges">
                <text v-if="process.anomalies.length > 0 && process.status === 'progressing'"
                  class="badge badge-anomaly">异常</text>
                <text class="badge" :class="statusBadgeClass(process.status)">{{ statusLabel(process.status) }}</text>
              </view>
            </view>
            <view class="process-body">
              <view class="info-row"><text>📦 {{ process.productName }}</text></view>
              <view class="info-row"><text>⚙️ {{ process.equipmentName || '未指定' }}</text><text>📍 {{ process.station
                  }}</text></view>
              <view v-if="process.intermediateDeps.length" class="info-row">
                <text>🔗 依赖中间件：</text>
                <text v-for="(dep, idx) in process.intermediateDeps" :key="idx" class="intermediate-info">
                  {{ getProcessName(dep.sourceProcessId) }} ×{{ dep.requiredPerUnit }}
                  (可用: {{ getIntermediateAvailable(dep.sourceProcessId) }})
                </text>
              </view>
              <view class="progress-mini">
                <nut-progress :percentage="progressPercent(process)" :show-text="false" stroke-color="blue"
                  class="progress-mini-bar" />
                <view>{{ process.completedQty }} / {{ process.planQty }} 件</view>
                <view v-if="process.status === 'progressing' && process.startTimeReal" class="duration">⏱️ {{
                  formatDuration(process) }}</view>
              </view>
            </view>
            <view class="process-actions">
              <!-- 待处理/加工中共用按钮 -->
              <template v-if="process.status === 'pending' || process.status === 'progressing'">
                <nut-button v-if="!process.materialReady" size="small" type="primary" plain
                  @click="openMaterialPanel(process)">
                  📦 物料录入
                </nut-button>
                <nut-button v-else-if="!process.intermediateReady" size="small" type="warning" plain disabled>
                  ⏳ 等待中间件
                </nut-button>
                <nut-button v-else-if="process.autoComplete" size="small" type="success"
                  @click="openMaterialPanel(process)">
                  📦 扫码完成
                </nut-button>
                <nut-button v-else size="small" type="info" @click="openParamPanel(process)">
                  📝 录入参数
                </nut-button>
              </template>
              <!-- 已完成 -->
              <template v-if="process.status === 'completed'">
                <nut-button size="small" plain @click="toggleExpand(process)">
                  🔍 {{ expandedSet.has(process.id) ? '收起详情' : '查看详情' }}
                </nut-button>
              </template>
              <!-- 上报异常 -->
              <nut-button v-if="process.status !== 'completed'" size="small" type="danger" plain
                @click="openAnomalyPanel(process)">
                上报异常
              </nut-button>
              <nut-button
                v-if="process.status === 'progressing' && (process.paramLogs.length > 0 || process.anomalies.length > 0)"
                size="small" plain @click="toggleExpand(process)">
                {{ expandedSet.has(process.id) ? '收起' : '展开记录' }}
              </nut-button>
            </view>
            <!-- 展开详情 -->
            <view v-if="expandedSet.has(process.id)" class="process-expand">
              <view v-if="process.paramLogs.length > 0">
                <view class="expand-title">📋 工艺参数记录 ({{ process.paramLogs.length }}次)</view>
                <view v-for="(log, idx) in process.paramLogs" :key="idx" class="param-log-card">
                  <view class="param-log-batch">🏷️ 批次号：{{ log.batchNo || process.batchNo }}</view>
                  <view v-if="!log.isListMode" class="param-log-values">
                    <text v-for="(v, vi) in log.values" :key="vi" class="param-value-tag">
                      {{ v.name }}: {{ v.value }}{{ v.unit ? ' ' + v.unit : '' }}
                    </text>
                  </view>
                  <view v-else>
                    <view v-for="(item, itemIdx) in log.items" :key="itemIdx" class="list-item-detail">
                      <text class="list-item-title">📌 物料 #{{ itemIdx + 1 }}</text>
                      <view class="param-log-values">
                        <text v-for="(val, fName) in item" :key="fName" class="param-value-tag">{{ fName }}: {{ val
                          }}</text>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
              <view v-if="process.anomalies.length > 0">
                <view class="expand-title">⚠️ 异常记录 ({{ process.anomalies.length }}次)</view>
                <view v-for="(an, ai) in process.anomalies" :key="ai" class="anomaly-mini">
                  <text><strong>{{ an.time }} · {{ an.type }}</strong></text>
                  <text>{{ an.description }}</text>
                  <text>处理：{{ an.action }}</text>
                </view>
              </view>
              <view v-if="process.paramLogs.length === 0 && process.anomalies.length === 0" class="empty-record">暂无操作记录
              </view>
            </view>
          </view>
        </view>
        <view v-if="filteredProcesses.length === 0" class="empty-state"><text>暂无工艺</text></view>
      </view>

      <!-- ========== 物料录入弹窗（autoComplete 工序专用，扫码SN） ========== -->
      <nut-popup v-model:visible="showMaterialPanel" position="bottom" round :style="{ height: '70%' }" closeable>
        <view class="material-panel">
          <view class="panel-header">📦 物料录入 - {{ currentProcessForMaterial?.processName }}</view>
          <scroll-view scroll-y class="material-list-scroll">
            <!-- 新物料录入（仅 autoComplete 工序可能存在物料需求） -->
            <view v-for="material in currentProcessForMaterial?.materialList" :key="material.sapCode"
              class="material-item-panel">
              <view class="material-header">
                <text class="material-name">{{ material.materialName }}</text>
                <text class="material-req">需求: {{ material.requiredQty }}{{ material.unit }}</text>
              </view>
              <text class="material-progress">已录入: {{ material.consumedQuantity || 0 }}</text>
              <view v-if="(material.consumedQuantity || 0) < material.requiredQty" class="input-row">
                <nut-input v-model="tempMaterialCode[material.sapCode]"
                  :placeholder="material.isUniqueCode ? '扫描/输入 SN' : '扫描/输入 批次号'"
                  @confirm="() => addMaterialItem(currentProcessForMaterial!, material)" />
                <nut-button size="small" type="primary"
                  @click="() => addMaterialItem(currentProcessForMaterial!, material)">添加</nut-button>
              </view>
              <view v-else class="completed-tag">
                <!-- <nut-icon name="check-circle" color="#0ed57d" size="14" /> -->
                <text>物料数量已满足</text>
              </view>
              <view class="consumed-list">
                <view v-for="(item, idx) in material.consumedItems" :key="idx" class="consumed-item">
                  <text>{{ item.code }} {{ item.quantity > 1 ? `x${item.quantity}` : '' }}</text>
                  <text class="delete-btn"
                    @click="removeMaterialItem(currentProcessForMaterial!, material, idx)">✖</text>
                </view>
              </view>
            </view>

            <!-- 扫码完成区域（autoComplete 工序专用） -->
            <view v-if="currentProcessForMaterial?.autoComplete" class="scan-complete-area">
              <view class="area-title">📷 连续扫码完成加工</view>
              <view class="input-row">
                <nut-input v-model="scanSNInput" placeholder="扫描/输入 SN 码" @confirm="handleScanComplete" />
                <nut-button size="small" type="primary" @click="handleScanComplete">确认</nut-button>
              </view>
              <view class="progress-info">已完成：{{ currentProcessForMaterial.completedQty }} / {{
                currentProcessForMaterial.planQty }}</view>
              <view class="completed-sn-list" v-if="completedSNList.length">
                <text class="list-label">已扫码SN：</text>
                <view class="sn-tags">
                  <text v-for="(sn, idx) in completedSNList" :key="idx" class="sn-tag">{{ sn }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
          <view class="panel-footer">
            <nut-button block plain @click="closeMaterialPanel">关闭</nut-button>
          </view>
        </view>
      </nut-popup>

      <!-- ========== 工艺参数录入弹窗（普通模式 & 列表模式） ========== -->
      <nut-popup v-model:visible="showParamPanel" position="bottom" round :style="{ height: '85%' }" closeable
        close-icon-position="top-right">
        <view class="panel-content">
          <view class="panel-header"><text class="panel-title">📝 录入工艺参数</text></view>
          <scroll-view scroll-y class="panel-body">
            <view class="form-group"><text class="form-label">📦 产品批次号</text><nut-input v-model="paramBatchNo"
                placeholder="批次号" readonly /></view>

            <!-- 普通模式 -->
            <template v-if="!isListMode">
              <view v-for="param in currentParamFields" :key="param.name" class="form-group param-item">
                <text class="form-label">{{ param.name }}<text v-if="param.unit" class="unit">({{ param.unit
                    }})</text><text v-if="param.required" class="required-star">*</text></text>
                <nut-input :type="param.type" v-model="paramFieldValues[param.name]" :placeholder="'请输入' + param.name"
                  class="param-input" @input="(val) => validateParam(param, val)" />
                <text v-if="param.min !== undefined || param.max !== undefined" class="input-hint">范围：{{ param.min ??
                  '无' }} ~ {{ param.max ?? '无' }}</text>
                <view v-if="paramErrorMap[param.name]" class="anomaly-handler">
                  <view class="anomaly-warning">
                    <IconFont name="warning" color="#f5222d" size="14" /><text>当前值 {{ paramFieldValues[param.name] }}
                      超出范围（{{ param.min }}~{{ param.max }}）</text>
                  </view>
                  <view class="anomaly-options"><nut-radio-group v-model="paramActionMap[param.name]"
                      direction="horizontal"><nut-radio label="concession">让步放行</nut-radio><nut-radio
                        label="change">申请变更校验参数</nut-radio></nut-radio-group></view>
                  <view v-if="paramActionMap[param.name] === 'change'" class="change-range-panel">
                    <view class="form-group"><text class="form-label-sm">新最小值</text><nut-input type="number"
                        v-model="paramNewMin[param.name]" :placeholder="param.min?.toString()" /></view>
                    <view class="form-group"><text class="form-label-sm">新最大值</text><nut-input type="number"
                        v-model="paramNewMax[param.name]" :placeholder="param.max?.toString()" /></view>
                    <text class="change-hint">* 提交后将通知主管审核，此工单暂按原范围完成</text>
                  </view>
                </view>
              </view>
              <view v-if="currentParamFields.length === 0" class="empty-param">该工序无额外参数配置</view>
            </template>

            <!-- 列表模式 -->
            <template v-else>
              <view class="list-items-container">
                <text class="list-title">🔁 物料明细列表（可增删）</text>
                <view v-for="(item, idx) in listItems" :key="idx" class="list-item-row">
                  <nut-button v-if="listItems.length > 1" class="delete-row-btn" shape="round" size="small"
                    @click="removeListItem(idx)">✖</nut-button>
                  <view v-for="field in listFieldsDef" :key="field.name" class="form-group">
                    <text class="form-label">{{ field.name }}<text v-if="field.required"
                        class="required-star">*</text></text>
                    <nut-input :type="field.type" v-model="item[field.name]" :placeholder="'请输入' + field.name" />
                  </view>
                </view>
                <nut-button block class="add-row-btn" @click="addListItem">+ 添加一个物料</nut-button>
              </view>
            </template>
          </scroll-view>
          <view class="panel-footer"><nut-button type="primary" block @click="submitParams">✓ 提交工艺参数</nut-button></view>
        </view>
      </nut-popup>

      <!-- ========== 异常记录弹窗 ========== -->
      <nut-popup v-model:visible="showAnomalyPanel" position="bottom" round :style="{ height: 'auto' }" closeable
        close-icon-position="top-right">
        <view class="panel-content">
          <view class="panel-header"><text class="panel-title">⚠️ 记录异常</text></view>
          <view class="panel-body">
            <view class="form-group"><text class="form-label">异常类型</text><nut-input readonly
                :model-value="anomalyForm.type || '请选择'" placeholder="请选择" @click="showAnomalyActionSheet = true" />
            </view>
            <view class="form-group"><text class="form-label">描述</text><nut-input type="textarea"
                v-model="anomalyForm.description" rows="2" /></view>
            <view class="form-group"><text class="form-label">处理措施</text><nut-input type="textarea"
                v-model="anomalyForm.action" rows="2" /></view>
          </view>
          <view class="panel-footer"><nut-button type="danger" block @click="submitAnomaly">提交异常</nut-button></view>
        </view>
      </nut-popup>
      <nut-action-sheet v-model:visible="showAnomalyActionSheet" :menu-items="anomalyTypeOptions" title="请选择异常类型"
        @select="onSelectAnomalyType" cancel-txt="取消" />
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import { IconFont } from '@nutui/icons-vue-taro'
import type { Process, MaterialRequirement, ParamField, ListField, ParamLog } from '@/types/prod-operation'
import TabbarLayout from '@/components/TabbarLayout.vue'
import { useTabbarStore } from '@/store/tabbar'

// ========== 辅助函数 ==========
const showToast = (title: string, icon: 'none' | 'success' = 'none') => {
  Taro.showToast({ title, icon, mask: true })
}

// ========== 工序配置（仅三道工序） ==========
const generateProcesses = (): Process[] => {
  const base = [
    // OP1010 电芯上线：扫码SN自动完成，产出电芯半成品
    {
      id: 'OP1010',
      processName: 'OP1010 · 电芯上线',
      productName: '电芯',
      equipmentName: '手持PDA',
      station: '工位 ZS-001',
      planQty: 10,
      paramConfig: [],
      materialList: [
        {
          sapCode: 'MAT-001',
          materialName: '电芯',
          requiredQty: 1,
          unit: 'EA',
          isUniqueCode: true,
          consumedItems: [],
          consumedQuantity: 0,
        },
      ],
      intermediateDeps: [],
      output: { intermediateId: 'CELL_RAW', qtyPerUnit: 1 },
      autoComplete: true,
    },
    // OP1020 电芯性能测试：参数采集，每件消耗1个电芯半成品，产出测试合格电芯
    {
      id: 'OP1020',
      processName: 'OP1020 · 电芯性能测试',
      productName: '电芯',
      equipmentName: '检测仪',
      station: '工位 G1-05',
      planQty: 10,
      paramConfig: [
        { name: '电芯电压', type: 'digit', unit: 'V', required: true, min: 3.25, max: 3.275 },
        { name: '交流内阻', type: 'digit', unit: 'mΩ', required: true, min: 0.07, max: 0.13 },
      ],
      materialList: [],
      intermediateDeps: [{ sourceProcessId: 'OP1010', requiredPerUnit: 1 }],
      output: { intermediateId: 'CELL_TESTED', qtyPerUnit: 1 },
      autoComplete: false,
    },
    // OP1030 电芯堆叠：列表模式，每件需要2个测试合格电芯 + 绝缘片 + 端板组件
    {
      id: 'OP1030',
      processName: 'OP1030 · 电芯堆叠',
      productName: '电芯模组',
      equipmentName: '堆叠台',
      station: '工位 G4-02',
      planQty: 5,
      paramConfig: [],
      listMode: true,
      listFields: [
        { name: '绝缘片批次码', type: 'text', required: true },
        { name: '端板组件批次码', type: 'text', required: true },
      ],
      materialList: [
        { sapCode: 'MAT-002', materialName: '绝缘片', requiredQty: 1, unit: '片', isUniqueCode: false, consumedItems: [], consumedQuantity: 0 },
        { sapCode: 'MAT-003', materialName: '端板组件', requiredQty: 1, unit: '套', isUniqueCode: false, consumedItems: [], consumedQuantity: 0 },
      ],
      intermediateDeps: [{ sourceProcessId: 'OP1020', requiredPerUnit: 2 }],
      output: { intermediateId: 'MODULE', qtyPerUnit: 1 },
      autoComplete: false,
    },
  ]
  return base.map(p => ({
    ...p,
    batchNo: '',
    status: 'pending',
    completedQty: 0,
    goodQty: 0,
    defectQty: 0,
    startTimeReal: null,
    paramLogs: [],
    anomalies: [],
    materialReady: p.materialList.length === 0,
    intermediateReady: p.intermediateDeps.length === 0,
    progress: 0
  })) as Process[]
}

const processes = ref<Process[]>([])

// ========== 中间件管理 ==========
const intermediateInventory = ref<Record<string, number>>({})
const initIntermediateInventory = () => {
  const inv: Record<string, number> = {}
  processes.value.forEach(p => { if (p.output) inv[p.output.intermediateId] = 0 })
  intermediateInventory.value = inv
}
// 获取某个工序产出的中间件当前可用数量
const getIntermediateAvailable = (sourceProcessId: string) => {
  const sourceProc = processes.value.find(p => p.id === sourceProcessId);
  if (!sourceProc || !sourceProc.output) return 0;
  const intermediateId = sourceProc.output.intermediateId;
  return intermediateInventory.value[intermediateId] || 0;
}
const getProcessName = (id: string) => processes.value.find(p => p.id === id)?.processName || id
const updateIntermediateReady = (proc: Process) => {
  if (!proc.intermediateDeps.length) {
    proc.intermediateReady = true
    return
  }
  // 每次加工所需的中间件数量 = requiredPerUnit
  let canStart = true
  for (const dep of proc.intermediateDeps) {
    const available = getIntermediateAvailable(dep.sourceProcessId)
    const requiredPerUnit = dep.requiredPerUnit
    if (available < requiredPerUnit) {
      canStart = false
      break
    }
  }
  proc.intermediateReady = canStart
}
// 消耗当前工序所需中间件（一件）
const consumeIntermediates = (proc: Process) => {
  if (!proc.intermediateDeps.length) return;
  for (const dep of proc.intermediateDeps) {
    const sourceProc = processes.value.find(p => p.id === dep.sourceProcessId);
    if (sourceProc && sourceProc.output) {
      const intermediateId = sourceProc.output.intermediateId;
      const current = intermediateInventory.value[intermediateId] || 0;
      intermediateInventory.value[intermediateId] = current - dep.requiredPerUnit;
    }
  }
  updateAllIntermediateReady();
}
const updateAllIntermediateReady = () => processes.value.forEach(p => updateIntermediateReady(p))
// 增加产出（保持不变，但注意不要重复调用）
const addOutput = (proc: Process, qty: number) => {
  if (!proc.output) return;
  const id = proc.output.intermediateId;
  intermediateInventory.value[id] = (intermediateInventory.value[id] || 0) + qty;
  // 更新所有依赖此产出的工序的中间件状态
  processes.value.forEach(p => {
    if (p.intermediateDeps.some(dep => dep.sourceProcessId === proc.id)) {
      updateIntermediateReady(p);
    }
  });
}

// ========== 状态筛选 ==========
const filterStatus = ref<'all' | 'pending' | 'progressing' | 'completed'>('all')
const pendingCount = computed(() => processes.value.filter(p => p.status === 'pending').length)
const inProgressCount = computed(() => processes.value.filter(p => p.status === 'progressing').length)
const completedCount = computed(() => processes.value.filter(p => p.status === 'completed').length)
const filteredProcesses = computed(() => {
  if (filterStatus.value === 'all') return processes.value
  return processes.value.filter(p => p.status === filterStatus.value)
})
const statusLabel = (s: string) => ({ pending: '待处理', progressing: '加工中', completed: '已完成' }[s] || s)
const statusBadgeClass = (s: string) => ({ pending: 'badge-pending', progressing: 'badge-processing', completed: 'badge-completed' }[s] || '')
const progressPercent = (p: Process) => p.planQty ? Math.round((p.completedQty / p.planQty) * 100) : 0
const formatDuration = (p: Process) => {
  if (!p.startTimeReal) return '--'
  const diff = Date.now() - p.startTimeReal
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}
const expandedSet = ref<Set<string>>(new Set())
const toggleExpand = (p: Process) => {
  if (expandedSet.value.has(p.id)) expandedSet.value.delete(p.id)
  else expandedSet.value.add(p.id)
}

// ========== 物料录入（autoComplete 工序） ==========
const showMaterialPanel = ref(false)
const currentProcessForMaterial = ref<Process | null>(null)
const tempMaterialCode = reactive<Record<string, string>>({})
const scanSNInput = ref('')
const completedSNList = ref<string[]>([])

const openMaterialPanel = (process: Process) => {
  currentProcessForMaterial.value = process
  if (process.autoComplete) {
    completedSNList.value = process.paramLogs
      .filter(log => !log.isListMode)
      .map(log => (log.values.find(v => v.name === 'SN')?.value as string) || '')
      .filter(Boolean)
  }
  showMaterialPanel.value = true
}
const closeMaterialPanel = () => {
  showMaterialPanel.value = false
  currentProcessForMaterial.value = null
  scanSNInput.value = ''
}
const addMaterialItem = (process: Process, material: MaterialRequirement) => {
  const code = tempMaterialCode[material.sapCode]?.trim()
  if (!code) { showToast('请输入物料编码', 'none'); return }
  if (!material.consumedItems) material.consumedItems = []
  if (material.isUniqueCode) {
    if (material.consumedItems.some(i => i.code === code)) { showToast('该SN已录入', 'none'); return }
    material.consumedItems.push({ code, quantity: 1, timestamp: Date.now() })
  } else {
    const existing = material.consumedItems.find(i => i.code === code)
    if (existing) existing.quantity += 1
    else material.consumedItems.push({ code, quantity: 1, timestamp: Date.now() })
  }
  material.consumedQuantity = material.consumedItems.reduce((s, i) => s + i.quantity, 0)
  tempMaterialCode[material.sapCode] = ''
  const allReady = process.materialList.every(m => (m.consumedQuantity || 0) >= m.requiredQty)
  if (allReady !== process.materialReady) process.materialReady = allReady
}
const removeMaterialItem = (process: Process, material: MaterialRequirement, idx: number) => {
  if (!material.consumedItems) {
    return
  }
  material.consumedItems.splice(idx, 1)
  material.consumedQuantity = material.consumedItems.reduce((s, i) => s + i.quantity, 0)
  const allReady = process.materialList.every(m => (m.consumedQuantity || 0) >= m.requiredQty)
  if (allReady !== process.materialReady) process.materialReady = allReady
}
const handleScanComplete = () => {
  const process = currentProcessForMaterial.value
  if (!process || !process.autoComplete) return
  const sn = scanSNInput.value.trim()
  if (!sn) { showToast('请输入SN码', 'none'); return }
  if (process.completedQty >= process.planQty) { showToast('该工序已完成，无需再扫码', 'none'); return }
  process.paramLogs.push({
    batchNo: sn,
    isListMode: false,
    values: [{ name: 'SN', value: sn, unit: '' }],
    timestamp: Date.now(),
  })
  process.completedQty += 1
  process.goodQty += 1
  if (process.status === 'pending') { process.status = 'progressing'; process.startTimeReal = Date.now() }
  process.progress = Math.round((process.completedQty / process.planQty) * 100)
  if (process.completedQty >= process.planQty) {
    process.status = 'completed'
    showToast(`${process.processName} 已完成！`, 'success')
    setTimeout(() => closeMaterialPanel(), 1500)
  } else {
    showToast(`已扫码 ${process.completedQty}/${process.planQty}，继续扫码`, 'success')
  }
  consumeIntermediates(process);
  if (process.output) addOutput(process, 1 * (process.output.qtyPerUnit || 1))
  scanSNInput.value = ''
  completedSNList.value = process.paramLogs.filter(log => !log.isListMode).map(log => (log.values.find(v => v.name === 'SN')?.value as string) || '').filter(Boolean)
}

// ========== 参数录入弹窗（普通/列表模式） ==========
const showParamPanel = ref(false)
const paramTargetProcess = ref<Process | null>(null)
const currentParamFields = ref<ParamField[]>([])
const paramFieldValues = reactive<Record<string, any>>({})
const paramBatchNo = ref('')
const isListMode = ref(false)
const listFieldsDef = ref<ListField[]>([])
const listItems = ref<any[]>([])
const paramErrorMap = reactive<Record<string, boolean>>({})
const paramActionMap = reactive<Record<string, string>>({})
const paramNewMin = reactive<Record<string, number>>({})
const paramNewMax = reactive<Record<string, number>>({})
const seqCounter = ref<Record<string, number>>({})
const generateBatchNo = (processId: string) => {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const seq = (seqCounter.value[processId] || 0) + 1
  const seqStr = String(seq).padStart(4, '0')
  return `BT${yearMonth}${processId}${seqStr}`
}
const incrementSeq = (processId: string) => { seqCounter.value[processId] = (seqCounter.value[processId] || 0) + 1 }
const openParamPanel = (process: Process) => {
  paramTargetProcess.value = process
  paramBatchNo.value = generateBatchNo(process.id)
  isListMode.value = !!process.listMode
  if (isListMode.value && process.listFields) {
    listFieldsDef.value = process.listFields
    listItems.value = []
    const newItem: any = {}
    listFieldsDef.value.forEach(f => { newItem[f.name] = '' })
    listItems.value.push(newItem)
  } else {
    currentParamFields.value = process.paramConfig || []
    Object.keys(paramFieldValues).forEach(k => delete paramFieldValues[k])
    currentParamFields.value.forEach(f => { paramFieldValues[f.name] = null })
    Object.keys(paramErrorMap).forEach(k => delete paramErrorMap[k])
    Object.keys(paramActionMap).forEach(k => delete paramActionMap[k])
    Object.keys(paramNewMin).forEach(k => delete paramNewMin[k])
    Object.keys(paramNewMax).forEach(k => delete paramNewMax[k])
  }
  showParamPanel.value = true
}
const validateParam = (param: ParamField, val: any) => {
  if (param.type !== 'number') return
  const num = Number(val)
  if (isNaN(num)) { paramErrorMap[param.name] = false; return }
  const min = param.min ?? -Infinity, max = param.max ?? Infinity
  const out = num < min || num > max
  paramErrorMap[param.name] = out
  if (!out) {
    delete paramActionMap[param.name]
    delete paramNewMin[param.name]
    delete paramNewMax[param.name]
  }
}
const addListItem = () => {
  const newItem: any = {}
  listFieldsDef.value.forEach(f => { newItem[f.name] = '' })
  listItems.value.push(newItem)
}
const removeListItem = (idx: number) => {
  if (listItems.value.length > 1) listItems.value.splice(idx, 1)
  else showToast('至少保留一行物料', 'none')
}
const submitParams = async () => {
  if (!paramTargetProcess.value) return
  const process = paramTargetProcess.value
  if (!paramBatchNo.value.trim()) { showToast('批次号无效', 'none'); return }

  // 列表模式
  if (isListMode.value) {
    for (let i = 0; i < listItems.value.length; i++) {
      const item = listItems.value[i]
      for (const field of listFieldsDef.value) {
        if (field.required && (!item[field.name] || item[field.name].trim() === '')) {
          showToast(`第 ${i + 1} 行：${field.name} 为必填项`, 'none'); return
        }
      }
    }
    process.paramLogs.push({
      batchNo: paramBatchNo.value.trim(),
      isListMode: true,
      items: listItems.value.map(item => {
        const copy: Record<string, string> = {}
        listFieldsDef.value.forEach(f => { copy[f.name] = item[f.name] || '' })
        return copy
      }),
      timestamp: Date.now(),
    })
    const delta = 1
    process.completedQty += delta
    process.goodQty += delta
    if (process.status === 'pending') { process.status = 'progressing'; process.startTimeReal = Date.now() }
    process.progress = Math.round((process.completedQty / process.planQty) * 100)
    consumeIntermediates(process);                 // 添加这一行
    if (process.output) addOutput(process, delta * (process.output.qtyPerUnit || 1))
    if (process.completedQty >= process.planQty) {
      process.status = 'completed'
      showToast(`${process.processName} 已完成！`, 'success')
      showParamPanel.value = false
      return
    }
    paramBatchNo.value = generateBatchNo(process.id)
    listItems.value = []
    const newItem: any = {}
    listFieldsDef.value.forEach(f => { newItem[f.name] = '' })
    listItems.value.push(newItem)
    showToast(`已提交第 ${process.completedQty} 件，继续下一件`, 'success')
    return
  }

  // 普通模式
  const anomalyList: any[] = []
  for (const field of currentParamFields.value) {
    const val = paramFieldValues[field.name]
    if (field.required && (val === null || val === '' || (field.type === 'number' && isNaN(Number(val))))) {
      showToast(`请填写必填参数: ${field.name}`, 'none'); return
    }
    if (field.type === 'number' && val !== null && val !== '') {
      const num = Number(val)
      if (isNaN(num)) { showToast(`${field.name} 需为数字`, 'none'); return }
      if (field.min !== undefined && num < field.min) { showToast(`${field.name} 不能小于 ${field.min}`, 'none'); return }
      if (field.max !== undefined && num > field.max) { showToast(`${field.name} 不能大于 ${field.max}`, 'none'); return }
      paramFieldValues[field.name] = num
    }
  }
  for (const field of currentParamFields.value) {
    if (paramErrorMap[field.name]) {
      if (!paramActionMap[field.name]) { showToast(`请为参数 ${field.name} 选择处理方式`, 'none'); return }
      let actionDesc = ''
      if (paramActionMap[field.name] === 'concession') actionDesc = '让步放行'
      else if (paramActionMap[field.name] === 'change') {
        const newMin = paramNewMin[field.name] ?? field.min
        const newMax = paramNewMax[field.name] ?? field.max
        actionDesc = `申请变更参数范围至 ${newMin}~${newMax}`
      }
      anomalyList.push({ paramName: field.name, actualValue: paramFieldValues[field.name], expectedRange: `${field.min}~${field.max}`, action: actionDesc })
    }
  }
  if (anomalyList.length) {
    const description = anomalyList.map(a => `${a.paramName}=${a.actualValue}（应${a.expectedRange}）`).join('；')
    process.anomalies.push({ time: new Date().toLocaleString(), type: '参数超标', description, action: anomalyList.map(a => `${a.paramName}：${a.action}`).join('；') })
    showToast('已记录参数超标异常', 'none')
  }
  const valuesArr = currentParamFields.value.map(f => ({ name: f.name, value: paramFieldValues[f.name] !== undefined ? paramFieldValues[f.name] : '--', unit: f.unit || '' })).filter(v => v.value !== '--')
  process.paramLogs.push({ batchNo: paramBatchNo.value.trim(), isListMode: false, values: valuesArr, timestamp: Date.now() })
  const delta = 1
  process.completedQty += delta
  // 增加产出
  const hasSerious = anomalyList.some(a => a.action !== '让步放行')
  if (hasSerious) process.defectQty += delta
  else process.goodQty += delta
  if (process.status === 'pending') { process.status = 'progressing'; process.startTimeReal = Date.now() }
  process.progress = Math.round((process.completedQty / process.planQty) * 100)
    // 消耗中间件
  consumeIntermediates(process);
  if (process.output) addOutput(process, delta * (process.output.qtyPerUnit || 1))
  if (process.completedQty >= process.planQty) {
    process.status = 'completed'
    showToast(`${process.processName} 已完成！`, 'success')
    showParamPanel.value = false
    return
  }
  paramBatchNo.value = generateBatchNo(process.id)
  Object.keys(paramFieldValues).forEach(k => delete paramFieldValues[k])
  currentParamFields.value.forEach(f => { paramFieldValues[f.name] = null })
  Object.keys(paramErrorMap).forEach(k => delete paramErrorMap[k])
  Object.keys(paramActionMap).forEach(k => delete paramActionMap[k])
  Object.keys(paramNewMin).forEach(k => delete paramNewMin[k])
  Object.keys(paramNewMax).forEach(k => delete paramNewMax[k])
  showToast(`已提交第 ${process.completedQty} 件，继续下一件`, 'success')
}

// ========== 异常记录 ==========
const showAnomalyPanel = ref(false)
const anomalyTargetProcess = ref<Process | null>(null)
const anomalyForm = reactive({ type: '', description: '', action: '' })
const showAnomalyActionSheet = ref(false)
const anomalyTypeOptions = [{ name: '设备故障' }, { name: '物料异常' }, { name: '其他' }]
const openAnomalyPanel = (process: Process) => { anomalyTargetProcess.value = process; anomalyForm.type = ''; anomalyForm.description = ''; anomalyForm.action = ''; showAnomalyPanel.value = true }
const onSelectAnomalyType = (item: { name: string }) => { anomalyForm.type = item.name }
const submitAnomaly = () => {
  if (!anomalyTargetProcess.value || !anomalyForm.type || !anomalyForm.description) { showToast('请填写异常类型和描述', 'none'); return }
  anomalyTargetProcess.value.anomalies.push({ time: new Date().toLocaleTimeString(), type: anomalyForm.type, description: anomalyForm.description, action: anomalyForm.action || '待处理' })
  showAnomalyPanel.value = false
  showToast('异常已记录', 'success')
}

onMounted(() => {
  processes.value = generateProcesses()
  initIntermediateInventory()
  updateAllIntermediateReady()
  useTabbarStore().setSelected(1)
})
</script>

<style lang="scss" scoped>
@import './prod-operation.scss';
</style>
