// stores/process.ts
import { defineStore } from 'pinia'
import type { ProcessRoute, RouteStep } from '@/types/process'
import { getAllProcess } from '@/api/process'


export const useProcessStore = defineStore('process', {
  state: () => ({
    routes: [] as ProcessRoute[]
  }),

  getters: {
    // 根据 id 获取工艺路线
    getRouteById: (state) => (id: string) => {
      return state.routes.find(route => route.id === id)
    },

    // 获取某个工艺路线下的所有步骤
    getStepsByRouteId: (state) => (routeId: string) => {
      const route = state.routes.find(r => r.id === routeId)
      return route?.routeSteps || []
    },

    // 获取某个步骤（通过路线 id 和 stepOrder）
    getStepByOrder: (state) => (routeId: string, stepOrder: number) => {
      const route = state.routes.find(r => r.id === routeId)
      return route?.routeSteps.find(step => step.stepOrder === stepOrder)
    }
  },

  actions: {
    // 初始化加载数据（可从 API 获取）
    async getRoutes() {
      this.routes = await getAllProcess()
    },

    // 新增工艺路线
    addRoute(routeName: string) {
      const newRoute: ProcessRoute = {
        id:'',
        routeName,
        routeSteps: []
      }
      this.routes.push(newRoute)
      return newRoute
    },

    // 删除工艺路线
    deleteRoute(routeId: string) {
      const index = this.routes.findIndex(r => r.id === routeId)
      if (index !== -1) this.routes.splice(index, 1)
    },

    // 更新路线名称
    updateRouteName(routeId: string, newName: string) {
      const route = this.routes.find(r => r.id === routeId)
      if (route) route.routeName = newName
    },

    // 向指定路线添加工序步骤
    addStep(routeId: string, step: Omit<RouteStep, 'stepOrder'>) {
      const route = this.routes.find(r => r.id === routeId)
      if (!route) return

      // 自动计算 stepOrder（最大序号+1）
      const maxOrder = route.routeSteps.reduce((max, s) => Math.max(max, s.stepOrder), 0)
      const newStep: RouteStep = {
        ...step,
        stepOrder: maxOrder + 1
      }
      route.routeSteps.push(newStep)
    },

    // 更新某个步骤的信息
    updateStep(routeId: string, stepOrder: number, updatedData: Partial<RouteStep>) {
      const route = this.routes.find(r => r.id === routeId)
      if (!route) return
      const step = route.routeSteps.find(s => s.stepOrder === stepOrder)
      if (step) Object.assign(step, updatedData)
    },

    // 删除指定步骤
    deleteStep(routeId: string, stepOrder: number) {
      const route = this.routes.find(r => r.id === routeId)
      if (!route) return
      const index = route.routeSteps.findIndex(s => s.stepOrder === stepOrder)
      if (index !== -1) {
        route.routeSteps.splice(index, 1)
        // 重新整理剩余步骤的 stepOrder（可选，保持连续）
        this.reorderSteps(route)
      }
    },

    // 重新整理步骤顺序（使 stepOrder 从 1 开始连续递增）
    reorderSteps(route: ProcessRoute) {
      route.routeSteps.sort((a, b) => a.stepOrder - b.stepOrder)
      route.routeSteps.forEach((step, idx) => {
        step.stepOrder = idx + 1
      })
    },

    // 移动步骤顺序（交换两个步骤的 stepOrder）
    moveStep(routeId: string, fromOrder: number, toOrder: number) {
      const route = this.routes.find(r => r.id === routeId)
      if (!route) return
      const steps = route.routeSteps
      const fromIndex = steps.findIndex(s => s.stepOrder === fromOrder)
      const toIndex = steps.findIndex(s => s.stepOrder === toOrder)
      if (fromIndex === -1 || toIndex === -1) return

      // 交换 stepOrder
      [steps[fromIndex].stepOrder, steps[toIndex].stepOrder] = [steps[toIndex].stepOrder, steps[fromIndex].stepOrder]
      // 重新排序
      steps.sort((a, b) => a.stepOrder - b.stepOrder)
    }
  }
})
