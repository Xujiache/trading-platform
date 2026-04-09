import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

/**
 * 创建应用实例，注册 Pinia 状态管理
 */
export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  app.use(pinia);
  return { app };
}
