<template>
  <TabbarLayout>
    <view class="picking-page">
      <NavBar title="工艺配置" :show-back="true" />

      <view v-if="!workOrder" class="error-state">
        <nut-empty description="工单不存在或加载失败" />
        <nut-button type="primary" @click="backToList">返回工单列表</nut-button>
      </view>

      <!-- 正常领料表单 -->
      <view v-else class="picking-content">
        <!-- 1. 项目基本信息卡片 -->
        <view class="info-card">
          <view class="card-title">项目信息</view>
          <view class="info-grid">
            <view class="info-item">
              <text class="label">项目名称</text>
              <text class="value">{{ workOrder.workOrderName }}</text>
            </view>
            <view class="info-item">
              <text class="label">生产数量</text>
              <text class="value highlight">{{ workOrder.plannedQty }} EA</text>
            </view>
            <view class="info-item">
              <text class="label">产品名称</text>
              <text class="value">{{ workOrder.materialName }}</text>
            </view>
            <view class="info-item">
              <text class="label">产品SAP</text>
              <text class="value">{{ workOrder.materialSap }}</text>
            </view>

            <view class="info-item">
              <text class="label">工单状态</text>
              <view class="status-badge" :class="statusClass(workOrder.status)">
                {{ statusLabel(workOrder.status) }}
              </view>
            </view>
          </view>
        </view>

        <!-- 2. 物料清单卡片（表格形式） -->
        <view class="info-card">
          <view class="card-title">物料清单 <text class="subtitle">请确认/修改领料数量</text></view>

          <!-- 空状态 -->
          <view v-if="leafMaterialList.length === 0" class="empty-material">
            <text>暂无物料清单</text>
          </view>

          <!-- 物料清单表格（原生表格样式） -->
          <view v-else class="material-table">
            <!-- 表头 -->
            <view class="table-header">
              <view class="col col-sap">物料SAP</view>
              <view class="col col-name">物料名称</view>
              <view class="col col-req-qty">配料总量</view>
              <view class="col col-pick-qty">领料数量</view>
            </view>
            <!-- 数据行 -->
            <view v-for="node in leafMaterialList" :key="node.id" class="table-row">
              <view class="col col-sap">
                <text class="copyable-sap" @click="copySap(node.sap)">
                  {{ node.sap }}
                </text>
              </view>
              <view class="col col-name">
                <text class="material-name">{{ node.componentName }}</text>
                <text class="material-desc">{{ node.specificationDescription }}</text>
              </view>
              <view class="col col-req-qty">
                <text>{{ node.quantity }} {{ node.unit }}</text>
              </view>
              <view class="col col-pick-qty">
                <nut-input type="digit" :model-value="pickedQuantities[node.id]"
                  @update:model-value="(val) => updatePickQty(node.id, node, val)" :placeholder="'实际领料数量'"
                  class="pick-input" />
              </view>
            </view>
          </view>
        </view>

        <!-- 3. 工艺路线选择卡片 -->
        <view class="info-card">
          <view class="card-title">工艺路线 <text class="subtitle">选择该工单使用的工艺</text></view>
          <view class="process-select">
            <nut-radio-group v-model="workOrder.processId" direction="horizontal" @change="routeChange">
              <nut-radio v-for="process in processStore.routes" :key="process.id" :label="process.id"
                class="process-radio">
                <view class="process-info">
                  <text class="process-name">{{ process.routeName }}</text>
                </view>
              </nut-radio>
            </nut-radio-group>
          </view>
        </view>

        <!-- 4. 工序配置 -->
        <view class="steps-container">
          <view v-for="op in routeSteps" :key="op.operationId" class="step-card">
            <view class="step-header">
              <text class="step-name">{{ op.operationCode }} - {{ op.operationName }}</text>
              <nut-button size="small" type="primary" @click="addMaterialRequirement(op)">添加工序投料</nut-button>
            </view>

            <!-- 工序投料清单 - 原生表格 -->
            <view class="native-table" v-if="op.materialDefinitions.length">
              <view class="table-header">
                <view class="col col-sap">物料SAP</view>
                <view class="col col-name">物料名称</view>
                <view class="col col-qty">标准用量</view>
                <view class="col col-control">是否SN</view>
                <view class="col col-action">操作</view>
              </view>
              <view v-for="(req, idx) in op.materialDefinitions" :key="idx" class="table-row">
                <view class="col col-sap">
                  <nut-input type="text" v-model="req.materialSap" placeholder="扫描/输入SAP"
                    @blur="fetchMaterialInfo(req,op,idx)" />
                </view>
                <view class="col col-name">
                  <text class="material-name">{{ req.materialName || '待查询' }}</text>
                </view>
                <view class="col col-qty">
                  <nut-input type="digit" v-model.number="req.standardQty" placeholder="数量" class="qty-input" />
                </view>
                <view class="col col-control">
                  <nut-switch v-model="req.isSNManaged" size="small" />
                </view>
                <view class="col col-action">
                  <nut-button size="small" type="danger" @click="removeMaterialRequirement(op, idx)">删除</nut-button>
                </view>
              </view>
            </view>
            <view v-else class="empty-tip">暂无投料配置，请添加工序投料项</view>
          </view>
        </view>

        <!-- 5. 提交按钮 -->
        <view class="action-buttons">
          <nut-button v-show="workOrder.status == 'Pending'" type="primary" block @click="submitPicking">
            确认并开始生产
          </nut-button>
        </view>
      </view>
    </view>
  </TabbarLayout>
</template>

<script setup lang="ts" name="ProdSetup">
import { ref, onMounted, computed } from 'vue';
import Taro from '@tarojs/taro';
import NavBar from '@/components/NavBar.vue';
import type { WorkOrderDetail } from '@/types/work-order';
import { getWorkOrderDetail } from "@/api/work-order/look-up"
import { configure } from '@/api/work-order';
import TabbarLayout from '@/components/TabbarLayout.vue';
import { useProcessStore } from '@/store/process';
import type { Component } from '@/types/bom';
import { getBomNodeBySapWithChildren } from '@/api/bom';
import { getOrderStatusText } from '@/util/statusText';


// 工单数据
const workOrder = ref<WorkOrderDetail | null>(null);
const routeSteps = ref<Array<OperationConfig>>([]);

// 扁平化的物料列表（用于渲染）
const flattenedMaterialList = ref<Component[]>([]);
// 各物料的实领数量
const pickedQuantities = ref<Record<string, number>>({});

// 叶子节点物料列表（用于展示领料清单）
const leafMaterialList = computed(() => {
  return flattenedMaterialList.value.filter(node => !node.hasChildren);
});
// 工艺信息
const processStore = useProcessStore();


interface MaterialDefinition {
  materialSap: string;
  materialName: string;
  standardQty: number;
  isSNManaged: boolean;
  sequence: number;
}

interface OperationConfig {
  operationId: string,
  operationCode: string,
  operationName: string,
  materialDefinitions: MaterialDefinition[]
}

const routesMap = new Map<string, Array<OperationConfig>>();

// 计算每个物料的实际需求数量
const calculateRequiredQty = (node: Component): number => {
  if (!workOrder.value) return 0;
  const baseQty = (node.quantity || 1) / workOrder.value.plannedQty;
  return node.hasChildren ? 0 : baseQty;
};

// 更新领料数量
const updatePickQty = (nodeId: string, node: Component, value: number | string) => {
  let numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) numValue = 0;
  const required = node.quantity;
  if (numValue < 0) {
    numValue = 0;
    Taro.showToast({ title: '数量不能为负数', icon: 'none' });
  } else if (numValue > required && required > 0) {
    numValue = required;
    Taro.showToast({ title: `不能超过配料总数 ${required}`, icon: 'none' });
  }
  pickedQuantities.value[nodeId] = numValue;
};

// 递归扁平化BOM树
function flattenTree(node: Component, list: Array<Component> = []) {
  list.push(node as Component);
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => flattenTree(child, list));
  }
  return list;
}

// 加载BOM树
const loadBomTree = async (productSap: string) => {
  if (!productSap) return;
  const rootNode = await getBomNodeBySapWithChildren(productSap);
  if (!rootNode?.id) {
    throw new Error('未找到BOM根节点');
  }
  flattenedMaterialList.value = flattenTree(rootNode);
  // 初始化领料数量为需求数量
  pickedQuantities.value = {};
  leafMaterialList.value.forEach(node => {
    pickedQuantities.value[node.id] = node.quantity;
  });
};

// 获取物料列表（用于提交）
const getMaterialListForSubmit = () => {
  return leafMaterialList.value.map(node => ({
    materialSap: node.sap,
    materialName: node.componentName,
    standardQty: node.quantity,
    pickedQty: pickedQuantities.value[node.id] || 0,
    unit: node.unit
  }));
};

// 状态辅助函数
const statusLabel = (s: string) => getOrderStatusText(s);
const statusClass = (s: string) => ({ Pending: 'status-pending', Processing: 'status-progress', Completed: 'status-completed' }[s] || '');

// 返回工单列表
const backToList = () => {
  Taro.navigateTo({ url: '/pages/work/order-list' });
};

// 提交领料
const submitPicking = async () => {
  if (workOrder.value == null) return;
  const materialList = getMaterialListForSubmit();
  console.log('提交的物料列表:', materialList);
  if (materialList.length === 0) {
    Taro.showToast({ title: '无物料需要领料', icon: 'none' });
    return;
  }
  for (let i = materialList.length - 1; i >= 0; i--) {
    let item = materialList[i];
    let pickQty = item.pickedQty ?? 0;
    if (pickQty === 0) {
      materialList.splice(i, 1);
      break;
    }
    if (pickQty <= 0 || pickQty > item.standardQty) {
      Taro.showToast({ title: `${item.materialName}不得大于配料总数.`, icon: 'none' });
      return;
    }
  }
  const confirm = await Taro.showModal({ title: '确认配置',content: `确定工艺和投料配置？`, confirmText: '确认',cancelText: '取消'});
  if (!confirm.confirm) return;
  let para = {
    processId: workOrder.value?.processId,
    materialRequirements: materialList,
    operations: Object.fromEntries(routeSteps.value.map(op => [op.operationId, op.materialDefinitions]))
  };
  await configure(workOrder.value.id, para);
  Taro.showToast({ title: '配置成功，跳转到生产页面。', icon: 'success', duration: 900 });
  setTimeout(() => {
    Taro.navigateTo({ url: `/pages/prod/prod-operation?workOrderId=${workOrder.value?.id}` });
  }, 1000);
};

// 工序投料配置方法
const addMaterialRequirement = (op: OperationConfig) => {
  op.materialDefinitions.push({
    materialName: '',
    materialSap: '',
    standardQty: 1,
    isSNManaged: false,
    sequence: op.materialDefinitions.length + 1,
  });
};

const removeMaterialRequirement = (op: OperationConfig, idx: number) => {
  op.materialDefinitions.splice(idx, 1);
  op.materialDefinitions.forEach((req, i) => (req.sequence = i + 1));
};

const fetchMaterialInfo = (req: MaterialDefinition,op:OperationConfig, idx: number) => {
  if (!req.materialSap || req.materialSap.trim() === '') return;
  const found = leafMaterialList.value.find(i => i.sap === req.materialSap);
  if (found) {
    req.materialSap = found.sap;
    req.materialName = found.componentName;
    req.standardQty = found.quantity / workOrder.value!.plannedQty;
  }else{
    Taro.showToast({ title: `SAP:${req.materialSap} 不在BOMS清单之中。`, icon: 'none' });
    setTimeout(() => {
      op.materialDefinitions.splice(idx, 1);
    }, 300);
  }
};

// 工艺路线切换
const routeChange = (value: string) => {
  let routes = routesMap.get(value);
  if (!routes) {
    routes = [];
    processStore.routes.find(i => i.id == value)?.routeSteps.forEach(r => {
      routes?.push({
        operationId: r.id,
        operationCode: r.operationCode,
        operationName: r.operationName,
        materialDefinitions: [],
      });
    });
    routesMap.set(value, routes);
  }
  routeSteps.value = routes;
  console.log(routes);
};

// 加载工单信息
const loadData = async () => {
  const instance = Taro.getCurrentInstance();
  const workOrderId = instance?.router?.params?.workOrderId || instance?.router?.params?.id || '';
  if (!workOrderId) {
    Taro.showToast({ title: '参数错误，自动跳转到工单列表', icon: 'none' });
    setTimeout(() => Taro.navigateTo({ url: '/pages/work/order-list' }), 1500);
    return;
  }
  try {
    const data = await getWorkOrderDetail(workOrderId);
    workOrder.value = data;
    if (data.materialSap) {
      await loadBomTree(data.materialSap);
      if (workOrder.value.processId) {
        routeChange(workOrder.value.processId);
      }
    }
  } catch (err) {
    console.error('加载工单失败:', err);
    Taro.showToast({ title: '加载工单失败', icon: 'none' });
    workOrder.value = null;
  }
};

// 复制sap
const copySap = (sapCode: string) => {
  Taro.setClipboardData({
    data: sapCode,
    success: () => {
      Taro.showToast({ title: 'SAP已复制', icon: 'success' });
    },
    fail: () => {
      Taro.showToast({ title: '复制失败', icon: 'none' });
    },
  });
};

onMounted(() => {
  if (processStore.routes.length === 0) {
    processStore.getRoutes();
  }
  loadData();
});
</script>

<style lang="scss" scoped>
@import "./prod-setup.scss";
</style>
