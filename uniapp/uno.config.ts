import { defineConfig, presetUno, presetAttributify } from 'unocss';

/**
 * UnoCSS 配置 — 用户端
 * 主色调 #2563EB（品牌蓝），背景 #F0F4F8
 */
export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  theme: {
    colors: {
      primary: '#2563EB',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
      bg: '#F0F4F8',
      up: '#10B981',
      down: '#EF4444',
    },
  },
  shortcuts: {
    'page-bg': 'min-h-screen bg-bg',
    'card': 'bg-white rounded-2xl p-4 mx-3 mb-3',
    'section-title': 'text-base font-bold text-gray-800 mb-2',
    'price-up': 'text-up',
    'price-down': 'text-down',
  },
});
