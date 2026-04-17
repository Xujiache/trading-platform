<template>
  <ElRow :gutter="20" class="flex">
    <ElCol v-for="(item, index) in dataList" :key="index" :sm="12" :md="6" :lg="6">
      <div class="art-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4">
        <span class="text-g-700 text-sm">{{ item.des }}</span>
        <ArtCountTo class="text-[26px] font-medium mt-2" :target="item.num" :duration="1300" />
        <div class="flex-c mt-1">
          <span class="text-xs text-g-600">{{ item.sub }}</span>
        </div>
        <div
          class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc bg-theme/10"
        >
          <ArtSvgIcon :icon="item.icon" class="text-xl text-theme" />
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue'
  import { fetchOperationsOverview } from '@/api/admin-report'
  import { fetchActivityStats } from '@/api/admin-operation'

  interface CardDataItem {
    des: string
    icon: string
    startVal: number
    duration: number
    num: number
    sub: string
  }

  const dataList = reactive<CardDataItem[]>([
    { des: '注册用户数', icon: 'ri:group-line', startVal: 0, duration: 1000, num: 0, sub: '平台总用户' },
    { des: '累计入金', icon: 'ri:money-dollar-circle-line', startVal: 0, duration: 1000, num: 0, sub: '美元' },
    { des: '累计手续费', icon: 'ri:bar-chart-2-line', startVal: 0, duration: 1000, num: 0, sub: '平台收入' },
    { des: '进行中活动', icon: 'ri:calendar-event-line', startVal: 0, duration: 1000, num: 0, sub: '运营活动' },
  ])

  onMounted(async () => {
    try {
      const [opsData, actData] = await Promise.all([
        fetchOperationsOverview().catch(() => null),
        fetchActivityStats().catch(() => null),
      ])
      if (opsData) {
        dataList[0].num = opsData.newUsers || 0
        dataList[1].num = Math.round(opsData.totalDeposit || 0)
        dataList[2].num = Math.round(opsData.totalCommission || 0)
      }
      if (actData) {
        dataList[3].num = actData.active || 0
      }
    } catch (e) { /* 静默处理 */ }
  })
</script>
