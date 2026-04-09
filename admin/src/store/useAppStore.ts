import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 应用全局状态管理
 * 管理侧边栏折叠、主题等全局 UI 状态
 */
export const useAppStore = defineStore('app', () => {
  const collapsed = ref(false);
  const theme = ref<'light' | 'dark'>('light');
  const menuWidth = computed(() => (collapsed.value ? 48 : 220));

  function toggleCollapsed() {
    collapsed.value = !collapsed.value;
  }

  function setTheme(val: 'light' | 'dark') {
    theme.value = val;
    document.body.setAttribute('arco-theme', val);
  }

  return { collapsed, theme, menuWidth, toggleCollapsed, setTheme };
});
