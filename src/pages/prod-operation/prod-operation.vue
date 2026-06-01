  <template>
    <view class="prod-operation-page">
      <!-- 顶部栏 -->
      <view class="top-bar">
        <view class="top-bar-left">
          <view class="avatar">👷</view>
          <view class="worker-info">
            <view class="worker-name">王鹏</view>
            <view class="worker-meta">工号：149817 · 储能中试线</view>
          </view>
        </view>
        <view class="top-bar-right">
          <nut-button shape="round" class="refresh-btn" @click="refreshTasks">
            ⟳
          </nut-button>
        </view>
      </view>

      <!-- 统计卡片（筛选） -->
      <scroll-view scroll-x class="stats-row">
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'all' }" @click="filterStatus = 'all'">
          <view class="stat-number blue">
            {{ tasks.length }}
          </view>
          <view class="stat-label">
            全部任务
          </view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'pending' }"
          @click="filterStatus = 'pending'">
          <view class="stat-number blue">{{ pendingCount }}</view>
          <view class="stat-label">待处理</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'in-progress' }"
          @click="filterStatus = 'in-progress'">
          <view class="stat-number orange">{{ inProgressCount }}</view>
          <view class="stat-label">进行中</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'completed' }"
          @click="filterStatus = 'completed'">
          <view class="stat-number green">{{ completedCount }}</view>
          <view class="stat-label">已完成</view>
        </view>
        <view class="stat-card" :class="{ 'active-filter': filterStatus === 'anomaly' }"
          @click="filterStatus = 'anomaly'">
          <view class="stat-number red">{{ anomalyTaskCount }}</view>
          <view class="stat-label">含异常</view>
        </view>
      </scroll-view>

      <!-- 任务列表 -->
      <view class="task-list">
        <view v-for="task in filteredTasks" :key="task.id">
          <view class="task-card" :class="[
            `status-${task.status}`,
            { 'has-anomaly': task.anomalies.length > 0 && task.status === 'in-progress' }
          ]">
            <view class="task-header">
              <text class="task-process-name">{{ task.processName }}</text>
              <view class="task-badges">
                <!-- <text v-if="task.priority === 'urgent'" class="badge badge-urgent">⚠️ 急</text> -->
                <text v-if="task.anomalies.length > 0 && task.status === 'in-progress'"
                  class="badge badge-anomaly">异常</text>
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
                  <nut-progress :status="task.status == 'in-progress' ? 'active' : 'icon'"
                    :percentage="progressPercent(task)" :show-text="false" stroke-color="blue"
                    class="progress-mini-bar" />
                </view>
                <view>{{ task.completedQty }} / {{ task.planQty }} 件</view>
                <view v-if="task.status === 'in-progress' && task.startTimeReal" class="task-duration">
                  ⏱️ {{ formatDuration(task) }}
                </view>
              </view>
            </view>
            <view class="task-actions">
              <view v-if="task.status === 'pending'">
                <nut-button type="primary" size="small" block @click="startTask(task)">▶ 领取并开始加工</nut-button>
              </view>
              <view v-if="task.status === 'in-progress'">
                <nut-button type="primary" size="small" @click="openParamPanel(task)">录入参数</nut-button>
                <nut-button type="warning" size="small" @click="openCompleteDialog(task)">停止加工</nut-button>
                <nut-button type="danger" size="small" plain @click="openAnomalyPanel(task)">记录异常</nut-button>
              </view>
              <view v-if="task.status === 'completed'">
                <nut-button type="info" size="small" plain @click="toggleExpand(task)">🔍 {{ expandedSet.has(task.id) ?
                  '收起详情' :
                  '查看详情' }}</nut-button>
              </view>
              <nut-button
                v-if="task.status === 'in-progress' && (task.paramLogs.length > 0 || task.anomalies.length > 0)"
                size="small" type="info" plain @click="toggleExpand(task)">
                {{ expandedSet.has(task.id) ? '收起' : '展开记录' }}
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
              <view v-if="task.paramLogs.length === 0 && task.anomalies.length === 0" class="empty-record">
                暂无操作记录
              </view>
            </view>
          </view>
        </view>
        <view v-if="filteredTasks.length === 0" class="empty-state">
          <view class="empty-icon">📋</view>
          <view class="empty-title">暂无任务</view>
        </view>
      </view>

      <!-- 工艺参数面板 -->
      <nut-popup v-model:visible="showParamPanel" position="bottom" round :style="{ height: '100%' }" closeable
        close-icon-position="top-right">
        <view class="panel-content">
          <view class="panel-header">
            <text class="panel-title">📝 录入工艺参数</text>
          </view>

          <!-- 使用 nut-form 包裹表单 -->
          <nut-form class="panel-body"  ref="paramFormRef" :model="paramFormData">
            <!-- 产品批次号表单项 -->
            <nut-form-item label="📦产品批次号" prop="batchNo">
              <nut-input v-model="paramFormData.batchNo" placeholder="批次号" />
            </nut-form-item>

            <view v-if="!isListMode">
              <nut-form-item v-for="param in currentParamFields" :key="param.name"
                :label="`${param.name}${param.unit ? ` (${param.unit})` : ''}`" :prop="param.name"
                :required="param.required">
                <nut-input v-model="paramFormData[param.name]" :type="param.type" :placeholder="'请输入' + param.name" />
                <!-- 参数范围提示 -->
                <text v-if="param.min !== undefined || param.max !== undefined" class="input-hint">
                  范围：{{ param.min ?? '无' }} ~ {{ param.max ?? '无' }}
                </text>
              </nut-form-item>
            </view>

            <view v-else>
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
            </view>
          </nut-form>

          <view class="panel-footer">
            <nut-button type="primary" size="small" block @click="submitParams">提交</nut-button>
          </view>
        </view>
      </nut-popup>

      <!-- 异常记录面板 -->
      <nut-popup v-model:visible="showAnomalyPanel" position="bottom" round
        :style="{ maxHeight: '85vh', height: 'auto' }" closeable close-icon-position="top-right">
        <view class="panel-content">
          <view class="panel-header">
            <text class="panel-title">⚠️ 记录异常</text>
          </view>
          <view class="panel-body">
            <!-- 异常类型 - 使用 readonly + click 触发 ActionSheet -->
            <view class="form-group">
              <text class="form-label">异常类型</text>
              <nut-input readonly :model-value="anomalyForm.type || '请选择'" placeholder="请选择"
                @click="showAnomalyActionSheet = true" />
            </view>
            <view class="form-group">
              <text class="form-label">描述</text>
              <nut-input type="textarea" v-model="anomalyForm.description" rows="2" />
            </view>
            <view class="form-group">
              <text class="form-label">处理措施</text>
              <nut-input type="textarea" v-model="anomalyForm.action" rows="2" />
            </view>
          </view>
          <view class="panel-footer">
            <nut-button type="danger" size="small" block @click="submitAnomaly">提交异常</nut-button>
          </view>
        </view>
      </nut-popup>

      <!-- 异常类型 ActionSheet -->
      <!-- <nut-actionsheet
        v-model:visible="showAnomalyActionSheet"
        :menu-items="anomalyTypeOptions"
        @choose="onSelectAnomalyType"
        cancel-txt="取消" /> -->

      <!-- 完成加工弹窗 -->
      <nut-popup v-model:visible="showCompleteDialog" position="center" round :style="{ width: '80%' }">
        <view class="dialog-content">
          <text class="dialog-title">确认停止加工</text>
          <view class="form-group">
            <text class="form-label">合格数量 (计划 {{ completeTarget?.planQty }})</text>
            <nut-input type="number" v-model.number="completeForm.goodQty" />
          </view>
          <view class="form-group">
            <text class="form-label">不良数量</text>
            <nut-input type="number" v-model.number="completeForm.defectQty" />
          </view>
          <view class="dialog-actions">
            <nut-button plain @click="showCompleteDialog = false">取消</nut-button>
            <nut-button type="success" @click="confirmComplete">确认</nut-button>
          </view>
        </view>
      </nut-popup>
    </view>
  </template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {  Form} from '@nutui/nutui-taro'  // 直接导入 Toast 方法
// import { Nutform } from '@nutui/icons-vue-taro'
import { showToast } from '@tarojs/taro'
import type { Task, ParamField, ListField, ParamLog } from '@/types/prod-operation'

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
    goodQty: 0,
    defectQty: 0,
    status: 'pending',
    startTimeReal: null,
    paramLogs: [],
    anomalies: [],
    paramConfig: [],
    listMode: false
  },
  {
    id: 'OP1020',
    processName: 'OP1020 · 性能测试',
    productName: '电池模组托盘',
    batchNo: 'BT-20260529-05',
    equipmentName: '检测仪',
    station: '工位 G1-05',
    planQty: 20,
    completedQty: 5,
    goodQty: 0,
    defectQty: 0,
    status: 'in-progress',
    // priority: 'urgent',
    startTimeReal: Date.now() - 2.5 * 3600000,
    paramLogs: [{ time: '14:32:18', batchNo: 'BT-20260529-22', values: [{ name: '电压', value: '1.8', unit: 'V' }] }] as any,
    anomalies: [],
    paramConfig: [{ name: '电压', type: 'digit', unit: 'V', required: true, min: 1.75, max: 1.85 }],
    listMode: false
  },
  {
    id: 'OP1030',
    processName: 'OP1030 · 端板粘贴',
    productName: '电芯 A770_Pack',
    batchNo: 'BT-20260529-05',
    equipmentName: '',
    station: '工位 G2-18',
    startTimeReal: null,
    planQty: 5,
    completedQty: 5,
    goodQty: 5,
    defectQty: 0,
    status: 'completed',
    paramLogs: [
      { batchNo: 'BT-20260529-01', values: [{ name: '夹持力', value: '893', unit: 'N' }] },
      { batchNo: 'BT-20260529-02', values: [{ name: '夹持力', value: '901', unit: 'N' }] },
      { batchNo: 'BT-20260529-03', values: [{ name: '夹持力', value: '902', unit: 'N' }] },
      { batchNo: 'BT-20260529-04', values: [{ name: '夹持力', value: '903', unit: 'N' }] },
      { batchNo: 'BT-20260529-05', values: [{ name: '夹持力', value: '905', unit: 'N' }] }
    ] as any,
    anomalies: [
      { time: '18:15:33', type: '参数异常', description: 'BT-20260529-01 夹持力 < 900', action: '让步放行' }
    ],
    paramConfig: [{ name: '夹持力', type: 'number', unit: 'N', min: 550, max: 1650 }],
    listMode: false
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
    goodQty: 0,
    defectQty: 0,
    status: 'in-progress',
    // priority: 'normal',
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
const filterStatus = ref<'all' | 'pending' | 'in-progress' | 'completed' | 'anomaly'>('all')
const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const inProgressCount = computed(() => tasks.value.filter(t => t.status === 'in-progress').length)
const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length)
const anomalyTaskCount = computed(() => tasks.value.filter(t => t.status === 'in-progress' && t.anomalies.length > 0).length)

const filteredTasks = computed(() => {
  if (filterStatus.value === 'all') return tasks.value
  if (filterStatus.value === 'anomaly') return tasks.value.filter(t => t.status === 'in-progress' && t.anomalies.length > 0)
  return tasks.value.filter(t => t.status === filterStatus.value)
})

// 辅助函数
const statusLabel = (s: string) => {
  const map: Record<string, string> = { pending: '待处理', 'in-progress': '加工中', completed: '已完成' }
  return map[s] || s
}
const statusBadgeClass = (s: string) => {
  const map: Record<string, string> = { pending: 'badge-pending', 'in-progress': 'badge-processing', completed: 'badge-completed' }
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
  showToast({ title: '刷新中...', icon: 'loading', duration: 1000 })
}

// 领取任务
const startTask = (task: Task) => {
  task.status = 'in-progress'
  task.startTimeReal = Date.now()
  task.completedQty = 0
  showToast({ title: '已领取任务', icon: 'success' ,duration: 1000})
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
const paramFieldValues = reactive<Record<string, number | string>>({})
const paramBatchNo = ref('')
const isListMode = ref(false)
const listFieldsDef = ref<ListField[]>([])
const listItems = ref<any[]>([])

// 打开工艺参数面板
const openParamPanel = (task: Task) => {
  paramTarget.value = task
  paramBatchNo.value = task.batchNo || ''
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
    currentParamFields.value.forEach(f => { paramFieldValues[f.name] = undefined as unknown as string | number; })
  }
  showParamPanel.value = true
   // 重置并初始化表单数据模型
  Object.keys(paramFormData).forEach(key => delete paramFormData[key]);
  paramFormData.batchNo = task.batchNo || '';

  if (!isListMode.value) {
    currentParamFields.value.forEach(field => {
      paramFormData[field.name] = null;
    });
  }
}

// 获取表单组件实例的引用
const paramFormRef = ref<InstanceType<typeof Form>>();

// 表单数据模型
const paramFormData = reactive({
  batchNo: '',
  // 动态参数数据会直接添加为属性
});

// 参数异常状态
const paramErrorMap = reactive<Record<string, boolean>>({})
// 用户选择的处理方式（concession / change）
const paramActionMap = reactive<Record<string, string>>({})
// 申请变更的理由
const paramChangeReason = reactive<Record<string, string>>({})
const paramNewMin = reactive<Record<string, number>>({})
const paramNewMax = reactive<Record<string, number>>({})

// 监听参数值变化，实时校验
watch(
  () => paramFieldValues,
  () => {
    for (const param of currentParamFields.value) {
      const val = paramFieldValues[param.name]
      if (val !== undefined && val !== null && val !== '') {
        const num = Number(val)
        console.log(`校验参数 ${param.name}，值: ${num}`)
        if (isNaN(num)) {
          paramErrorMap[param.name] = false
          continue
        }
        const min = param.min ?? -Infinity
        const max = param.max ?? Infinity
        const outOfRange = num < min || num > max
        paramErrorMap[param.name] = outOfRange
        if (!outOfRange) {
          delete paramActionMap[param.name]
          delete paramNewMin[param.name]
          delete paramNewMax[param.name]
        }
      } else {
        paramErrorMap[param.name] = false
      }
    }
  },
  { deep: true }
)

// 校验参数范围
// const validateParam = (param: ParamField, value: any) => {
//   const num = parseFloat(value)
//   if (param.type === 'number' && !isNaN(num)) {
//     const isOutOfRange = (param.min !== undefined && num < param.min) ||
//       (param.max !== undefined && num > param.max)
//     paramErrorMap[param.name] = isOutOfRange
//     if (!isOutOfRange) {
//       // 清除异常相关的选择
//       delete paramActionMap[param.name]
//       delete paramChangeReason[param.name]
//     }
//   } else {
//     paramErrorMap[param.name] = false
//   }
// }

const addListItem = () => {
  const newItem: any = {}
  listFieldsDef.value.forEach(f => { newItem[f.name] = '' })
  listItems.value.push(newItem)
}

const removeListItem = (idx: number) => {
  if (listItems.value.length > 1) listItems.value.splice(idx, 1)
  else showToast({ title: '至少保留一行物料', icon: 'none', duration: 1000 })
}

const submitParams = async () => {
  console.log(paramFormRef.value);


  await paramFormRef.value?.validate();
  if (!paramTarget.value) return
  if (!paramBatchNo.value.trim()) {
    showToast({ title: '请填写产品批次号', icon: 'none', duration: 1000 })
    return
  }
  if (isListMode.value) {
    // 校验所有行必填
    for (let i = 0; i < listItems.value.length; i++) {
      const item = listItems.value[i]
      for (const f of listFieldsDef.value) {
        if (f.required && (!item[f.name] || item[f.name].trim() === '')) {
          showToast({ title: `第 ${i + 1} 行：${f.name} 为必填项`, icon: 'none', duration: 1000 })
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
    showToast({ title: `已记录 ${listItems.value.length} 个物料参数，批次号 ${paramBatchNo.value}`, icon: 'success', duration: 1000 })
  } else {
    // 普通模式校验
    for (const field of currentParamFields.value) {
      const val = paramFieldValues[field.name]
      if (field.required && (val === null || val === '' || (field.type === 'number' && isNaN(Number(val))))) {
        showToast({ title: `请填写必填参数: ${field.name}`, icon: 'none', duration: 1000 })
        return
      }
      if (field.type === 'number' && val !== null && val !== '') {
        const num = Number(val)
        if (isNaN(num)) {
          showToast({ title: `${field.name} 需为数字`, icon: 'none', duration: 1000 })
          return
        }
        if (field.min !== undefined && num < field.min) {
          showToast({ title: `${field.name} 不能小于 ${field.min}`, icon: 'none', duration: 1000 })
          return
        }
        if (field.max !== undefined && num > field.max) {
          showToast({ title: `${field.name} 不能大于 ${field.max}`, icon: 'none', duration: 1000 }    )
          return
        }
        paramFieldValues[field.name] = num
      }
    }
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
    showToast({ title: `工艺参数已记录，批次号 ${paramBatchNo.value}`, icon: 'success', duration: 1000 })
  }
  // 收集所有触发异常的参数处理信息
  const anomalyList: any[] = []
  for (const param of currentParamFields.value) {
    if (paramErrorMap[param.name]) {
      anomalyList.push({
        paramName: param.name,
        actualValue: paramFieldValues[param.name],
        min: param.min,
        max: param.max,
        action: paramActionMap[param.name] || '未处理',
        changeReason: paramChangeReason[param.name] || ''
      })
    }
  }
  if (anomalyList.length > 0) {
    // 将异常记录到任务中
    const anomalyRecord = {
      time: new Date().toLocaleString(),
      type: '参数超标',
      description: `参数超出范围：${anomalyList.map(a => `${a.paramName}=${a.actualValue}`).join(', ')}`,
      action: anomalyList.map(a => `${a.paramName}:${a.action}${a.changeReason ? `(${a.changeReason})` : ''}`).join('；')
    }
    paramTarget.value.anomalies.push(anomalyRecord)
    showToast({ title: '已记录参数超标异常，请主管审核', icon: 'none', duration: 1000 })
  }

  showParamPanel.value = false
}

// ---------- 异常面板 ----------
const showAnomalyPanel = ref(false)
const anomalyTarget = ref<Task | null>(null)
const anomalyForm = reactive({ type: '', description: '', action: '' })
// 异常类型 ActionSheet 状态
const showAnomalyActionSheet = ref(false)
// 异常类型选项（符合 ActionSheet 的 menu-items 格式）
// const anomalyTypeOptions = [
//   { name: '设备故障' },
//   { name: '参数超标' },
//   { name: '物料异常' },
//   { name: '环境异常' },
//   { name: '其他' }
// ]
// 选择异常类型后的回调
// const onSelectAnomalyType = (item: { name: string }) => {
//   anomalyForm.type = item.name
//   showAnomalyActionSheet.value = false
// }

const openAnomalyPanel = (task: Task) => {
  anomalyTarget.value = task
  anomalyForm.type = ''
  anomalyForm.description = ''
  anomalyForm.action = ''
  showAnomalyPanel.value = true
}


const submitAnomaly = () => {
  if (!anomalyTarget.value || !anomalyForm.type || !anomalyForm.description) {
    showToast({ title: '请填写异常类型和描述', icon: 'none', duration: 1000 })
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
  showToast({ title: '异常已记录', icon: 'success', duration: 1000 })
}

// ---------- 完成加工弹窗 ----------
const showCompleteDialog = ref(false)
const completeTarget = ref<Task | null>(null)
const completeForm = reactive({ goodQty: 0, defectQty: 0 })

const openCompleteDialog = (task: Task) => {
  completeTarget.value = task
  completeForm.goodQty = task.planQty
  completeForm.defectQty = 0
  showCompleteDialog.value = true
}

const confirmComplete = () => {
  const task = completeTarget.value
  if (!task) return
  const good = completeForm.goodQty || 0
  const defect = completeForm.defectQty || 0
  const total = good + defect
  if (total > task.planQty) {
    showToast({ title: `总数不能超过计划${task.planQty}`, icon: 'none', duration: 1000 })
    return
  }
  task.completedQty = total
  task.goodQty = good
  task.defectQty = defect
  task.status = 'completed'
  showCompleteDialog.value = false
  showToast({ title: '工序完成', icon: 'success', duration: 1000 })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme.scss';

.prod-operation-page {
  min-height: 100vh;
  background: $tp-help;
  padding-bottom: 20px;
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
}

.refresh-btn:active {
  transform: rotate(180deg);
}

/* 统计卡片滚动区 */
.stats-row {
  display: flex;
  gap: 10px;
  padding: 13px 14px;
  overflow-x: auto;
  white-space: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }
}

.stat-card {
  flex: 1;
  min-width: 80px;
  background: $tp-white;
  border-radius: 10px;
  padding: 13px 12px;
  text-align: center;
  box-shadow: $tp-shadow-sm;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: 0.2s;

  &:active {
    transform: scale(0.96);
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

  &.blue {
    color: $tp-primary;
  }

  &.orange {
    color: #fa8c16;
  }

  &.green {
    color: $tp-success;
  }

  &.red {
    color: $tp-danger;
  }
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
  gap: 12px;
}

.task-card {
  background: $tp-white;
  border-radius: 14px;
  box-shadow: $tp-shadow-sm;
  overflow: hidden;
  border-left: 4px solid transparent;

  &.status-pending {
    border-left-color: $tp-primary;
  }

  &.status-in-progress {
    border-left-color: #fa8c16;
  }

  &.status-completed {
    border-left-color: $tp-success;
  }

  &.has-anomaly {
    border-left-color: $tp-danger !important;
  }
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
  border-radius: 14px;
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
  animation: pulse 2.2s infinite;
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

.badge-urgent {
  background: rgba($tp-danger, 0.1);
  color: #cf1322;
  border: 1px solid rgba($tp-danger, 0.3);
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.65;
  }
}

.task-body {
  padding: 4px 15px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: $font-size-2;
}

.task-info-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  color: $tp-text;

  .highlight {
    color: $tp-primary;
  }
}

.progress-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
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

.task-actions {
  display: flex;
  gap: 8px;
  padding: 8px 15px 14px;
  flex-wrap: wrap;
  font-size: $font-size-2;
}

.task-expand {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 12px 15px;
  animation: expandIn 0.3s ease;
}

@keyframes expandIn {
  from {
    opacity: 0;
    max-height: 0;
  }

  to {
    opacity: 1;
    max-height: 600px;
  }
}

.expand-title {
  font-size: $font-size-2;
  font-weight: 700;
  color: $tp-text;
  margin-bottom: 8px;
}

.param-log-card {
  background: $tp-help;
  border-radius: 10px;
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
  border-radius: 16px;
  padding: 4px 10px;
  font-size: $font-size-2;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.list-item-detail {
  margin-top: 8px;
  background: $tp-white;
  border-radius: 8px;
  padding: 6px 10px;
  border: 1px solid #e9ecef;
}

.list-item-title {
  font-size: $font-size-2;
  color: $tp-primary;
  margin-bottom: 4px;
  display: block;
}

.anomaly-mini {
  background: rgba($tp-danger, 0.1);
  border-radius: 8px;
  padding: 9px 11px;
  margin-top: 6px;
  font-size: $font-size-2;
  color: $tp-danger;
  border-left: 3px solid $tp-danger;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.empty-record {
  font-size: $font-size-2;
  color: $tp-text;
  text-align: center;
  padding: 10px;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: #b0b7c3;
}

/* 弹窗内容通用 */
.panel-content {
  background: $tp-white;
  font-size: $font-size-2;
  border-radius: 16px 16px 0 0;
  // max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  .panel-title {
    font-size: $font-size-3;
    font-weight: 700;
  }
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
}

.panel-footer {
  padding: 12px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  font-size: $font-size-2;
  font-weight: 600;
  color: $tp-title;
  margin-bottom: 5px;

  .unit {
    font-weight: 400;
    color: $tp-text;
    font-size: $font-size-2;
  }

  .required-star {
    color: $tp-danger;
    margin-left: 2px;
  }
}

.input-hint {
  font-size: $font-size-1;
  color: $tp-text;
  margin-top: 4px;
  display: block;
}

.list-items-container {
  margin-top: 8px;
  border-top: 1px solid #edf2f7;
  padding-top: 12px;
}

.list-title {
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.list-item-row {
  background: $tp-help;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
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
}

.add-row-btn {
  background: rgba($tp-primary, 0.05);
  border: 1px dashed $tp-primary;
  color: $tp-primary;
}

.empty-param {
  text-align: center;
  color: $tp-text;
  padding: 16px;
}

.dialog-content {
  background: $tp-white;
  border-radius: 16px;
  padding: 24px 20px;
  width: 100%;
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  display: block;
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;

  button {
    flex: 1;
  }
}

.picker-trigger {
  cursor: pointer;
}


.param-item {
  transition: all 0.2s;
}

.anomaly-handler {
  margin-top: 12px;
  padding: 12px;
  background: rgba($tp-danger, 0.05);
  border-radius: 8px;
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
  border-top: 1px dashed rgba(0, 0, 0, 0.1);

  .form-group {
    margin-bottom: 12px;
  }

  .form-label-sm {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    display: block;
    color: $tp-text;
  }

  .change-hint {
    font-size: 10px;
    color: $tp-disable;
    margin-top: 4px;
  }
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
