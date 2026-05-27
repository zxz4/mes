<template>
  <view class="project-list-container">
    <view class="section-title">请选择项目</view>
    <scroll-view scroll-y class="project-list">
      <view v-for="project in projects" :key="project.projectId" class="project-card"
        :class="{ active: isSelected(project) }" @click="handleSelect(project)">
        <view class="project-header">
          <text class="project-code">{{ project.projectCode }}</text>
          <text class="project-name">{{ project.projectName }}</text>
          <text class="project-status" v-if="isSelected(project)">已选中</text>
        </view>
        <view class="project-info">
          <text class="info-item">SAP物料号：{{ project.sap }}</text>
          <text class="info-item">产品：{{ project.productName }} ({{ project.productCode }})</text>
          <text class="info-item">生产数量：{{ project.quantity }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import type { ProjectInfo } from '@/types/project'

const props = defineProps<{
  projects: ProjectInfo[]
  selectedId?: string
}>()

const emit = defineEmits<{
  select: [project: ProjectInfo]
}>()

const isSelected = (project: ProjectInfo) => project.projectId === props.selectedId

const handleSelect = (project: ProjectInfo) => {
  emit('select', project)
}
</script>

<script lang="ts">
// 用于递归组件识别，无实际作用，但避免 TS 报错
export default {
  name: 'ProjectList'
}
</script>

<style type="css">
.project-list-container {
  background-color: #fff;
  padding: 16px;
  margin: 12px 12px 12px 12px;
  border-radius: 16px;

  .section-title {
    font-size: 17px;
    font-weight: 600;
    color: #1a2c3e;
    margin-bottom: 12px;
    padding-left: 4px;
    border-left: 4px solid #2979ff;
  }

  .project-list {
    .project-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
      margin-bottom: 12px;

      .project-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 15px;

        .project-code {
          font-weight: 600;
          color: #2979ff;
          background: #e0e7ff;
          padding: 2px 8px;
          border-radius: 16px;
          flex-shrink: 0;
        }

        .project-name {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
          word-break: break-word;
        }

        .project-status {
          font-size: 14px;
          color: #16a34a;
          background: #dcfce7;
          padding: 2px 8px;
          border-radius: 16px;
          margin-left: auto;
        }

      }

      .project-info {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 14px;
        color: #475569;

        .info-item {
          background: #ffffff;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
      }
    }

    .project-card:last-child {
      margin-bottom: 0;
    }

    .project-card.active {
      background: #eef2ff;
      border-color: #2979ff;
      box-shadow: 0 2px 8px rgba(41, 121, 255, 0.1);
    }
  }
}
</style>
