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

<script setup lang="ts" name="ProjectList">
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

<style lang="scss" scoped>
.project-list-container {
  background-color: $white;
  padding: 16px;
  margin: 12px;
  border-radius: $popup-border-radius; // 8px，与科技主题弹窗圆角一致

  .section-title {
    font-size: $font-size-3; // 16px
    font-weight: 600;
    color: $title-color;
    margin-bottom: 12px;
    padding-left: 4px;
    border-left: 4px solid $primary-color;
  }

  .project-list {
    .project-card {
      background: $help-color;
      border-radius: 12px;
      padding: 12px 16px;
      border: 1px solid rgba(0, 0, 0, 0.06); // 使用主题中的浅色边框变量
      transition: all 0.2s;
      margin-bottom: 12px;

      .project-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: $font-size-3; // 16px

        .project-code {
          font-weight: 600;
          color: $primary-color;
          background: rgba($primary-color, 0.15); // 主色浅色背景
          padding: 2px 8px;
          border-radius: 16px;
          flex-shrink: 0;
        }

        .project-name {
          flex: 1;
          font-weight: 500;
          color: $title-color;
          word-break: break-word;
        }

        .project-status {
          font-size: $font-size-2; // 14px
          color: $button-success-background-color; // #0ed57d
          background: rgba($button-success-background-color, 0.15);
          padding: 2px 8px;
          border-radius: 16px;
          margin-left: auto;
        }
      }

      .project-info {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: $font-size-2; // 14px
        color: $title-color2;

        .info-item {
          background: $white;
          padding: 2px 8px;
          border-radius: $tag-default-border-radius; // 4px
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
      }
    }

    .project-card:last-child {
      margin-bottom: 0;
    }

    .project-card.active {
      background: rgba($primary-color, 0.08);
      border-color: $primary-color;
      box-shadow: 0 2px 8px rgba($primary-color, 0.1);
    }
  }
}
</style>

