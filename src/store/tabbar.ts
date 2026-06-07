import { defineStore } from 'pinia'

export const useTabbarStore = defineStore('tabbar', {
  state: () => ({
    selected: 0, // 当前选中的 tab 索引
  }),
  actions: {
    setSelected(index: number) {
      this.selected = index
    },
  },
})
