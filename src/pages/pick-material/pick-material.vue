<template>
  <view class="pick-material-page">
    <!-- 项目列表组件 -->
    <NavBar title="生产领料" />
    <ProjectList :projects="projectList" :selected-id="selectedProject?.projectId" @select="selectProject">
    </ProjectList>
    <!-- 物料列表区域 -->
    <view v-if="selectedProject && materialList.length > 0" class="material-section">

      <view class="section-header">
        <view class="title">物料清单确认</view>
        <view class="sub-title">
          项目：{{ selectedProject.projectName }} | SAP物料号：{{ selectedProject.sap }}
        </view>
      </view>

      <view class="material-tree">
        <MaterialNode v-for="(item, index) in materialList" :key="index" :node="item" :depth="0"
          @update:picked-quantity="handlePickQuantityUpdate" />
      </view>

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
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'
import ProjectList from '@/components/ProjectList.vue'
import MaterialNode from '@/components/MaterialNode.vue'
import NavBar from '@/components/NavBar.vue'
import type { ProjectInfo } from '@/types/project'
import type { MaterialItem } from '@/types/material'

// 模拟项目列表
const projectList = ref<ProjectInfo[]>([
  {
    projectId: '149817',
    projectCode: 'PJ_1208',
    projectName: 'PT043D-280-R2.1_215.04kWh_南阳金冠',
    sap: '91071573',
    productName: 'PT043D-280-R2.1',
    productCode: 'ES-0746',
    quantity: 5,
  },
  {
    projectId: '149818',
    projectCode: 'PJ_1209',
    projectName: 'PT053E-300-R2.0_250kWh_郑州宇通',
    sap: '91071574',
    productName: 'PT053E-300-R2.0',
    productCode: 'ES-0747',
    quantity: 3,
  },
])

const selectedProject = ref<ProjectInfo | null>(null)
const materialList = ref<MaterialItem[]>([])

// 统计总需求数量
const totalRequiredQuantity = computed(() => {
  let total = 0
  const traverse = (nodes: MaterialItem[]) => {
    for (const node of nodes) {
      if (!node.hasChildren) {
        total += node.quantity
      } else if (node.children?.length) {
        traverse(node.children)
      }
    }
  }
  traverse(materialList.value)
  return total
})

// 统计总领用数量
const totalPickedQuantity = computed(() => {
  let total = 0
  const traverse = (nodes: MaterialItem[]) => {
    for (const node of nodes) {
      if (!node.hasChildren) {
        total += node.pickedQuantity || 0
      } else if (node.children?.length) {
        traverse(node.children)
      }
    }
  }
  traverse(materialList.value)
  return total
})

// 获取物料数据（模拟）
const fetchBomMaterialList = async (project: ProjectInfo): Promise<MaterialItem[]> => {
  // 模拟网络延迟
  console.log(`Fetching BOM material list for project: ${project.projectName} (SAP: ${project.sap})`)
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
    }, 1000)
  })
}

const processMaterialTree = (nodes: MaterialItem[]): MaterialItem[] => {
  return nodes.map(node => ({
    ...node,
    children: node.children ? processMaterialTree(node.children) : [],
    pickedQuantity: node.hasChildren ? undefined : node.quantity
  }))
}

const selectProject = async (project: ProjectInfo) => {
  if (selectedProject.value?.projectId === project.projectId){
    selectedProject.value = null;
    return
  }
  selectedProject.value = project
  Taro.showLoading({ title: '加载物料清单中...', mask: true })
  try {
    const rawData = await fetchBomMaterialList(project)
    materialList.value = processMaterialTree(rawData)
  } catch (error) {
    Taro.showToast({ title: '加载失败', icon: 'error' })
  } finally {
    Taro.hideLoading()
  }
}

// 确认领用
const handleConfirmPick = async () => {
  if (!selectedProject.value) return

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
      } else if (node.children?.length) {
        traverse(node.children)
      }
    }
  }
  traverse(materialList.value)

  if (pickRecords.length === 0) {
    Taro.showToast({ title: '没有可领用的物料', icon: 'error' })
    return
  }



  const zeroPickItems = pickRecords.filter(item => item.pickedQty <= 0)
  if (zeroPickItems.length > 0) {
    const names = zeroPickItems.map(i => i.componentName).join('、')
    Taro.showToast({ title: `以下物料领用数量为0：${names}`, icon: 'error', duration: 2000 })
    return
  }

  const totalPickCount = pickRecords.reduce((sum, item) => sum + item.pickedQty, 0)
  const message = `成功领用物料 ${pickRecords.length} 种，总计 ${totalPickCount} 件。`
  Taro.showLoading({ title: '提交领用中...', mask: true })
  try {
    // 模拟提交API调用（可替换为真实请求）
    await new Promise(resolve => setTimeout(resolve, 1000))
    Taro.hideLoading()
    Taro.showModal({
      title: '物料领用确认',
      content: message,
      confirmText: '确定',
      showCancel: false,
    })
  } catch (error) {
    Taro.hideLoading()
    Taro.showToast({ title: '提交失败', icon: 'error' })
  }
}

/**
 * 递归更新物料树中指定物料的领用数量
 */
const updatePickedQuantity = (nodes: MaterialItem[], componentCode: string, newQuantity: number): boolean => {
  for (const node of nodes) {
    if (node.componentCode === componentCode && !node.hasChildren) {
      node.pickedQuantity = newQuantity
      return true
    }
    if (node.children && node.children.length) {
      const found = updatePickedQuantity(node.children, componentCode, newQuantity)
      if (found) return true
    }
  }
  return false
}

const handlePickQuantityUpdate = (payload: { componentCode: string; pickedQuantity: number }) => {
  updatePickedQuantity(materialList.value, payload.componentCode, payload.pickedQuantity)
}
</script>


<style lang="scss">
.pick-material-page {
  min-height: 100vh;
  background-color: $help-color;              // #f5f5f5 替换 #f5f6f7
  padding-bottom: 20px;
}

.material-section {
  background-color: #fff;
  margin: 0 12px 80px 12px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);  // 保留：NutUI 无阴影变量

  .section-header {
    padding: 16px;
    border-bottom: 1px solid $help-color;       // 替换 #eee
    background: #fafcff;                       // 保留：带蓝调的浅背景，无对应变量

    .title {
      font-size: 17px;                         // 保留：介于 $font-size-3(16px) 与 $font-size-4(18px) 之间
      font-weight: 600;
      color: $title-color;                     // 替换 #1a2c3e → #1A1A1A
      margin-bottom: 6px;
    }

    .sub-title {
      font-size: $font-size-2;                 // 14px 替换硬编码
      color: $title-color2;                    // 替换 #6c7a8e → #666666
    }
  }

  .material-tree {
    padding: 8px 0 16px 0;
  }

  .footer-action {
    padding: 16px;
    border-top: 1px solid $help-color;          // 替换 #eee
    background: #fff;

    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0f9ff;                     // 保留：业务汇总区浅蓝高亮背景
      padding: 12px 16px;
      border-radius: 40px;
      margin-bottom: 16px;
      font-size: $font-size-2;                 // 14px
      color: #0066cc;                          // 保留：业务高亮蓝，不同于 $primary-color(#478EF2)
      font-weight: 500;

      .separator {
        margin: 0 8px;
        color: #ccc;                           // 保留：中等灰分隔符，$help-color 太浅，$title-color2 太深
      }
    }
  }
}
</style>

