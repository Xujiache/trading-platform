import { defineConfig, presetUno, presetAttributify } from 'unocss';

/**
 * UnoCSS 配置 — 管理后台
 */
export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  theme: {
    colors: {
      primary: '#2563EB',
    },
  },
  shortcuts: {
    'page-header': 'mb-4',
    'search-bar': 'flex gap-3 mb-4',
    'card-gap': 'mt-4',
  },
});
