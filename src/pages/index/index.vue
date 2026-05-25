<template>
  <view class="pick-material-page">
    <!-- 顶部表单区域 -->
    <view class="form-section">
      <nut-form class="search-form" ref="formRef" :model-value="formData">
        <nut-form-item label="订单号" required>
          <nut-input
            v-model="formData.orderNo"
            placeholder="请输入生产订单号"
            clearable
          />
        </nut-form-item>
        <nut-form-item label="SAP物料号" required>
          <nut-input
            v-model="formData.sapMaterialNo"
            placeholder="请输入SAP物料号"
            clearable
          />
        </nut-form-item>
        <nut-form-item>
          <nut-button
            type="primary"
            block
            :loading="loading"
            @click="handleSubmit"
          >
            查询BOM物料
          </nut-button>
        </nut-form-item>
      </nut-form>
    </view>

    <!-- 物料列表区域，仅在提交成功后显示 -->
    <view v-if="materialList.length > 0" class="material-section">
      <view class="section-header">
        <view class="title">物料清单确认</view>
        <view class="sub-title">
          订单号：{{ formData.orderNo }} | SAP物料号：{{ formData.sapMaterialNo }}
        </view>
      </view>

      <view class="material-tree">
        <MaterialNode
          v-for="(item, index) in materialList"
          :key="index"
          :node="item"
          :depth="0"
        />
      </view>

      <!-- 底部统计与确认按钮 -->
      <view class="footer-action">
        <view class="summary">
          <text>需求总数：{{ totalRequiredQuantity }}</text>
          <text class="separator">|</text>
          <text>本次领用总数：{{ totalPickedQuantity }}</text>
        </view>
        <nut-button type="primary" block @click="handleConfirmPick">
          确认物料领用
        </nut-button>
      </view>
    </view>

    <!-- 空状态提示 -->
    <nut-empty v-else-if="submitted && materialList.length === 0" description="暂无物料数据，请先查询" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import Taro,{showToast} from '@tarojs/taro'
import MaterialNode, { type MaterialItem } from '@/components/material-node/index.vue'

// 表单数据
const formData = reactive({
  orderNo: '',
  sapMaterialNo: ''
})

const loading = ref(false)
const submitted = ref(false)
const materialList = ref<MaterialItem[]>([])

// 统计总需求数量（所有叶子节点的原始需求数量之和）
const totalRequiredQuantity = computed(() => {
  let total = 0
  const traverse = (nodes: MaterialItem[]) => {
    for (const node of nodes) {
      if (!node.hasChildren) {
        total += node.quantity
      } else if (node.children && node.children.length) {
        traverse(node.children)
      }
    }
  }
  traverse(materialList.value)
  return total
})

// 统计总领用数量（所有叶子节点已填写的领用数量之和）
const totalPickedQuantity = computed(() => {
  let total = 0
  const traverse = (nodes: MaterialItem[]) => {
    for (const node of nodes) {
      if (!node.hasChildren) {
        total += node.pickedQuantity || 0
      } else if (node.children && node.children.length) {
        traverse(node.children)
      }
    }
  }
  traverse(materialList.value)
  return total
})

/**
 * 模拟后端API：根据订单号和SAP物料号获取BOM物料树数据
 * 这里使用提供的样例数据，实际项目中可替换为真实请求
 */
const fetchBomMaterialList = async (orderNo: string, sapNo: string): Promise<MaterialItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData: MaterialItem[] = [
        {
          componentCode: 'CA-0070',
          componentName: '方形三元',
          sap: '91030516',
          specificationDescription: '',
          quantity: 0,
          unit: '',
          hasChildren: true,
          children: [
            {
              componentCode: 'SC-0020',
              componentName: 'SC',
              sap: '91049502',
              specificationDescription: '',
              quantity: 1,
              unit: 'EA',
              hasChildren: true,
              children: [
                {
                  componentCode: 'CG-0004',
                  componentName: '锂电池',
                  sap: '81041826',
                  specificationDescription: '_22V_220mAh',
                  quantity: 1,
                  unit: 'each',
                  hasChildren: false,
                  children: []
                },
                {
                  componentCode: 'SL-0710',
                  componentName: '锂离子电池',
                  sap: '91027989',
                  specificationDescription: '_23323_32_23V_2332mAh_陆运_23_34',
                  quantity: 7,
                  unit: 'each',
                  hasChildren: false,
                  children: []
                },
                {
                  componentCode: 'Y-352020-002158',
                  componentName: '箱内低压线',
                  sap: '10150547',
                  specificationDescription: 'EVEBMU3333_0.35mm2_333mm_1111_3333',
                  quantity: 5,
                  unit: 'each',
                  hasChildren: false,
                  children: []
                }
              ]
            },
            {
              componentCode: '10044566',
              componentName: '结构胶',
              sap: '10044566',
              specificationDescription: '德邦_2502H_单组份_硅脂_黑色_体积_600ml/支_0.3W/m*K',
              quantity: 1,
              unit: 'EA',
              hasChildren: false,
              children: []
            },
            {
              componentCode: '10086673',
              componentName: '铝壳预充电阻',
              sap: '10086673',
              specificationDescription: '来福_RX24-200W50RJ_500Ω_5%_无_铝壳_无_无_无',
              quantity: 1,
              unit: 'EA',
              hasChildren: false,
              children: []
            },
            {
              componentCode: 'CN-0014',
              componentName: 'HP电芯',
              sap: '',
              specificationDescription: 'test_111V_1000mAh',
              quantity: 1,
              unit: 'each',
              hasChildren: false,
              children: []
            },
            {
              componentCode: '10050091',
              componentName: '绝缘材料_模切',
              sap: '10050091',
              specificationDescription: '硅胶_285(mm)_90(mm)_3(mm)_淡黄色',
              quantity: 1,
              unit: 'EA',
              hasChildren: false,
              children: []
            }
          ]
        }
      ]
      resolve(mockData)
    }, 500)
  })
}

/**
 * 深度处理物料树：
 * 为每个叶子节点添加 pickedQuantity 字段，默认等于 quantity
 */
const processMaterialTree = (nodes: MaterialItem[]): MaterialItem[] => {
  return nodes.map(node => {
    const newNode: MaterialItem = {
      ...node,
      children: node.children ? processMaterialTree(node.children) : []
    }
    if (!newNode.hasChildren) {
      newNode.pickedQuantity = newNode.quantity
    }
    return newNode
  })
}

// 提交查询
const handleSubmit = async () => {
  if (!formData.orderNo.trim()) {
    Taro.showToast({ title: '请输入生产订单号', icon: 'fail' })
    return
  }
  if (!formData.sapMaterialNo.trim()) {
    Taro.showToast({ title: '请输入SAP物料号', icon: 'fail' })
    return
  }

  loading.value = true
  try {
    const rawData = await fetchBomMaterialList(formData.orderNo, formData.sapMaterialNo)
    const processedData = processMaterialTree(rawData)
    materialList.value = processedData
    submitted.value = true
    showToast({ title: '物料清单加载成功', icon: 'success' })
  } catch (error) {
    console.error('获取物料失败', error)
    showToast({ title: '获取物料失败，请重试', icon: 'fail' })
  } finally {
    loading.value = false
  }
}

// 确认领用
const handleConfirmPick = () => {
  const pickRecords: Array<{
    componentCode: string
    componentName: string
    requiredQty: number
    pickedQty: number
    unit: string
    sap: string
  }> = []

  const traverse = (nodes: MaterialItem[]) => {
    for (const node of nodes) {
      if (!node.hasChildren) {
        pickRecords.push({
          componentCode: node.componentCode,
          componentName: node.componentName,
          requiredQty: node.quantity,
          pickedQty: node.pickedQuantity || 0,
          unit: node.unit || '个',
          sap: node.sap
        })
      } else if (node.children && node.children.length) {
        traverse(node.children)
      }
    }
  }
  traverse(materialList.value)

  if (pickRecords.length === 0) {
    showToast({ title: '没有可领用的物料', icon: 'fail' })
    return
  }

  const zeroPickItems = pickRecords.filter(item => item.pickedQty <= 0)
  if (zeroPickItems.length > 0) {
    const names = zeroPickItems.map(i => i.componentName).join('、')
    showToast({ title: `以下物料领用数量为0：${names}`, icon: 'fail', duration: 2000 })
    return
  }

  const totalPickCount = pickRecords.reduce((sum, item) => sum + item.pickedQty, 0)
  const message = `成功领用物料 ${pickRecords.length} 种，总计 ${totalPickCount} 件。`
  Taro.showModal({
    title: '物料领用确认',
    content: `${message}\n\n订单号：${formData.orderNo}\nSAP物料号：${formData.sapMaterialNo}`,
    confirmText: '确定',
    showCancel: false,
    success: () => {
      showToast({ title: '领用成功，已更新库存', icon: 'success' })
    }
  })
}
</script>

<style lang="scss" scoped>
.pick-material-page {
  min-height: 100vh;
  background-color: #f5f6f7;
  padding-bottom: 20px;
}

.form-section {
  background-color: #fff;
  padding: 20px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .search-form {
    --nutui-form-item-label-width: 80px;
  }
}

.material-section {
  background-color: #fff;
  margin: 12px 12px 80px 12px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .section-header {
    padding: 16px;
    border-bottom: 1px solid #eee;
    background: #fafcff;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #1a2c3e;
      margin-bottom: 6px;
    }
    .sub-title {
      font-size: 12px;
      color: #6c7a8e;
    }
  }

  .material-tree {
    padding: 8px 0 16px 0;
  }

  .footer-action {
    padding: 16px;
    border-top: 1px solid #eee;
    background: #fff;

    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0f9ff;
      padding: 12px 16px;
      border-radius: 40px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #0066cc;
      font-weight: 500;

      .separator {
        margin: 0 8px;
        color: #ccc;
      }
    }
  }
}
</style>