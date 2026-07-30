import { showLoading, hideLoading } from '@tarojs/taro';

class LoadingManager {
  private count = 0;
  private static instance: LoadingManager;

  static getInstance() {
    if (!this.instance) {
      this.instance = new LoadingManager();
    }
    return this.instance;
  }

  show() {
    if (this.count === 0) {
      showLoading({ title: '加载中', mask: true });
    }
    this.count++;
  }

  hide() {
    if (this.count > 0) {
      this.count--;
    }
    if (this.count === 0) {
      hideLoading();
    }
  }

  forceHide() {
    if (this.count > 0) {
      this.count = 0;
      hideLoading();
    }
  }
}

export const loadingManager = LoadingManager.getInstance();
