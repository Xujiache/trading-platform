<template>
  <ElDialog :model-value="visible" @update:model-value="$emit('update:visible', $event)"
    :title="type === 'add' ? '新增品种' : '编辑品种'" width="820px" :close-on-click-modal="false"
    @open="handleOpen">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="120px">
      <ElTabs v-model="activeTab">
        <ElTabPane label="基础信息" name="basic">
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="品种代码" prop="symbol">
                <ElInput v-model="form.symbol" placeholder="如 XAUUSD" :disabled="type === 'edit'" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="品种名称" prop="name">
                <ElInput v-model="form.name" placeholder="如 黄金/美元" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="品种分类" prop="category">
                <ElSelect v-model="form.category" style="width: 100%">
                  <ElOption label="贵金属" value="precious_metal" />
                  <ElOption label="能源" value="energy" />
                  <ElOption label="外汇" value="forex" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="合约单位">
                <ElInput v-model="form.contract_unit" placeholder="如 100盎司" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="价格小数位">
                <ElInputNumber v-model="form.price_decimals" :min="0" :max="8" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="排序权重">
                <ElInputNumber v-model="form.sort_order" :min="0" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="最小手数">
                <ElInputNumber v-model="form.min_lot" :min="0.0001" :step="0.01" :precision="4" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="最大手数">
                <ElInputNumber v-model="form.max_lot" :min="0.01" :step="1" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="最小杠杆">
                <ElInputNumber v-model="form.min_leverage" :min="1" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="最大杠杆">
                <ElInputNumber v-model="form.max_leverage" :min="1" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="是否热门">
                <ElSwitch v-model="form.is_hot" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="24">
              <ElFormItem label="品种描述">
                <ElInput v-model="form.description" type="textarea" :rows="2" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElTabPane>

        <ElTabPane label="K线模拟" name="sim">
          <ElAlert type="info" :closable="false" show-icon
            title="行情源说明"
            description="real 使用外部真实行情 / 模拟随机游走；custom 完全由下方参数驱动；hybrid 外部价为底并叠加偏置。custom/hybrid 保存前请先填写下方区间参数。"
            style="margin-bottom: 16px" />

          <ElRow :gutter="20">
            <ElCol :span="24">
              <ElFormItem label="行情源模式">
                <ElRadioGroup v-model="form.price_source">
                  <ElRadioButton value="real">real 真实行情</ElRadioButton>
                  <ElRadioButton value="custom">custom 自控模拟</ElRadioButton>
                  <ElRadioButton value="hybrid">hybrid 混合</ElRadioButton>
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
          </ElRow>

          <div v-if="form.price_source !== 'real'" class="sim-block">
            <ElDivider content-position="left">价格区间</ElDivider>
            <ElRow :gutter="20">
              <ElCol :span="8">
                <ElFormItem label="中枢价格">
                  <ElInputNumber v-model="sim.center_price" :step="stepByDecimals" :precision="form.price_decimals || 2"
                    style="width: 100%" :min="0" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="区间下限">
                  <ElInputNumber v-model="sim.lower_bound" :step="stepByDecimals" :precision="form.price_decimals || 2"
                    style="width: 100%" :min="0" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="区间上限">
                  <ElInputNumber v-model="sim.upper_bound" :step="stepByDecimals" :precision="form.price_decimals || 2"
                    style="width: 100%" :min="0" />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElDivider content-position="left">趋势与波动</ElDivider>
            <ElRow :gutter="20">
              <ElCol :span="12">
                <ElFormItem label="趋势方向">
                  <ElRadioGroup v-model="sim.trend_direction">
                    <ElRadioButton value="up">上涨</ElRadioButton>
                    <ElRadioButton value="sideways">震荡</ElRadioButton>
                    <ElRadioButton value="down">下跌</ElRadioButton>
                  </ElRadioGroup>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="趋势强度">
                  <div style="display:flex;align-items:center;width:100%;gap:12px">
                    <ElSlider v-model="sim.trend_strength" :min="0" :max="1" :step="0.05" style="flex:1" />
                    <span style="width:48px;text-align:right">{{ sim.trend_strength.toFixed(2) }}</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="波动强度">
                  <ElRadioGroup v-model="sim.volatility_level">
                    <ElRadioButton value="low">低</ElRadioButton>
                    <ElRadioButton value="medium">中</ElRadioButton>
                    <ElRadioButton value="high">高</ElRadioButton>
                    <ElRadioButton value="custom">自定义</ElRadioButton>
                  </ElRadioGroup>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12" v-if="sim.volatility_level === 'custom'">
                <ElFormItem label="自定义σ">
                  <ElInputNumber v-model="sim.volatility_sigma" :step="0.0001" :precision="6"
                    :min="0.00001" :max="0.02" style="width: 100%" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="Tick 间隔 (ms)">
                  <div style="display:flex;align-items:center;width:100%;gap:12px">
                    <ElSlider v-model="sim.tick_interval_ms" :min="200" :max="10000" :step="100" style="flex:1" />
                    <span style="width:70px;text-align:right">{{ sim.tick_interval_ms }}</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="12">
                <ElFormItem label="单 tick 限幅 %">
                  <ElInputNumber v-model="maxTickChangePctPercent" :min="0.01" :max="5" :step="0.05" :precision="4"
                    style="width: 100%" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="12" v-if="form.price_source === 'hybrid'">
                <ElFormItem label="hybrid 偏置">
                  <ElInputNumber v-model="sim.hybrid_bias" :step="0.1" :precision="4" style="width: 100%" />
                </ElFormItem>
              </ElCol>
            </ElRow>

            <ElDivider content-position="left">预估</ElDivider>
            <ElAlert type="success" :closable="false" show-icon>
              <template #title>
                <div>{{ previewText }}</div>
              </template>
            </ElAlert>
          </div>
        </ElTabPane>

        <ElTabPane label="点差配置" name="spread">
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="点差模式">
                <ElSelect v-model="form.spread_mode" style="width: 100%">
                  <ElOption label="固定点差" value="fixed" />
                  <ElOption label="浮动点差" value="float" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12" v-if="form.spread_mode === 'fixed'">
              <ElFormItem label="固定点差">
                <ElInputNumber v-model="form.spread_fixed" :min="0" :step="0.1" :precision="4" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12" v-if="form.spread_mode === 'float'">
              <ElFormItem label="最小点差">
                <ElInputNumber v-model="form.spread_min" :min="0" :step="0.1" :precision="4" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12" v-if="form.spread_mode === 'float'">
              <ElFormItem label="最大点差">
                <ElInputNumber v-model="form.spread_max" :min="0" :step="0.1" :precision="4" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="Tick大小">
                <ElInputNumber v-model="form.tick_size" :min="0.00000001" :step="0.00001" :precision="8" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="Tick价值">
                <ElInputNumber v-model="form.tick_value" :min="0.00000001" :step="0.00001" :precision="8" style="width: 100%" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElTabPane>

        <ElTabPane label="手续费配置" name="fee">
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="手续费模式">
                <ElSelect v-model="form.fee_mode" style="width: 100%">
                  <ElOption label="单边收费" value="one_side" />
                  <ElOption label="双边收费" value="both_side" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="手续费类型">
                <ElSelect v-model="form.fee_type" style="width: 100%">
                  <ElOption label="按手计费" value="per_lot" />
                  <ElOption label="按比例计费" value="percentage" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="费率值">
                <ElInputNumber v-model="form.fee_value" :min="0" :step="0.1" :precision="4" style="width: 100%" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElTabPane>

        <ElTabPane label="隔夜费配置" name="swap">
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="多单隔夜费率">
                <ElInputNumber v-model="form.swap_long_rate" :step="0.001" :precision="6" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="空单隔夜费率">
                <ElInputNumber v-model="form.swap_short_rate" :step="0.001" :precision="6" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="周三倍数">
                <ElInputNumber v-model="form.swap_wednesday_multiplier" :min="1" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="假日倍数">
                <ElInputNumber v-model="form.swap_holiday_multiplier" :min="1" style="width: 100%" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElTabPane>

        <ElTabPane label="交易限制" name="limit">
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="最大持仓手数">
                <ElInputNumber v-model="form.max_position" :min="0" :step="10" style="width: 100%" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="最大滑点">
                <ElInputNumber v-model="form.max_slippage" :min="0" :step="0.1" :precision="4" style="width: 100%" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElTabPane>
      </ElTabs>
    </ElForm>
    <template #footer>
      <ElButton @click="$emit('update:visible', false)">取消</ElButton>
      <ElButton v-if="form.price_source !== 'real' && type === 'edit'" type="warning"
        :loading="rebuildLoading" @click="handleRebuildKline">重建历史K线</ElButton>
      <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  fetchSimConfig,
  saveSimConfig,
  rebuildSimKline,
  updatePriceSource,
} from '@/api/admin-symbols'
import type { TradingSymbol, SimConfig, PriceSource, TrendDirection, VolatilityLevel } from '@/api/admin-symbols'
import type { DialogType } from '@/types'

const props = defineProps<{
  visible: boolean
  type: DialogType
  symbolData: Partial<TradingSymbol>
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: Partial<TradingSymbol>]
}>()

const formRef = ref<FormInstance>()
const submitLoading = ref(false)
const rebuildLoading = ref(false)
const activeTab = ref('basic')

const defaultForm = (): Partial<TradingSymbol> => ({
  symbol: '', name: '', category: 'precious_metal',
  price_source: 'real' as PriceSource,
  contract_unit: '', price_decimals: 2, sort_order: 0,
  min_lot: 0.01, max_lot: 100, lot_step: 0.01,
  min_leverage: 1, max_leverage: 100, is_hot: false,
  spread_mode: 'fixed', spread_fixed: 0, spread_min: 0, spread_max: 0,
  tick_size: 0.01, tick_value: 0.01,
  fee_mode: 'both_side', fee_type: 'per_lot', fee_value: 0,
  swap_long_rate: 0, swap_short_rate: 0,
  swap_wednesday_multiplier: 3, swap_holiday_multiplier: 1,
  max_position: 1000, max_slippage: 0, description: '',
})

const defaultSim = () => ({
  center_price: 100,
  lower_bound: 90,
  upper_bound: 110,
  trend_direction: 'sideways' as TrendDirection,
  trend_strength: 0.5,
  volatility_level: 'medium' as VolatilityLevel,
  volatility_sigma: null as number | null,
  mean_reversion_kappa: null as number | null,
  tick_interval_ms: 1000,
  max_tick_change_pct: 0.0015,
  hybrid_bias: 0,
})

const form = ref<Partial<TradingSymbol>>(defaultForm())
const sim = ref(defaultSim())

const maxTickChangePctPercent = computed({
  get: () => Number(((sim.value.max_tick_change_pct || 0) * 100).toFixed(4)),
  set: (v: number) => { sim.value.max_tick_change_pct = Number((v / 100).toFixed(6)) },
})

const stepByDecimals = computed(() => {
  const d = form.value.price_decimals || 2
  return Number((1 / Math.pow(10, Math.min(d, 6))).toFixed(8))
})

const SIGMA_MAP: Record<VolatilityLevel, number> = { low: 0.0003, medium: 0.0008, high: 0.0015, custom: 0 }

const previewText = computed(() => {
  const sigma = sim.value.volatility_level === 'custom'
    ? (sim.value.volatility_sigma || 0)
    : SIGMA_MAP[sim.value.volatility_level]
  const dt = Math.max(sim.value.tick_interval_ms / 1000, 0.2)
  const perTick = sim.value.center_price * sigma * Math.sqrt(dt)
  const perMinute = sim.value.center_price * sigma * Math.sqrt(60)
  const decimals = form.value.price_decimals || 2
  const signMap: Record<TrendDirection, string> = { up: '上涨', down: '下跌', sideways: '震荡' }
  const dir = signMap[sim.value.trend_direction]
  const ratePerMinute = sim.value.trend_direction === 'sideways'
    ? 0
    : sim.value.center_price * sim.value.trend_strength * 0.0001 * (60000 / sim.value.tick_interval_ms)
  return `预计每 tick 波动 ±${perTick.toFixed(decimals)}；每分钟 ~${dir}，漂移 ≈ ${ratePerMinute.toFixed(decimals)}；分钟级波动标准差 ≈ ${perMinute.toFixed(decimals)}`
})

const rules: FormRules = {
  symbol: [{ required: true, message: '请输入品种代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入品种名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择品种分类', trigger: 'change' }],
}

watch(() => props.visible, (val) => {
  if (val) {
    activeTab.value = 'basic'
    if (props.type === 'edit' && props.symbolData) {
      form.value = { ...defaultForm(), ...props.symbolData }
    } else {
      form.value = defaultForm()
    }
    sim.value = defaultSim()
  }
})

async function handleOpen() {
  if (props.type !== 'edit' || !props.symbolData?.id) return
  try {
    const res = await fetchSimConfig(props.symbolData.id as number)
    if (res?.config) {
      const c = res.config as SimConfig
      sim.value = {
        center_price: Number(c.center_price),
        lower_bound: Number(c.lower_bound),
        upper_bound: Number(c.upper_bound),
        trend_direction: c.trend_direction,
        trend_strength: Number(c.trend_strength),
        volatility_level: c.volatility_level,
        volatility_sigma: c.volatility_sigma != null ? Number(c.volatility_sigma) : null,
        mean_reversion_kappa: c.mean_reversion_kappa != null ? Number(c.mean_reversion_kappa) : null,
        tick_interval_ms: Number(c.tick_interval_ms),
        max_tick_change_pct: Number(c.max_tick_change_pct),
        hybrid_bias: Number(c.hybrid_bias),
      }
    } else if (form.value.price_source !== 'real') {
      // 自控但还没保存过配置, 用当前价建议默认值
      const center = 100
      sim.value = {
        ...defaultSim(),
        center_price: center,
        lower_bound: center * 0.9,
        upper_bound: center * 1.1,
      }
    }
  } catch (e) {
    // ignore load errors, show defaults
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()

  if (form.value.price_source !== 'real') {
    if (sim.value.lower_bound >= sim.value.upper_bound) {
      ElMessage.error('区间下限必须小于上限')
      return
    }
    if (sim.value.center_price < sim.value.lower_bound || sim.value.center_price > sim.value.upper_bound) {
      ElMessage.error('中枢价必须在上下限之间')
      return
    }
    const rangePct = (sim.value.upper_bound - sim.value.lower_bound) / sim.value.center_price
    if (rangePct < 0.005) {
      ElMessage.error('区间过窄, 至少需要中枢价的 0.5%')
      return
    }
  }

  submitLoading.value = true
  try {
    emit('submit', { ...form.value })

    // 对编辑场景, 额外把模拟配置保存到独立接口
    if (props.type === 'edit' && props.symbolData?.id && form.value.price_source !== 'real') {
      try {
        await saveSimConfig(props.symbolData.id as number, { ...sim.value, enabled: 1 })
        await updatePriceSource(props.symbolData.id as number, form.value.price_source as PriceSource)
      } catch (e) {
        // errors surfaced by http interceptor
      }
    }
  } finally {
    submitLoading.value = false
  }
}

async function handleRebuildKline() {
  if (!props.symbolData?.id) return
  try {
    await ElMessageBox.confirm(
      '重建历史K线会先清空该品种所有历史K线数据, 然后按当前配置重新生成, 确定继续?',
      '重建历史K线',
      { type: 'warning', confirmButtonText: '确定重建', cancelButtonText: '取消' }
    )
    rebuildLoading.value = true
    // 先保存配置再重建
    await saveSimConfig(props.symbolData.id as number, { ...sim.value, enabled: 1 })
    const res = await rebuildSimKline(props.symbolData.id as number)
    ElMessage.success(`已重建 ${res?.inserted || 0} 条K线`)
  } catch (e: any) {
    if (e !== 'cancel') {
      // network errors handled by http interceptor
    }
  } finally {
    rebuildLoading.value = false
  }
}
</script>

<style scoped>
.sim-block {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 4px;
}
</style>
