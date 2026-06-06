<!--
  生产执行页面 (prod-operation)
  功能模块：
  1. 顶部导航 & 统计卡片（筛选）
  2. 任务列表展示
  3. 任务操作按钮（物料录入、参数录入、异常、完成）
  4. 物料录入弹窗（支持批次码/SN扫码）
  5. 工艺参数录入弹窗（普通模式/列表模式，含范围校验及异常处理）
  6. 异常记录弹窗
  7. 完成加工弹窗
  8. Toast 轻提示
-->

<template>
  <view class="prod-operation-page">
    <!-- ========== 1. 顶部导航 ========== -->
    <NavBar title="生产执行" />

    <!-- ========== 2. 统计卡片（状态筛选） ========== -->
    <scroll-view scroll-x class="stats-row">
      <view class="stat-card" :class="{ 'active-filter': filterStatus === 'all' }" @click="filterStatus = 'all'">
        <view class="stat-number blue">{{ tasks.length }}</view>
        <view class="stat-label">全部任务</view>
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
      <view class="stat-card" :class="{ 'active-filter': filterStatus === 'anomaly' }"
        @click="filterStatus = 'anomaly'">
        <view class="stat-number red">{{ anomalyTaskCount }}</view>
        <view class="stat-label">含异常</view>
      </view>
    </scroll-view>

    <!-- ========== 3. 任务列表 ========== -->
    <view class="task-list">
      <view v-for="task in filteredTasks" :key="task.id">
        <view class="task-card"
          :class="[`status-${task.status}`, { 'has-anomaly': task.anomalies.length > 0 && task.status === 'progressing' }]">
          <!-- 任务头部 -->
          <view class="task-header">
            <text class="task-process-name">{{ task.processName }}</text>
            <view class="task-badges">
              <text v-if="task.anomalies.length > 0 && task.status === 'progressing'"
                class="badge badge-anomaly">异常</text>
              <text class="badge" :class="statusBadgeClass(task.status)">{{ statusLabel(task.status) }}</text>
            </view>
          </view>
          <!-- 任务主体信息 -->
          <view class="task-body">
            <view class="task-info-row"><text>📦 {{ task.productName }}</text><text class="highlight">#{{ task.batchNo
                }}</text></view>
            <view class="task-info-row"><text>⚙️ {{ task.equipmentName || '未指定' }}</text><text>📍 {{ task.station
                }}</text></view>
            <view class="progress-mini">
              <nut-progress :percentage="progressPercent(task)" :show-text="false" stroke-color="blue"
                class="progress-mini-bar" />
              <view>{{ task.completedQty }} / {{ task.planQty }} 件</view>
              <view v-if="task.status === 'progressing' && task.startTimeReal" class="task-duration">⏱️ {{
                formatDuration(task) }}</view>
            </view>
          </view>
          <!-- 任务操作按钮区（根据状态和物料齐套动态显示） -->
          <view class="task-actions">
            <!-- 待处理状态 -->
            <template v-if="task.status === 'pending'">
              <nut-button size="small" v-if="task.materialReady" type="primary" @click="startTask(task)">▶
                领取并开始加工</nut-button>
              <nut-button size="small" v-else type="primary" plain @click="openMaterialPanel(task)">📦
                物料录入</nut-button>
            </template>
            <!-- 加工中状态 -->
            <template v-if="task.status === 'progressing'">
              <nut-button v-if="!task.materialReady" size="small" type="primary" plain
                @click="openMaterialPanel(task)">📦 物料录入</nut-button>
              <nut-button v-if="task.materialReady" size="small" type="info" @click="openParamPanel(task)">📝
                录入参数</nut-button>
              <nut-button v-if="task.materialReady" size="small" type="success" @click="openCompleteDialog(task)">✓
                完成加工</nut-button>
            </template>
            <!-- 已完成状态 -->
            <template v-if="task.status === 'completed'">
              <nut-button size="small" plain @click="toggleExpand(task)">🔍 {{ expandedSet.has(task.id) ? '收起详情' :
                '查看详情' }}</nut-button>
            </template>
            <nut-button v-else size="small" type="danger" plain @click="openAnomalyPanel(task)">
              上报异常</nut-button>
            <!-- 展开记录按钮（加工中且有记录） -->
            <nut-button v-if="task.status === 'progressing' && (task.paramLogs.length > 0 || task.anomalies.length > 0)"
              size="small" plain @click="toggleExpand(task)">
              {{ expandedSet.has(task.id) ? '收起' : '展开记录' }}
            </nut-button>
          </view>
          <!-- 展开详情区域（参数记录、异常记录） -->
          <view v-if="expandedSet.has(task.id)" class="task-expand">
            <!-- 工艺参数记录 -->
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
                      <text v-for="(val, fName) in item" :key="fName" class="param-value-tag">{{ fName }}: {{ val
                        }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <!-- 异常记录 -->
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
      <view v-if="filteredTasks.length === 0" class="empty-state"><text>暂无任务</text></view>
    </view>

    <!-- ========== 4. 物料录入弹窗 ========== -->
    <nut-popup v-model:visible="showMaterialPanel" position="bottom" round :style="{ height: '70%' }" closeable>
      <view class="material-panel">
        <view class="panel-header">📦 物料录入 - {{ currentTaskForMaterial?.processName }}</view>
        <scroll-view scroll-y class="material-list-scroll">
          <view v-for="material in currentTaskForMaterial?.materialList" :key="material.sapCode"
            class="material-item-panel">
            <view class="material-header">
              <text class="material-name">{{ material.materialName }}</text>
              <text class="material-req">需求: {{ material.requiredQty }}{{ material.unit }}</text>
            </view>
            <text class="material-progressing">已录入: {{ material.consumedQuantity || 0 }}</text>
            <view class="input-row">
              <nut-input v-model="tempMaterialCode[material.sapCode]"
                :placeholder="material.isUniqueCode ? '扫描/输入 SN' : '扫描/输入 批次号'"
                @confirm="() => addMaterialItem(currentTaskForMaterial!, material)" />
              <nut-button size="small" type="primary"
                @click="() => addMaterialItem(currentTaskForMaterial!, material)">添加</nut-button>
            </view>
            <view class="consumed-list">
              <view v-for="(item, idx) in material.consumedItems" :key="idx" class="consumed-item">
                <text>{{ item.code }} {{ (item.quantity && item.quantity > 1) ? `x${item.quantity}` : '' }}</text>
                <text class="delete-btn" @click="removeMaterialItem(currentTaskForMaterial!, material, idx)">✖</text>
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="panel-footer"><nut-button block plain @click="closeMaterialPanel">关闭</nut-button></view>
      </view>
    </nut-popup>

    <!-- ========== 5. 工艺参数录入弹窗（含范围校验及异常处理） ========== -->
    <nut-popup v-model:visible="showParamPanel" position="bottom" round :style="{ height: '85%' }" closeable
      close-icon-position="top-right">
      <view class="panel-content">
        <view class="panel-header"><text class="panel-title">📝 录入工艺参数</text></view>
        <scroll-view scroll-y class="panel-body">
          <view class="form-group"><text class="form-label">📦 产品批次号</text><nut-input v-model="paramBatchNo"
              placeholder="批次号 (可修改)" /></view>
          <!-- 普通模式（动态表单） -->
          <view v-if="!isListMode">
            <view v-for="param in currentParamFields" :key="param.name" class="form-group param-item">
              <text class="form-label">{{ param.name }}<text v-if="param.unit" class="unit">({{ param.unit
                  }})</text><text v-if="param.required" class="required-star">*</text></text>
              <nut-input :type="param.type" v-model="paramFieldValues[param.name]" :placeholder="'请输入' + param.name"
                class="param-input" @input="(val) => validateParam(param, val)" />
              <text v-if="param.min !== undefined || param.max !== undefined" class="input-hint">范围：{{ param.min ?? '无'
                }} ~ {{ param.max ?? '无' }}</text>
              <!-- 超出范围异常处理面板 -->
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
            <view v-if="currentParamFields.length === 0" class="empty-param">该工序无额外参数配置，可直接提交批次号</view>
          </view>
          <!-- 列表模式（多物料录入） -->
          <view v-else class="list-items-container"><text class="list-title">🔁 物料明细列表（可增删）</text>
            <view v-for="(item, idx) in listItems" :key="idx" class="list-item-row">
              <nut-button v-if="listItems.length > 1" class="delete-row-btn" shape="round" size="small"
                @click="removeListItem(idx)">✖</nut-button>
              <view v-for="field in listFieldsDef" :key="field.name" class="form-group"><text class="form-label">{{
                field.name }}<text v-if="field.required" class="required-star">*</text></text><nut-input
                  :type="field.type" v-model="item[field.name]" :placeholder="'请输入' + field.name" /></view>
            </view>
            <nut-button block class="add-row-btn" @click="addListItem">+ 添加一个物料</nut-button>
          </view>
        </scroll-view>
        <view class="panel-footer"><nut-button type="primary" block @click="submitParams">✓ 提交工艺参数</nut-button></view>
      </view>
    </nut-popup>

    <!-- ========== 6. 异常记录弹窗 ========== -->
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

    <!-- 异常类型 ActionSheet -->
    <nut-action-sheet v-model:visible="showAnomalyActionSheet" :menu-items="anomalyTypeOptions" title="请选择异常类型"
      @select="onSelectAnomalyType" cancel-txt="取消" />

    <!-- ========== 7. 完成加工弹窗 ========== -->
    <nut-popup v-model:visible="showCompleteDialog" position="center" round :style="{ width: '80%' }">
      <view class="dialog-content">
        <text class="dialog-title">确认完成加工</text>
        <view class="form-group"><text class="form-label">合格数量 (计划 {{ completeTarget?.planQty }})</text><nut-input
            type="number" v-model="completeForm.goodQty" /></view>
        <view class="form-group"><text class="form-label">不良数量</text><nut-input type="number"
            v-model="completeForm.defectQty" /></view>
        <view class="dialog-actions"><nut-button plain @click="showCompleteDialog = false">取消</nut-button><nut-button
            type="success" @click="confirmComplete">确认</nut-button></view>
      </view>
    </nut-popup>

    <!-- ========== 8. Toast 轻提示（通过函数调用，无模板） ========== -->
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import Taro from '@tarojs/taro'
import NavBar from '@/components/NavBar.vue'
import { IconFont } from '@nutui/icons-vue-taro'
import { Toast } from '@nutui/nutui-taro'
import type { Task, MaterialRequirement, ConsumedItem, ParamField, ListField, ParamLog } from '@/types/prod-operation'

// ========== 1. 模拟任务数据（含物料清单、参数配置等） ==========
const tasks = ref<Task[]>([
  {
    id: 'OP1010',
    processName: 'OP1010 · 电芯上线',
    productName: '电芯 A-770',
    batchNo: 'BT-20260529-01',
    equipmentName: '手持PDA',
    station: '工位 ZS-001',
    planQty: 200,
    completedQty: 0,
    defectQty: 0,
    status: 'pending',
    paramLogs: [],
    anomalies: [],
    paramConfig: [{ name: '上线速度', type: 'number', unit: 'mm/s', required: true, min: 80, max: 120 }],
    listMode: false,
    materialList: [
      { sapCode: 'MAT-001', materialName: '电芯', requiredQty: 200, unit: '个', isUniqueCode: false, consumedItems: [], consumedQuantity: 0 },
      { sapCode: 'MAT-002', materialName: '端板', requiredQty: 200, unit: '个', isUniqueCode: false, consumedItems: [], consumedQuantity: 0 }
    ],
    materialReady: false
  },
  {
    id: 'OP1020',
    processName: 'OP1020 · 性能测试',
    productName: '电池模组托盘',
    batchNo: 'BT-20260529-22',
    equipmentName: '检测仪',
    station: '工位 G1-05',
    planQty: 500,
    completedQty: 218,
    defectQty: 0,
    status: 'progressing',
    startTimeReal: Date.now() - 2.5 * 3600000,
    paramLogs: [{ batchNo: 'BT-20260529-22', values: [{ name: '电压', value: '1.8', unit: 'V' }] }] as any,
    anomalies: [],
    paramConfig: [{ name: '电压', type: 'number', unit: 'V', required: true, min: 1.75, max: 1.85 }],
    listMode: false,
    materialList: [
      { sapCode: 'MAT-003', materialName: '测试探针', requiredQty: 500, unit: '个', isUniqueCode: false, consumedItems: [], consumedQuantity: 0 }
    ],
    materialReady: false
  },
  {
    id: 'OP1030',
    processName: 'OP1030 · 端板粘贴',
    productName: '电芯 A770_Pack',
    batchNo: 'BT-20260529-05',
    equipmentName: '',
    station: '工位 G2-18',
    planQty: 150,
    completedQty: 150,
    defectQty: 3,
    status: 'completed',
    paramLogs: [{ batchNo: 'BT-20260529-05', values: [{ name: '夹持力', value: '900', unit: 'N' }] }] as any,
    anomalies: [],
    paramConfig: [{ name: '夹持力', type: 'number', unit: 'N', min: 550, max: 1650 }],
    listMode: false,
    materialList: [],
    materialReady: true
  },
  {
    id: 'OP1040',
    processName: 'OP1050 · 电芯堆叠',
    productName: '电芯 A700 STACK',
    batchNo: 'BT-20260529-18',
    equipmentName: '堆叠台',
    station: '工位 G4-02',
    planQty: 300,
    completedQty: 89,
    defectQty: 0,
    status: 'progressing',
    startTimeReal: Date.now() - 1.2 * 3600000,
    paramLogs: [],
    anomalies: [{ time: '18:15:33', type: '物料异常', description: '电芯缺料', action: '已通知补料' }],
    paramConfig: [],
    listMode: true,
    listFields: [
      { name: '电芯二维码', type: 'text', required: true },
      { name: '绝缘片批次码', type: 'text', required: true },
      { name: '端板组件批次码', type: 'text', required: true }
    ],
    materialList: [
      { sapCode: 'MAT-004', materialName: '堆叠夹具', requiredQty: 1, unit: '套', isUniqueCode: true, consumedItems: [], consumedQuantity: 0 }
    ],
    materialReady: false
  }
])

// 为已有任务补全 materialList 和 materialReady（演示）
tasks.value.forEach(task => {
  if (!task.materialList) task.materialList = []
  if (task.materialReady === undefined) task.materialReady = false
})

// ========== 2. 状态筛选相关 ==========
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

// 辅助函数：状态标签/样式
const statusLabel = (s: string) => ({ pending: '待处理', 'progressing': '加工中', completed: '已完成' }[s] || s)
const statusBadgeClass = (s: string) => ({ pending: 'badge-pending', 'progressing': 'badge-processing', completed: 'badge-completed' }[s] || '')
const progressPercent = (t: Task) => (t.planQty ? Math.round((t.completedQty / t.planQty) * 100) : 0)
const formatDuration = (t: Task) => {
  if (!t.startTimeReal) return '--'
  const diff = Date.now() - t.startTimeReal
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

// ========== 3. 任务操作（开始加工、展开/收起） ==========
const expandedSet = ref<Set<string>>(new Set())
const toggleExpand = (task: Task) => {
  if (expandedSet.value.has(task.id)) expandedSet.value.delete(task.id)
  else expandedSet.value.add(task.id)
}

// 开始加工前检查物料齐套
const startTask = (task: Task) => {
  if (!task.materialReady) {
    Toast.text('请先完成物料录入')
    return
  }
  task.status = 'progressing'
  task.startTimeReal = Date.now()
  task.completedQty = 0
  Toast.success('已开始加工')
}

// ========== 4. 物料录入相关 ==========
const showMaterialPanel = ref(false)
const currentTaskForMaterial = ref<Task | null>(null)
const tempMaterialCode = reactive<Record<string, string>>({})

const openMaterialPanel = (task: Task) => {
  currentTaskForMaterial.value = task
  showMaterialPanel.value = true
}
const closeMaterialPanel = () => {
  showMaterialPanel.value = false
  currentTaskForMaterial.value = null
}

const addMaterialItem = (task: Task, material: MaterialRequirement) => {
  const code = tempMaterialCode[material.sapCode]?.trim()
  if (!code) {
    Toast.text('请输入物料编码')
    return
  }
  if (!material.consumedItems) material.consumedItems = []
  if (material.isUniqueCode) {
    // SN模式：不允许重复
    if (material.consumedItems.some(item => item.code === code)) {
      Toast.text('该SN已录入')
      return
    }
    material.consumedItems.push({ code, quantity: 1, type: 'sn', timestamp: Date.now() })
  } else {
    // 批次模式：相同批次累加数量
    const existing = material.consumedItems.find(item => item.code === code)
    if (existing) existing.quantity += 1
    else material.consumedItems.push({ code, quantity: 1, type: 'batch', timestamp: Date.now() })
  }
  // 更新已录入总数
  material.consumedQuantity = material.consumedItems.reduce((sum, i) => sum + i.quantity, 0)
  tempMaterialCode[material.sapCode] = ''
  // 检查物料是否齐套
  checkMaterialReady(task)
}
const removeMaterialItem = (task: Task, material: MaterialRequirement, idx: number) => {

  if (material.consumedItems) {
    material.consumedItems.splice(idx, 1)
    material.consumedQuantity = material.consumedItems.reduce((sum, i) => sum + i.quantity, 0)
    checkMaterialReady(task)
  }


}
const checkMaterialReady = (task: Task) => {
  const allReady = task.materialList.every(m => (m.consumedQuantity || 0) >= m.requiredQty)
  if (allReady !== task.materialReady) {
    task.materialReady = allReady
    if (allReady) Toast.success('物料已齐套，可开始加工')
  }
}

// ========== 5. 工艺参数录入相关（含范围校验、异常处理） ==========
const showParamPanel = ref(false)
const paramTarget = ref<Task | null>(null)
const currentParamFields = ref<ParamField[]>([])
const paramFieldValues = reactive<Record<string, any>>({})
const paramBatchNo = ref('')
const isListMode = ref(false)
const listFieldsDef = ref<ListField[]>([])
const listItems = ref<any[]>([])

// 参数异常状态
const paramErrorMap = reactive<Record<string, boolean>>({})
const paramActionMap = reactive<Record<string, string>>({})
const paramNewMin = reactive<Record<string, number>>({})
const paramNewMax = reactive<Record<string, number>>({})

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
    currentParamFields.value.forEach(f => { paramFieldValues[f.name] = null })
    // 重置异常状态
    Object.keys(paramErrorMap).forEach(k => delete paramErrorMap[k])
    Object.keys(paramActionMap).forEach(k => delete paramActionMap[k])
    Object.keys(paramNewMin).forEach(k => delete paramNewMin[k])
    Object.keys(paramNewMax).forEach(k => delete paramNewMax[k])
  }
  showParamPanel.value = true
}

// 实时校验参数范围
const validateParam = (param: ParamField, val: any) => {
  if (param.type !== 'number') return
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
  }
}

// 列表模式操作
const addListItem = () => {
  const newItem: any = {}
  listFieldsDef.value.forEach(f => { newItem[f.name] = '' })
  listItems.value.push(newItem)
}
const removeListItem = (idx: number) => {
  if (listItems.value.length > 1) listItems.value.splice(idx, 1)
  else Toast.text('至少保留一行物料')
}

// 提交工艺参数（收集异常并更新进度）
const submitParams = async () => {
  if (!paramTarget.value) return
  if (!paramBatchNo.value.trim()) {
    Toast.text('请填写产品批次号')
    return
  }
  if (isListMode.value) {
    // 列表模式校验
    for (let i = 0; i < listItems.value.length; i++) {
      const item = listItems.value[i]
      for (const f of listFieldsDef.value) {
        if (f.required && (!item[f.name] || item[f.name].trim() === '')) {
          Toast.text(`第 ${i + 1} 行：${f.name} 为必填项`)
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
    Toast.success(`已记录 ${listItems.value.length} 个物料参数`)
  } else {
    // 普通模式：先做普通必填/范围校验
    for (const field of currentParamFields.value) {
      const val = paramFieldValues[field.name]
      if (field.required && (val === null || val === '' || (field.type === 'number' && isNaN(Number(val))))) {
        Toast.text(`请填写必填参数: ${field.name}`)
        return
      }
      if (field.type === 'number' && val !== null && val !== '') {
        const num = Number(val)
        if (isNaN(num)) { Toast.text(`${field.name} 需为数字`); return }
        if (field.min !== undefined && num < field.min) { Toast.text(`${field.name} 不能小于 ${field.min}`); return }
        if (field.max !== undefined && num > field.max) { Toast.text(`${field.name} 不能大于 ${field.max}`); return }
        paramFieldValues[field.name] = num
      }
    }
    // 收集异常信息（超出范围且用户已选择处理方式）
    const anomalyList: any[] = []
    for (const field of currentParamFields.value) {
      if (paramErrorMap[field.name]) {
        if (!paramActionMap[field.name]) {
          Toast.text(`请为参数 ${field.name} 选择处理方式`)
          return
        }
        let actionDesc = ''
        if (paramActionMap[field.name] === 'concession') actionDesc = '让步放行'
        else if (paramActionMap[field.name] === 'change') {
          const newMin = paramNewMin[field.name] ?? field.min
          const newMax = paramNewMax[field.name] ?? field.max
          actionDesc = `申请变更参数范围至 ${newMin}~${newMax}`
        }
        anomalyList.push({
          paramName: field.name,
          actualValue: paramFieldValues[field.name],
          expectedRange: `${field.min}~${field.max}`,
          action: actionDesc
        })
      }
    }
    if (anomalyList.length) {
      const description = anomalyList.map(a => `${a.paramName}=${a.actualValue}（应${a.expectedRange}）`).join('；')
      paramTarget.value.anomalies.push({
        time: new Date().toLocaleString(),
        type: '参数超标',
        description,
        action: anomalyList.map(a => `${a.paramName}：${a.action}`).join('；')
      })
      Toast.warn('已记录参数超标异常，请等待审核')
    }
    // 正常记录参数
    const valuesArr = currentParamFields.value.map(f => ({
      name: f.name,
      value: paramFieldValues[f.name] !== undefined && paramFieldValues[f.name] !== null ? paramFieldValues[f.name] : '--',
      unit: f.unit || ''
    })).filter(v => v.value !== '--')
    const logEntry: ParamLog = {
      batchNo: paramBatchNo.value.trim(),
      isListMode: false,
      values: valuesArr,
      timestamp: Date.now()
    }
    paramTarget.value.paramLogs.push(logEntry)
    Toast.success(`工艺参数已记录，批次号 ${paramBatchNo.value}`)
  }
  // 更新完成数量及进度
  if (paramTarget.value.status === 'progressing') {
    paramTarget.value.completedQty += 1
    if (paramTarget.value.completedQty >= paramTarget.value.planQty) {
      paramTarget.value.status = 'completed'
      Toast.success('本工序已完成！')
    }
  }
  showParamPanel.value = false
}

// ========== 6. 异常记录相关 ==========
const showAnomalyPanel = ref(false)
const anomalyTarget = ref<Task | null>(null)
const anomalyForm = reactive({ type: '', description: '', action: '' })
const showAnomalyActionSheet = ref(false)
const anomalyTypeOptions = [{ name: '设备故障' }, { name: '参数超标' }, { name: '物料异常' }, { name: '环境异常' }, { name: '其他' }]

const openAnomalyPanel = (task: Task) => {
  anomalyTarget.value = task
  anomalyForm.type = ''
  anomalyForm.description = ''
  anomalyForm.action = ''
  showAnomalyPanel.value = true
}
const onSelectAnomalyType = (item: { name: string }) => {
  anomalyForm.type = item.name
}
const submitAnomaly = () => {
  if (!anomalyTarget.value || !anomalyForm.type || !anomalyForm.description) {
    Toast.text('请填写异常类型和描述')
    return
  }
  anomalyTarget.value.anomalies.push({
    time: new Date().toLocaleTimeString(),
    type: anomalyForm.type,
    description: anomalyForm.description,
    action: anomalyForm.action || '待处理'
  })
  showAnomalyPanel.value = false
  Toast.success('异常已记录')
}

// ========== 7. 完成加工弹窗 ==========
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
    Toast.text(`总数不能超过计划${task.planQty}`)
    return
  }
  task.completedQty = total
  task.defectQty = defect
  task.status = 'completed'
  showCompleteDialog.value = false
  Toast.success('工序完成')
}

// ========== 8. Toast 辅助（已在各模块直接调用） ==========
</script>

<style lang="scss" scoped>
@import './prod-operation.scss';
</style>
