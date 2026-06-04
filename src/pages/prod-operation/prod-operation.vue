<template>
  <view class="prod-operation-page">
    <!-- 顶部人员信息栏 -->
    <view class="top-bar">
      <view class="top-bar-left">
        <view class="avatar">👷</view>
        <view class="worker-info">
          <view class="worker-name">王鹏</view>
          <view class="worker-meta">工号：149817 · 储能中试线</view>
        </view>
      </view>
      <view class="top-bar-right">
        <nut-button title="刷新任务" shape="round" class="refresh-btn" @click="refreshTasks">⟳</nut-button>
      </view>
    </view>

    <!-- 统计卡片（筛选） -->
    <scroll-view scroll-x class="stats-row">
      <view class="stat-card" :class="{ 'active-filter': filterStatus === 'all' }" @click="filterStatus = 'all'">
        <view class="stat-number blue">{{ tasks.length }}</view>
        <view class="stat-label">全部任务</view>
      </view>
      <view class="stat-card" :class="{ 'active-filter': filterStatus === 'pending' }" @click="filterStatus = 'pending'">
        <view class="stat-number blue">{{ pendingCount }}</view>
        <view class="stat-label">待处理</view>
      </view>
      <view class="stat-card" :class="{ 'active-filter': filterStatus === 'progressing' }" @click="filterStatus = 'progressing'">
        <view class="stat-number orange">{{ inProgressCount }}</view>
        <view class="stat-label">进行中</view>
      </view>
      <view class="stat-card" :class="{ 'active-filter': filterStatus === 'completed' }" @click="filterStatus = 'completed'">
        <view class="stat-number green">{{ completedCount }}</view>
        <view class="stat-label">已完成</view>
      </view>
      <view class="stat-card" :class="{ 'active-filter': filterStatus === 'anomaly' }" @click="filterStatus = 'anomaly'">
        <view class="stat-number red">{{ anomalyTaskCount }}</view>
        <view class="stat-label">含异常</view>
      </view>
    </scroll-view>

    <!-- 任务列表 -->
    <view class="task-list">
      <view v-for="task in filteredTasks" :key="task.id">
        <view class="task-card" :class="[
          `status-${task.status}`,
          { 'has-anomaly': task.anomalies.length > 0 && task.status === 'progressing' }
        ]">
          <view class="task-header">
            <text class="task-process-name">{{ task.processName }}</text>
            <view class="task-badges">
              <text v-if="task.anomalies.length > 0 && task.status === 'progressing'" class="badge badge-anomaly">异常</text>
              <text class="badge" :class="statusBadgeClass(task.status)">{{ statusLabel(task.status) }}</text>
            </view>
          </view>
          <view class="task-body">
            <view class="task-info-row">
              <text>📦 {{ task.productName }}</text>
              <text class="highlight">#{{ task.batchNo }}</text>
            </view>
            <view class="task-info-row">
              <text>⚙️ {{ task.equipmentName || '未指定' }}</text>
              <text>📍 {{ task.station }}</text>
            </view>
            <view class="progress-mini">
              <view class="progress-mini-bar">
                <nut-progress :status="task.status == 'progressing' ? 'active' : 'icon'"
                  :percentage="progressPercent(task)" :show-text="false" stroke-color="blue" />
              </view>
              <view>{{ task.completedQty }} / {{ task.planQty }} 件</view>
              <view v-if="task.status === 'progressing' && task.startTimeReal" class="task-duration">
                ⏱️ {{ formatDuration(task) }}
              </view>
            </view>
          </view>
          <view class="task-actions">
            <nut-button v-if="task.status === 'pending'" type="primary" size="small" block @click="startTask(task)">开始处理</nut-button>
            <view v-else-if="task.status === 'progressing'" class="progressing-actions">
              <nut-button type="primary" size="small" @click="openParamPanel(task)">录入参数</nut-button>
              <nut-button type="danger" size="small" plain @click="openAnomalyPanel(task)">记录异常</nut-button>
              <nut-button type="success" size="small" plain @click="completeTask(task)">完成生产</nut-button>
            </view>
            <view v-else-if="task.status === 'completed'">
              <nut-button type="info" size="small" plain @click="toggleExpand(task)">🔍 {{ expandedSet.has(task.id) ? '收起详情' : '查看详情' }}</nut-button>
            </view>
            <nut-button v-if="task.status === 'progressing' && (task.paramLogs.length > 0 || task.anomalies.length > 0)"
              size="small" type="info" plain @click="toggleExpand(task)">
              {{ expandedSet.has(task.id) ? '收起记录' : '展开记录' }}
            </nut-button>
          </view>
          <view v-if="expandedSet.has(task.id)" class="task-expand">
            <view v-if="task.paramLogs.length > 0">
              <view class="expand-title">📋 工艺参数记录 ({{ task.paramLogs.length }}次)</view>
              <view v-for="(log, idx) in task.paramLogs" :key="idx" class="param-log-card">
                <view class="param-log-batch">🏷️ 批次号：{{ log.batchNo || task.batchNo }}</view>
                <view v-if="!log.isListMode" class="param-log-values">
                  <text v-for="(v, vi) in log.values" :key="vi" class="param-value-tag">
                    {{ v.name }}: {{ v.value }}{{ v.unit ? ' ' + v.unit : '' }}
                  </text>
                </view>
                <view v-else>
                  <view v-for="(item, itemIdx) in log.items" :key="itemIdx" class="list-item-detail">
                    <text class="list-item-title">📌 物料 #{{ itemIdx + 1 }}</text>
                    <view class="param-log-values">
                      <text v-for="(val, fName) in item" :key="fName" class="param-value-tag">
                        {{ fName }}: {{ val }}
                      </text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <view v-if="task.anomalies.length > 0">
              <view class="expand-title">⚠️ 异常记录 ({{ task.anomalies.length }}次)</view>
              <view v-for="(an, ai) in task.anomalies" :key="ai" class="anomaly-mini">
                <text><strong>{{ an.time }} · {{ an.type }}</strong></text>
                <text>{{ an.description }}</text>
                <text>处理：{{ an.action }}</text>
              </view>
            </view>
            <view v-if="task.paramLogs.length === 0 && task.anomalies.length === 0" class="empty-record">暂无操作记录</view>
          </view>
        </view>
      </view>
      <view v-if="filteredTasks.length === 0" class="empty-state">
        <view class="empty-icon">📋</view>
        <view class="empty-title">暂无任务</view>
      </view>
    </view>

    <!-- 工艺参数面板 -->
    <nut-popup v-model:visible="showParamPanel" position="bottom" round :style="{ height: '90%' }" closeable close-icon-position="top-right">
      <view class="panel-content">
        <view class="panel-header">
          <text class="panel-title">📝 录入工艺参数</text>
        </view>
        <scroll-view class="panel-body" scroll-y>
          <view class="form-group">
            <text class="form-label">📦 产品批次号 <text class="required-star">*</text></text>
            <nut-input v-model="paramBatchNo" placeholder="请输入批次号" />
          </view>

          <!-- 普通参数录入模式 -->
          <view v-if="!isListMode">
            <view v-for="(param, idx) in currentParamFields" :key="idx" class="form-group param-item">
              <text class="form-label">
                {{ param.name }}
                <text v-if="param.unit" class="unit">({{ param.unit }})</text>
                <text v-if="param.required" class="required-star">*</text>
              </text>
              <nut-input :type="param.type === 'digit' ? 'number' : 'text'" v-model="paramFieldValues[param.name]"
                :placeholder="'请输入' + param.name" @blur="validateSingleParam(param)" />

              <!-- 参数异常处理区域 -->
              <view v-if="paramErrorMap[param.name]" class="anomaly-handler">
                <view class="anomaly-warning">
                  <IconFont name="notice" color="#f5222d" size="14px" />
                  <text>当前值 {{ paramFieldValues[param.name] }} 超出范围（{{ param.min }}~{{ param.max }}）</text>
                </view>
                <view class="anomaly-options">
                  <nut-radio-group v-model="paramActionMap[param.name]" direction="horizontal">
                    <nut-radio label="concession">让步放行</nut-radio>
                    <nut-radio label="change">申请变更校验参数</nut-radio>
                  </nut-radio-group>
                </view>
                <view v-if="paramActionMap[param.name] === 'change'" class="change-range-panel">
                  <view class="form-group">
                    <text class="form-label-sm">新最小值</text>
                    <nut-input type="number" v-model="paramNewMin[param.name]" :placeholder="param.min?.toString()" />
                  </view>
                  <view class="form-group">
                    <text class="form-label-sm">新最大值</text>
                    <nut-input type="number" v-model="paramNewMax[param.name]" :placeholder="param.max?.toString()" />
                  </view>
                  <view class="form-group">
                    <text class="form-label-sm">变更理由</text>
                    <nut-input v-model="paramChangeReason[param.name]" placeholder="请填写变更理由" />
                  </view>
                  <text class="change-hint">* 提交后将通知主管审核，审核完成前此工序将暂停</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 列表录入模式（物料明细） -->
          <view v-else>
            <view class="list-items-container">
              <text class="list-title">🔁 物料明细列表（可增删）</text>
              <view v-for="(item, idx) in listItems" :key="idx" class="list-item-row">
                <nut-button v-if="listItems.length > 1" class="delete-row-btn" shape="round" size="small" @click="removeListItem(idx)">✖</nut-button>
                <view v-for="field in listFieldsDef" :key="field.name" class="form-group">
                  <text class="form-label">{{ field.name }}<text v-if="field.required" class="required-star">*</text></text>
                  <nut-input :type="field.type" v-model="item[field.name]" :placeholder="'请输入' + field.name" />
                </view>
              </view>
              <nut-button block class="add-row-btn" @click="addListItem">+ 添加一个物料</nut-button>
            </view>
          </view>
        </scroll-view>
        <view class="panel-footer">
          <nut-button type="primary" size="large" block @click="submitParams">提交参数</nut-button>
        </view>
      </view>
    </nut-popup>

    <!-- 异常记录面板 -->
    <nut-popup v-model:visible="showAnomalyPanel" position="bottom" round :style="{ maxHeight: '80vh' }" closeable close-icon-position="top-right">
      <view class="panel-content">
        <view class="panel-header">
          <text class="panel-title">⚠️ 记录异常</text>
        </view>
        <scroll-view class="panel-body" scroll-y>
          <view class="form-group">
            <text class="form-label">异常类型 <text class="required-star">*</text></text>
            <nut-input readonly :model-value="anomalyForm.type || '请选择'" placeholder="请选择异常类型" @click="showAnomalyActionSheet = true" />
          </view>
          <view class="form-group">
            <text class="form-label">描述 <text class="required-star">*</text></text>
            <nut-input type="textarea" v-model="anomalyForm.description" rows="3" placeholder="请详细描述异常情况" />
          </view>
          <view class="form-group">
            <text class="form-label">处理措施</text>
            <nut-input type="textarea" v-model="anomalyForm.action" rows="2" placeholder="已采取的处理措施" />
          </view>
        </scroll-view>
        <view class="panel-footer">
          <nut-button type="danger" size="large" block @click="submitAnomaly">提交异常</nut-button>
        </view>
      </view>
    </nut-popup>

    <!-- 异常类型选择器 -->
    <nut-action-sheet v-model:visible="showAnomalyActionSheet" :menu-items="anomalyTypeOptions" @choose="onSelectAnomalyType" cancel-txt="取消" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { showToast, vibrateShort } from '@tarojs/taro'
import { IconFont } from '@nutui/icons-vue-taro'
// import type { Task, ParamField, ListField, ParamLog, AnomalyRecord } from '@/types/prod-operation'
import { InputType } from '@nutui/nutui-taro'

// 由于实际项目中types文件可能存在，这里提供备用类型定义以确保代码运行
// 若已有类型定义文件，可删除以下类型声明块

  export interface ParamField {
    name: string
    type: InputType
    unit?: string
    required?: boolean
    min?: number
    max?: number
  }
  export interface ListField {
    name: string
    type: InputType
    required?: boolean
  }
  export interface ParamLog {
    batchNo: string
    isListMode: boolean
    values?: Array<{ name: string; value: string | number; unit?: string }>
    items?: Array<Record<string, string>>
    timestamp: number
  }
  export interface AnomalyRecord {
    time: string
    type: string
    description: string
    action: string
  }
  export interface Task {
    id: string
    processName: string
    productName: string
    batchNo: string
    equipmentName: string
    station: string
    planQty: number
    completedQty: number
    defectQty: number
    status: 'pending' | 'progressing' | 'completed'
    startTimeReal?: number
    paramLogs: ParamLog[]
    anomalies: AnomalyRecord[]
    paramConfig: ParamField[]
    listMode?: boolean
    listFields?: ListField[]
  }


// ---------- 模拟任务数据 ----------
const tasks = ref<Task[]>([
  {
    id: 'OP1010',
    processName: 'OP1010 · 电芯上线',
    productName: '电芯 A-770',
    batchNo: 'BT-20260529-01',
    equipmentName: '手持PDA',
    station: '工位 ZS-001',
    planQty: 20,
    completedQty: 0,
    defectQty: 0,
    status: 'pending',
    paramLogs: [],
    anomalies: [],
    paramConfig: []
  },
  {
    id: 'OP1020',
    processName: 'OP1020 · 电芯性能测试',
    productName: '电池模组托盘',
    batchNo: 'BT-20260529-05',
    equipmentName: '检测仪',
    station: '工位 G1-05',
    planQty: 20,
    completedQty: 5,
    defectQty: 0,
    status: 'progressing',
    startTimeReal: Date.now() - 2.5 * 3600000,
    paramLogs: [{ batchNo: 'BT-20260529-22', isListMode: false, values: [{ name: '电压', value: '1.8', unit: 'V' }], timestamp: Date.now() - 3600000 }],
    anomalies: [],
    paramConfig: [
      { name: '电压', type: 'digit', unit: 'V', required: true, min: 1.75, max: 1.85 },
      { name: '交流内阻', type: 'digit', unit: 'mΩ', required: true, min: 0.07, max: 0.13 },
      { name: '内阻极差', type: 'digit', unit: 'mΩ', required: true, min: 0, max: 0.03 },
      { name: '探针使用寿命', type: 'number', unit: '次', required: false, min: 0, max: 300000 }
    ]
  },
  {
    id: 'OP1030',
    processName: 'OP1030 · 端板组件与两端电芯粘贴',
    productName: '电芯 A770_Pack',
    batchNo: 'BT-20260529-05',
    equipmentName: '',
    station: '工位 G2-18',
    planQty: 5,
    completedQty: 5,
    defectQty: 0,
    status: 'completed',
    paramLogs: [
      { batchNo: 'BT-20260529-01', isListMode: false, values: [{ name: '夹持力', value: '893', unit: 'N' }], timestamp: Date.now() - 86400000 },
      { batchNo: 'BT-20260529-02', isListMode: false, values: [{ name: '夹持力', value: '901', unit: 'N' }], timestamp: Date.now() - 86400000 }
    ],
    anomalies: [
      { time: '18:15:33', type: '参数异常', description: 'BT-20260529-01 夹持力 < 900', action: '让步放行' }
    ],
    paramConfig: [{ name: '夹持力', type: 'number', unit: 'N', min: 550, max: 1650 }]
  },
  {
    id: 'OP1040',
    processName: 'OP1050 · 电芯堆叠',
    productName: '电芯 A700 STACK',
    batchNo: 'BT-20260529-02',
    equipmentName: '堆叠台',
    station: '工位 G4-02',
    planQty: 5,
    completedQty: 2,
    defectQty: 0,
    status: 'progressing',
    startTimeReal: Date.now() - 1.2 * 3600000,
    paramLogs: [],
    anomalies: [],
    paramConfig: [],
    listMode: true,
    listFields: [
      { name: '电芯二维码', type: 'text', required: true },
      { name: '绝缘片批次码', type: 'text', required: true },
      { name: '端板组件批次码', type: 'text', required: true }
    ]
  }
])

// ---------- 状态筛选 ----------
const filterStatus = ref<'all' | 'pending' | 'progressing' | 'completed' | 'anomaly'>('all')

const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const inProgressCount = computed(() => tasks.value.filter(t => t.status === 'progressing').length)
const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length)
const anomalyTaskCount = computed(() => tasks.value.filter(t => t.status === 'progressing' && t.anomalies.length > 0).length)

const filteredTasks = computed(() => {
  if (filterStatus.value === 'all') return tasks.value
  if (filterStatus.value === 'anomaly') return tasks.value.filter(t => t.status === 'progressing' && t.anomalies.length > 0)
  return tasks.value.filter(t => t.status === filterStatus.value)
})

// 辅助函数
const statusLabel = (s: string) => {
  const map: Record<string, string> = { pending: '待处理', progressing: '加工中', completed: '已完成' }
  return map[s] || s
}
const statusBadgeClass = (s: string) => {
  const map: Record<string, string> = { pending: 'badge-pending', progressing: 'badge-processing', completed: 'badge-completed' }
  return map[s] || ''
}
const progressPercent = (t: Task) => (t.planQty ? Math.round((t.completedQty / t.planQty) * 100) : 0)
const formatDuration = (t: Task) => {
  if (!t.startTimeReal) return '--'
  const diff = Date.now() - t.startTimeReal
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

// 刷新任务（模拟）
const refreshTasks = () => {
  showToast({ title: '已刷新', icon:'none' ,duration: 500 })
}

// 领取任务
const startTask = (task: Task) => {
  task.status = 'progressing'
  task.startTimeReal = Date.now()
  task.completedQty = 0
  showToast({ title: '已领取任务', duration: 500 })
}

// 完成任务
const completeTask = (task: Task) => {
  if (task.completedQty < task.planQty) {
    showToast({icon:'none',  title: `尚有 ${task.planQty - task.completedQty} 件未完成，请确认产量`, duration: 1500, })
    return
  }
  task.status = 'completed'
  showToast({ title: '任务已完成', duration: 500 })
}

// 展开/收起
const expandedSet = ref<Set<string>>(new Set())
const toggleExpand = (task: Task) => {
  if (expandedSet.value.has(task.id)) expandedSet.value.delete(task.id)
  else expandedSet.value.add(task.id)
}

// ---------- 工艺参数面板 ----------
const showParamPanel = ref(false)
const paramTarget = ref<Task | null>(null)
const currentParamFields = ref<ParamField[]>([])
const paramFieldValues = reactive<Record<string, string | number>>({})
const paramBatchNo = ref('')
const isListMode = ref(false)
const listFieldsDef = ref<ListField[]>([])
const listItems = ref<any[]>([])

// 参数异常状态
const paramErrorMap = reactive<Record<string, boolean>>({})
const paramActionMap = reactive<Record<string, string>>({})
const paramChangeReason = reactive<Record<string, string>>({})
const paramNewMin = reactive<Record<string, number>>({})
const paramNewMax = reactive<Record<string, number>>({})

// 打开工艺参数面板
const openParamPanel = (task: Task) => {
  paramTarget.value = task
  paramBatchNo.value = task.batchNo || ''

  // 重置异常相关状态
  Object.keys(paramErrorMap).forEach(k => delete paramErrorMap[k])
  Object.keys(paramActionMap).forEach(k => delete paramActionMap[k])
  Object.keys(paramChangeReason).forEach(k => delete paramChangeReason[k])
  Object.keys(paramNewMin).forEach(k => delete paramNewMin[k])
  Object.keys(paramNewMax).forEach(k => delete paramNewMax[k])

  if (task.listMode === true && task.listFields?.length) {
    isListMode.value = true
    listFieldsDef.value = task.listFields.map(f => ({ ...f }))
    listItems.value = []
    const newItem: any = {}
    listFieldsDef.value.forEach(f => { newItem[f.name] = '' })
    listItems.value.push(newItem)
  } else {
    isListMode.value = false
    const config = task.paramConfig || []
    currentParamFields.value = config.map(p => ({ ...p }))
    Object.keys(paramFieldValues).forEach(k => delete paramFieldValues[k])
    currentParamFields.value.forEach(f => { paramFieldValues[f.name] = '' })
  }
  showParamPanel.value = true
}

// 单个参数实时校验
const validateSingleParam = (param: ParamField) => {
  const val = paramFieldValues[param.name]
  if (val === undefined || val === null || val === '') {
    paramErrorMap[param.name] = false
    return
  }
  const num = Number(val)
  if (isNaN(num)) {
    paramErrorMap[param.name] = false
    return
  }
  const min = param.min ?? -Infinity
  const max = param.max ?? Infinity
  const outOfRange = num < min || num > max
  paramErrorMap[param.name] = outOfRange
  if (!outOfRange) {
    delete paramActionMap[param.name]
    delete paramNewMin[param.name]
    delete paramNewMax[param.name]
    delete paramChangeReason[param.name]
  }
}

// 监听参数值变化，批量校验
watch(
  () => paramFieldValues,
  () => {
    for (const param of currentParamFields.value) {
      validateSingleParam(param)
    }
  },
  { deep: true }
)

const addListItem = () => {
  const newItem: any = {}
  listFieldsDef.value.forEach(f => { newItem[f.name] = '' })
  listItems.value.push(newItem)
}

const removeListItem = (idx: number) => {
  if (listItems.value.length > 1) listItems.value.splice(idx, 1)
  else showToast( {icon:'none', title: '至少保留一行物料', duration: 500 })
}

// 触发震动
const vibrate = () => {
  try {
    vibrateShort({ type: 'heavy' })
  } catch (e) {
    console.log('震动 API 调用失败', e)
  }
}

const submitParams = () => {
  if (!paramTarget.value) return
  if (!paramBatchNo.value.trim()) {
    showToast({ icon:'none', title: '请填写产品批次号', duration: 500 })
    return
  }

  if (isListMode.value) {
    // 校验列表模式所有行必填
    for (let i = 0; i < listItems.value.length; i++) {
      const item = listItems.value[i]
      for (const f of listFieldsDef.value) {
        if (f.required && (!item[f.name] || item[f.name].trim() === '')) {
          vibrate()
          showToast({ icon:'none',   title: `第${i+1}行：${f.name}不能为空`, duration: 500 })
          return
        }
      }
    }
    const logEntry: ParamLog = {
      batchNo: paramBatchNo.value.trim(),
      isListMode: true,
      items: listItems.value.map(item => {
        const copy: Record<string, string> = {}
        listFieldsDef.value.forEach(f => { copy[f.name] = item[f.name] || '' })
        return copy
      }),
      timestamp: Date.now()
    }
    paramTarget.value.paramLogs.push(logEntry)
    showToast({ title: `已记录 ${listItems.value.length} 个物料参数`, duration: 500 })
  } else {
    // 普通模式校验
    for (const field of currentParamFields.value) {
      const val = paramFieldValues[field.name]
      if (field.required && (val === undefined || val === null || val === '')) {
        vibrate()
        showToast({ icon:'none', title: `${field.name} 为必填项`, duration: 500 })
        return
      }
      if (field.type === 'number' && val !== undefined && val !== null && val !== '') {
        const num = Number(val)
        if (isNaN(num)) {
          showToast({ icon:'none', title: `${field.name} 需为数字`, duration: 500 })
          return
        }
        if (field.min !== undefined && num < field.min) {
          showToast({ icon:'none', title: `${field.name} 不能小于 ${field.min}`, duration: 500 })
          return
        }
        if (field.max !== undefined && num > field.max) {
          showToast({ icon:'none', title: `${field.name} 不能大于 ${field.max}`, duration: 500 })
          return
        }
        paramFieldValues[field.name] = num
      }
    }

    // 检查是否有未处理的参数异常
    const unhandledAnomalies = currentParamFields.value.filter(p => paramErrorMap[p.name] && !paramActionMap[p.name])
    if (unhandledAnomalies.length > 0) {
      showToast({ icon:'none', title: `请处理参数异常：${unhandledAnomalies.map(p => p.name).join('、')}`, duration: 1500 })
      return
    }

    // 记录正常参数
    const valuesArr = currentParamFields.value
      .map(f => ({
        name: f.name,
        value: paramFieldValues[f.name] !== undefined && paramFieldValues[f.name] !== null ? paramFieldValues[f.name] : '--',
        unit: f.unit || ''
      }))
      .filter(v => v.value !== '--')
    const logEntry: ParamLog = {
      batchNo: paramBatchNo.value.trim(),
      isListMode: false,
      values: valuesArr,
      timestamp: Date.now()
    }
    paramTarget.value.paramLogs.push(logEntry)

    // 收集异常信息并记录
    const anomalyList: any[] = []
    for (const param of currentParamFields.value) {
      if (paramErrorMap[param.name]) {
        const action = paramActionMap[param.name] === 'concession' ? '让步放行' :
                       (paramActionMap[param.name] === 'change' ? '申请变更参数' : '未处理')
        let detail = ''
        if (paramActionMap[param.name] === 'change' && paramChangeReason[param.name]) {
          detail = `，变更理由：${paramChangeReason[param.name]}，新范围：${paramNewMin[param.name] || param.min}~${paramNewMax[param.name] || param.max}`
        }
        anomalyList.push({
          paramName: param.name,
          actualValue: paramFieldValues[param.name],
          min: param.min,
          max: param.max,
          action: action + detail
        })
      }
    }
    if (anomalyList.length > 0) {
      const anomalyRecord = {
        time: new Date().toLocaleString(),
        type: '参数超标',
        description: `参数超出范围：${anomalyList.map(a => `${a.paramName}=${a.actualValue}`).join(', ')}`,
        action: anomalyList.map(a => `${a.paramName}:${a.action}`).join('；')
      }
      paramTarget.value.anomalies.push(anomalyRecord)
      showToast({ title: '已记录参数异常，等待审核', duration: 500 })
    } else {
      showToast({ title: `工艺参数已记录，批次号 ${paramBatchNo.value}`, duration: 500 })
    }
  }

  showParamPanel.value = false
}

// ---------- 异常面板 ----------
const showAnomalyPanel = ref(false)
const anomalyTarget = ref<Task | null>(null)
const anomalyForm = reactive({ type: '', description: '', action: '' })
const showAnomalyActionSheet = ref(false)

const anomalyTypeOptions = [
  { name: '设备故障' },
  { name: '参数超标' },
  { name: '物料异常' },
  { name: '环境异常' },
  { name: '其他' }
]

const onSelectAnomalyType = (item: { name: string }) => {
  anomalyForm.type = item.name
  showAnomalyActionSheet.value = false
}

const openAnomalyPanel = (task: Task) => {
  anomalyTarget.value = task
  anomalyForm.type = ''
  anomalyForm.description = ''
  anomalyForm.action = ''
  showAnomalyPanel.value = true
}

const submitAnomaly = () => {
  if (!anomalyTarget.value || !anomalyForm.type || !anomalyForm.description) {
    showToast({ title: '请填写异常类型和描述', duration: 500 })
    return
  }
  const timeStr = new Date().toLocaleTimeString()
  anomalyTarget.value.anomalies.push({
    time: timeStr,
    type: anomalyForm.type,
    description: anomalyForm.description,
    action: anomalyForm.action || '待处理'
  })
  showAnomalyPanel.value = false
  showToast({ title: '异常已记录', duration: 500 })
}
</script>

<style lang="scss" scoped>
// 主题变量（可根据实际项目调整）
$tp-primary: #1e5294;
$tp-success: #2e7d32;
$tp-danger: #d32f2f;
$tp-warning: #ed6c02;
$tp-text: #5a6874;
$tp-title: #1f2a3a;
$tp-help: #f5f7fa;
$tp-white: #ffffff;
$tp-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
$tp-disable: #9aa4b2;
$font-size-1: 12px;
$font-size-2: 14px;
$font-size-3: 16px;
$font-size-4: 22px;

.prod-operation-page {
  min-height: 100vh;
  background: $tp-help;
  padding-bottom: 30px;
}

/* 顶部栏 */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 90;
  background: linear-gradient(135deg, #1a3c6e 0%, #1e5294 100%);
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(26, 60, 110, 0.25);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 11px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.45);
}

.worker-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.worker-name {
  font-size: 16px;
  font-weight: 700;
}

.worker-meta {
  font-size: 11px;
  opacity: 0.8;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #fff !important;
  font-size: 17px;
  width: 34px;
  height: 34px;
  transition: transform 0.35s;

  &:active {
    transform: rotate(180deg);
  }
}

/* 统计卡片滚动区 */
.stats-row {
  display: flex;
  gap: 10px;
  padding: 13px 14px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.stat-card {
  flex: 1;
  min-width: 80px;
  background: $tp-white;
  border-radius: 14px;
  padding: 12px 10px;
  text-align: center;
  box-shadow: $tp-shadow-sm;
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.96);
    background: #f8f9fc;
  }

  &.active-filter {
    border-color: $tp-primary;
    background: rgba($tp-primary, 0.08);
  }
}

.stat-number {
  font-size: $font-size-4;
  font-weight: 800;
  letter-spacing: -0.5px;

  &.blue { color: $tp-primary; }
  &.orange { color: #fa8c16; }
  &.green { color: $tp-success; }
  &.red { color: $tp-danger; }
}

.stat-label {
  font-size: $font-size-1;
  color: $tp-text;
  margin-top: 5px;
  font-weight: 500;
}

/* 任务列表 */
.task-list {
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.task-card {
  background: $tp-white;
  border-radius: 16px;
  box-shadow: $tp-shadow-sm;
  overflow: hidden;
  border-left: 4px solid transparent;
  transition: all 0.2s;

  &.status-pending { border-left-color: $tp-primary; }
  &.status-progressing { border-left-color: #fa8c16; }
  &.status-completed { border-left-color: $tp-success; }
  &.has-anomaly { border-left-color: $tp-danger !important; }
}

.task-header {
  display: flex;
  justify-content: space-between;
  padding: 14px 15px 8px;
  gap: 10px;
}

.task-process-name {
  font-size: $font-size-3;
  font-weight: 700;
  flex: 1;
}

.task-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  font-size: $font-size-1;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-pending {
  background: rgba($tp-primary, 0.1);
  color: $tp-primary;
  border: 1px solid rgba($tp-primary, 0.3);
}

.badge-processing {
  background: rgba(#fa8c16, 0.1);
  color: #fa8c16;
  border: 1px solid rgba(#fa8c16, 0.3);
  animation: pulse 2s infinite;
}

.badge-completed {
  background: rgba($tp-success, 0.1);
  color: $tp-success;
  border: 1px solid rgba($tp-success, 0.3);
}

.badge-anomaly {
  background: rgba($tp-danger, 0.1);
  color: $tp-danger;
  border: 1px solid rgba($tp-danger, 0.3);
  animation: pulse 1.4s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

.task-body {
  padding: 4px 15px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: $font-size-2;
}

.task-info-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  color: $tp-text;

  .highlight { color: $tp-primary; }
}

.progress-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: $font-size-2;
}

.progress-mini-bar {
  flex: 1;
  height: 6px;

  :deep(.nut-progress-outer) {
    background: #e8ecf1;
    border-radius: 4px;
  }
}

.task-duration {
  font-size: $font-size-1;
  color: $tp-warning;
}

.task-actions {
  display: flex;
  gap: 8px;
  padding: 8px 15px 14px;
  flex-wrap: wrap;
}

.progressing-actions {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;

  .nut-button {
    flex: 1;
    min-width: 80px;
  }
}

.task-expand {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 12px 15px;
  animation: expandIn 0.25s ease;
}

@keyframes expandIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.expand-title {
  font-size: $font-size-2;
  font-weight: 700;
  color: $tp-title;
  margin: 8px 0 6px;
}

.param-log-card {
  background: $tp-help;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 10px;
  border-left: 3px solid $tp-primary;
}

.param-log-batch {
  font-weight: 700;
  color: $tp-primary;
  font-size: $font-size-2;
  margin-bottom: 8px;
}

.param-log-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.param-value-tag {
  background: $tp-white;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: $font-size-2;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.list-item-detail {
  margin-top: 8px;
  background: $tp-white;
  border-radius: 8px;
  padding: 8px 10px;
  border: 1px solid #e9ecef;
}

.list-item-title {
  font-size: $font-size-2;
  color: $tp-primary;
  margin-bottom: 4px;
  display: block;
}

.anomaly-mini {
  background: rgba($tp-danger, 0.08);
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 8px;
  font-size: $font-size-2;
  color: $tp-danger;
  border-left: 3px solid $tp-danger;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-record {
  font-size: $font-size-2;
  color: $tp-text;
  text-align: center;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #b0b7c3;
}

/* 弹窗样式 */
.panel-content {
  background: $tp-white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #edf2f7;

  .panel-title {
    font-size: $font-size-3;
    font-weight: 700;
    color: $tp-title;
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.panel-footer {
  padding: 12px 20px 20px;
  border-top: 1px solid #edf2f7;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: $font-size-2;
  font-weight: 600;
  color: $tp-title;
  margin-bottom: 6px;

  .unit {
    font-weight: 400;
    color: $tp-text;
    font-size: $font-size-1;
  }

  .required-star {
    color: $tp-danger;
    margin-left: 2px;
  }
}

.form-label-sm {
  font-size: $font-size-1;
  font-weight: 500;
  margin-bottom: 4px;
  display: block;
  color: $tp-text;
}

.param-item {
  transition: all 0.2s;
}

.anomaly-handler {
  margin-top: 12px;
  padding: 12px;
  background: rgba($tp-danger, 0.05);
  border-radius: 10px;
  border-left: 3px solid $tp-danger;
  animation: slideDown 0.2s ease;
}

.anomaly-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $tp-danger;
  margin-bottom: 10px;
}

.anomaly-options {
  margin-bottom: 8px;

  :deep(.nut-radio-group) {
    display: flex;
    gap: 20px;
  }
}

.change-range-panel {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);

  .form-group {
    margin-bottom: 12px;
  }

  .change-hint {
    font-size: 10px;
    color: $tp-disable;
    margin-top: 4px;
  }
}

.list-items-container {
  margin-top: 8px;
}

.list-title {
  font-weight: 600;
  margin-bottom: 12px;
  display: block;
  color: $tp-title;
}

.list-item-row {
  background: $tp-help;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
  border: 1px solid #e9eef3;
  position: relative;
}

.delete-row-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none !important;
  color: $tp-danger !important;
  font-size: $font-size-3;
  width: 28px !important;
  height: 28px !important;
  min-width: auto !important;
}

.add-row-btn {
  background: rgba($tp-primary, 0.05);
  border: 1px dashed $tp-primary;
  color: $tp-primary;
  margin-top: 8px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
