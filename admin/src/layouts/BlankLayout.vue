<template>
  <div class="blank-layout">
    <router-view />
  </div>
</template>

<script setup lang="ts">
/**
 * 空白布局，用于登录页等无需侧边栏的页面
 */
</script>

<style scoped>
.blank-layout {
  width: 100%;
  height: 100vh;
}
</style>
