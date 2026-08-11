import { createApp } from "vue";
import { createPinia } from "pinia";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { history } from "@tarojs/router";

import "./app.scss";

// 仅在原生环境生效
if (Capacitor.isNativePlatform()) {
  App.addListener("backButton", () => {
    if (history.location.pathname != "/pages/work/order-list") {
      window.history.back();
    } else {
      App.removeAllListeners();
      App.exitApp();
    }
  });
}

export default createApp({}).use(createPinia());
