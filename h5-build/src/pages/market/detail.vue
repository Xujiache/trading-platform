<template>
	<scroll-view class="detail-page" direction="vertical">
		<CustomNavBar title="品种详情" />
		<view class="price-section">
			<view class="price-main">
				<text class="current-price" :class="symbolData.change >= 0 ? 'price-up' : 'price-down'">
					{{formatPrice(symbolData.bid, symbolData.price_decimals)}}
				</text>
				<text class="price-change" :class="symbolData.change >= 0 ? 'price-up' : 'price-down'">
					{{symbolData.change >= 0 ? '+' : ''}}{{symbolData.change.toFixed(symbolData.price_decimals)}}
					({{symbolData.change >= 0 ? '+' : ''}}{{symbolData.change_percent.toFixed(2)}}%)
				</text>
			</view>
			<view class="bid-ask-row">
				<view class="bid-box">
					<text class="ba-label">买入价</text>
					<text class="ba-value price-down">{{formatPrice(symbolData.bid, symbolData.price_decimals)}}</text>
				</view>
				<view class="ask-box">
					<text class="ba-label">卖出价</text>
					<text class="ba-value price-up">{{formatPrice(symbolData.ask, symbolData.price_decimals)}}</text>
				</view>
			</view>
		</view>

		<view class="info-grid">
			<view class="info-item">
				<text class="info-label">最高</text>
				<text class="info-value">{{formatPrice(symbolData.high, symbolData.price_decimals)}}</text>
			</view>
			<view class="info-item">
				<text class="info-label">最低</text>
				<text class="info-value">{{formatPrice(symbolData.low, symbolData.price_decimals)}}</text>
			</view>
			<view class="info-item">
				<text class="info-label">开盘</text>
				<text class="info-value">{{formatPrice(symbolData.open, symbolData.price_decimals)}}</text>
			</view>
			<view class="info-item">
				<text class="info-label">昨收</text>
				<text class="info-value">{{formatPrice(symbolData.prev_close, symbolData.price_decimals)}}</text>
			</view>
		</view>

		<view class="kline-section">
			<view class="section-header">
				<text class="section-title">K线图</text>
				<text class="section-link" @click="goKlineFullscreen">全屏查看</text>
			</view>
			<scroll-view class="period-scroll" direction="horizontal" :show-scrollbar="false">
				<view class="period-list">
					<view v-for="(p, idx) in periods" :key="idx" class="period-item"
						:class="{'period-active': activePeriod == idx}" @click="switchPeriod(idx)">
						<text class="period-text" :class="{'period-text-active': activePeriod == idx}">{{p.label}}</text>
					</view>
				</view>
			</scroll-view>
			<canvas class="detail-kline-canvas" canvas-id="detailKlineCanvas" id="detailKlineCanvas"
				style="width: 100%; height: 200px;"></canvas>
		</view>

		<view class="contract-section">
			<text class="section-title-inner">合约规格</text>
			<view class="spec-row">
				<text class="spec-label">合约单位</text>
				<text class="spec-value">{{symbolData.contract_unit}}</text>
			</view>
			<view class="spec-row">
				<text class="spec-label">最小手数</text>
				<text class="spec-value">{{symbolData.min_lot}}</text>
			</view>
			<view class="spec-row">
				<text class="spec-label">最大手数</text>
				<text class="spec-value">{{symbolData.max_lot}}</text>
			</view>
			<view class="spec-row">
				<text class="spec-label">最大杠杆</text>
				<text class="spec-value">1:{{symbolData.max_leverage}}</text>
			</view>
		<view class="spec-row" v-if="false">
			<text class="spec-label">点差模式</text>
			<text class="spec-value">{{symbolData.spread_mode == 'fixed' ? '固定' : '浮动'}}</text>
		</view>
		<view class="spec-row" v-if="false">
			<text class="spec-label">手续费</text>
			<text class="spec-value">{{symbolData.fee_value}}/手</text>
		</view>
		</view>

		<view class="trading-hours-section" v-if="tradingHoursText.length > 0">
			<text class="section-title-inner">交易时间</text>
			<view v-for="(item, idx) in tradingHoursText" :key="idx" class="spec-row">
				<text class="spec-label">{{item.key}}</text>
				<text class="spec-value">{{item.value}}</text>
			</view>
		</view>

		<view style="height: 80px; flex-shrink: 0;"></view>
		<view class="action-bar">
			<view class="action-btn btn-sell" @click="onTrade('sell')">
				<text class="btn-text-white">卖出做空</text>
			</view>
			<view class="action-btn btn-buy" @click="onTrade('buy')">
				<text class="btn-text-white">买入做多</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'
	import { connectWebSocket, subscribeSymbols, disconnectWebSocket } from '@/utils/websocket.uts'

	type TradingHourItem = {
		key : string
		value : string
	}

	type SymbolDetail = {
		id : number
		symbol : string
		name : string
		category : string
		price_decimals : number
		bid : number
		ask : number
		high : number
		low : number
		open : number
		prev_close : number
		change : number
		change_percent : number
		volume : number
		contract_unit : string
		min_lot : number
		max_lot : number
		max_leverage : number
		spread_mode : string
		fee_value : number
	}

	type KlineItem = {
		time : string
		open : number
		high : number
		low : number
		close : number
		volume : number
	}

	const periods = [
		{ key: '1m', label: '1分' },
		{ key: '5m', label: '5分' },
		{ key: '15m', label: '15分' },
		{ key: '30m', label: '30分' },
		{ key: '1h', label: '1时' },
		{ key: '4h', label: '4时' },
		{ key: '1d', label: '日线' },
		{ key: '1w', label: '周线' },
		{ key: '1M', label: '月线' },
	]

	const symbolId = ref(0)
	const symbolCode = ref('')
	const activePeriod = ref(0)
	const klineData = ref<KlineItem[]>([])
	const klineCache = new Map<string, KlineItem[]>()

	const symbolData = ref<SymbolDetail>({
		id: 0, symbol: '', name: '', category: '', price_decimals: 2,
		bid: 0, ask: 0, high: 0, low: 0, open: 0, prev_close: 0,
		change: 0, change_percent: 0, volume: 0,
		contract_unit: '', min_lot: 0.01, max_lot: 100, max_leverage: 100,
		spread_mode: 'fixed', fee_value: 0,
	} as SymbolDetail)

	const tradingHoursText = ref<TradingHourItem[]>([])
	let refreshTimer = 0

	onLoad((options : OnLoadOptions) => {
		const idStr = options['id'] ?? '0'
		const sym = options['symbol'] ?? ''
		symbolId.value = parseInt(idStr)
		symbolCode.value = sym

		uni.setNavigationBarTitle({ title: sym })
		loadDetail()
		loadKline()

		connectWebSocket((tickData : any) => {
			if (tickData == null) return
			const obj = tickData as any
			const tickSym = obj['symbol'] as string
			if (tickSym == symbolCode.value) {
				const sd = symbolData.value
				sd.bid = obj['bid'] as number
				sd.ask = obj['ask'] as number
				sd.high = obj['high'] as number
				sd.low = obj['low'] as number
				sd.change = obj['change'] as number
				sd.change_percent = obj['change_percent'] as number
				sd.volume = obj['volume'] as number
				symbolData.value = sd
			}
		})

		setTimeout(() => {
			subscribeSymbols([sym])
		}, 500)
	})

	onUnload(() => {
		if (refreshTimer > 0) clearInterval(refreshTimer)
		disconnectWebSocket()
	})

	function loadDetail() {
		get(`/api/mobile/market/symbols/${symbolId.value}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const raw = JSON.stringify(res.data)
				const d = JSON.parse<SymbolDetail>(raw)
				if (d != null) {
					symbolData.value = d!
				}
				const obj = JSON.parse(raw)
				if (obj != null) {
					const th = obj!['trading_hours']
					if (th != null) {
						const thObj = th as any
						const items : TradingHourItem[] = []
						const keys = Object.keys(thObj)
						for (let i = 0; i < keys.length; i++) {
							const k = keys[i]
							const label = k == 'mon_fri' ? '周一至周五' : k == 'break' ? '休市时间' : k
							items.push({ key: label, value: thObj[k] as string } as TradingHourItem)
						}
						tradingHoursText.value = items
					}
				}
			}
		}).catch((_e : any) => { })
	}

	function loadKline() {
		const period = periods[activePeriod.value].key
		const cacheKey = `${symbolCode.value}_${period}`
		const cached = klineCache.get(cacheKey)
		if (cached != null && cached!.length > 0) {
			klineData.value = cached!
			setTimeout(() => { drawDetailKline() }, 50)
		}
		get(`/api/mobile/market/kline?symbol=${symbolCode.value}&period=${period}&limit=200`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const klinesRaw = d['klines'] as any[] | null
				if (klinesRaw != null && klinesRaw!.length > 0) {
					const items : KlineItem[] = []
					for (let i = 0; i < klinesRaw!.length; i++) {
						const k = klinesRaw![i] as any
						items.push({ time: (k['time'] as string) ?? '', open: (k['open'] as number) ?? 0, high: (k['high'] as number) ?? 0, low: (k['low'] as number) ?? 0, close: (k['close'] as number) ?? 0, volume: (k['volume'] as number) ?? 0 } as KlineItem)
					}
					klineData.value = items
					klineCache.set(cacheKey, items)
					setTimeout(() => { drawDetailKline() }, 50)
				}
			}
		}).catch((_e : any) => { })
	}

	function switchPeriod(idx : number) {
		activePeriod.value = idx
		loadKline()
	}

	function formatPrice(price : number, decimals : number) : string {
		return price.toFixed(decimals)
	}

	function isDarkMode() : boolean {
		const theme = uni.getStorageSync('themeMode') as string
		if (theme === 'dark') return true
		if (theme === 'light') return false
		try { return uni.getSystemInfoSync().theme === 'dark' } catch(e) { return false }
	}

	function drawDetailKline() {
		const data = klineData.value
		if (data.length == 0) return
		const ctx = uni.createCanvasContext('detailKlineCanvas')
		const cw = 350
		const ch = 180
		const pad = 35
		const chartW = cw - pad * 2
		const chartH = ch - pad - 10
		const dark = isDarkMode()
		const bgColor = dark ? '#151A2D' : '#fafafa'
		const gridColor = dark ? '#1E293B' : '#e0e0e0'
		const labelColor = dark ? '#64748B' : '#999999'

		ctx.setFillStyle(bgColor)
		ctx.fillRect(0, 0, cw, ch)

		const count = Math.min(data.length, 40)
		const display = data.slice(data.length - count)
		let minP = display[0].low
		let maxP = display[0].high
		for (let i = 1; i < display.length; i++) {
			if (display[i].low < minP) minP = display[i].low
			if (display[i].high > maxP) maxP = display[i].high
		}
		const range = maxP - minP
		if (range == 0) return
		const margin = range * 0.05
		minP -= margin
		maxP += margin
		const total = maxP - minP

		ctx.setStrokeStyle(gridColor)
		ctx.setLineWidth(0.5)
		for (let i = 0; i <= 3; i++) {
			const y = 10 + (chartH / 3) * i
			ctx.beginPath()
			ctx.moveTo(pad, y)
			ctx.lineTo(pad + chartW, y)
			ctx.stroke()
			ctx.setFillStyle(labelColor)
			ctx.setFontSize(8)
			const price = maxP - (total / 3) * i
			ctx.fillText(price.toFixed(2), 1, y + 3)
		}

		const barW = chartW / count
		const bodyW = barW * 0.6
		for (let i = 0; i < display.length; i++) {
			const k = display[i]
			const x = pad + barW * i + barW / 2
			const isUp = k.close >= k.open
			const color = isUp ? '#4caf50' : '#f44336'
			const openY = 10 + ((maxP - k.open) / total) * chartH
			const closeY = 10 + ((maxP - k.close) / total) * chartH
			const highY = 10 + ((maxP - k.high) / total) * chartH
			const lowY = 10 + ((maxP - k.low) / total) * chartH

			ctx.setStrokeStyle(color)
			ctx.setLineWidth(1)
			ctx.beginPath()
			ctx.moveTo(x, highY)
			ctx.lineTo(x, lowY)
			ctx.stroke()

			ctx.setFillStyle(color)
			const top = Math.min(openY, closeY)
			const h = Math.max(Math.abs(closeY - openY), 1)
			ctx.fillRect(x - bodyW / 2, top, bodyW, h)
		}
		ctx.draw()
	}

	function goKlineFullscreen() {
		uni.navigateTo({
			url: `/pages/market/kline?symbol=${symbolCode.value}&period=${periods[activePeriod.value].key}`
		})
	}

	function onTrade(direction : string) {
		uni.navigateTo({ url: `/pages/trade/place-order?symbol=${symbolCode.value}&direction=${direction}` })
	}
</script>

<style>
	.detail-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.price-section {
		background-image: var(--gradient-dark);
		padding: var(--spacing-2xl) var(--spacing-lg) var(--spacing-xl);
	}

	.price-main {
		align-items: flex-start;
		margin-bottom: var(--spacing-lg);
	}

	.current-price {
		font-size: var(--font-5xl);
		font-weight: 800;
		letter-spacing: -0.5px;
		font-variant-numeric: tabular-nums;
	}

	.price-change {
		font-size: var(--font-sm);
		margin-top: var(--spacing-xs);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.price-up {
		color: var(--color-success);
	}

	.price-down {
		color: var(--color-danger);
	}

	.bid-ask-row {
		flex-direction: row;
	}

	.bid-box,
	.ask-box {
		flex: 1;
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		background-color: rgba(255, 255, 255, 0.08);
		margin: 0 var(--spacing-xs);
	}

	.ba-label {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: var(--spacing-xs);
		font-weight: 500;
	}

	.ba-value {
		font-size: var(--font-xl);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.info-grid {
		flex-direction: row;
		flex-wrap: wrap;
		background-color: var(--color-bg-card);
		padding: var(--spacing-md) var(--spacing-lg);
		margin-top: var(--spacing-md);
		border-radius: var(--radius-lg);
		margin-left: var(--spacing-md);
		margin-right: var(--spacing-md);
		box-shadow: var(--shadow-card);
	}

	.info-item {
		width: 50%;
		flex-direction: row;
		justify-content: space-between;
		padding: 0 var(--spacing-sm);
	}

	.info-label {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.info-value {
		font-size: var(--font-xs);
		color: var(--color-text-primary);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.kline-section {
		background-color: var(--color-bg-card);
		margin-top: var(--spacing-md);
		padding: var(--spacing-lg);
		margin-left: var(--spacing-md);
		margin-right: var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.section-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.section-title {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.section-link {
		font-size: var(--font-xs);
		color: var(--color-primary);
		font-weight: 600;
	}

	.period-scroll {
		height: 36px;
		margin-bottom: var(--spacing-md);
	}

	.period-list {
		flex-direction: row;
		height: 36px;
		align-items: center;
	}

	.period-item {
		padding: var(--spacing-xs) var(--spacing-md);
		margin-right: var(--spacing-sm);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		transition-property: background-color;
		transition-duration: var(--transition-fast);
	}

	.period-active {
		background-color: var(--color-primary);
	}

	.period-text {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.period-text-active {
		color: var(--color-text-inverse);
		font-weight: 700;
	}

	.detail-kline-canvas {
		height: 200px;
		background-color: var(--color-bg-section);
		border-radius: var(--radius-md);
	}

	.contract-section {
		background-color: var(--color-bg-card);
		margin-top: var(--spacing-md);
		padding: var(--spacing-lg);
		margin-left: var(--spacing-md);
		margin-right: var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.section-title-inner {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.spec-row {
		flex-direction: row;
		justify-content: space-between;
		padding: var(--spacing-md) 0;
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
	}

	.spec-label {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.spec-value {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.trading-hours-section {
		background-color: var(--color-bg-card);
		margin-top: var(--spacing-md);
		padding: var(--spacing-lg);
		margin-left: var(--spacing-md);
		margin-right: var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		margin-bottom: var(--spacing-md);
	}

	.action-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 99;
		display: flex;
		flex-direction: row;
		padding: 12px 16px;
		padding-bottom: calc(12px + env(safe-area-inset-bottom));
		background-color: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
	}

	.action-btn {
		flex: 1;
		height: 48px;
		border-radius: var(--radius-md);
		justify-content: center;
		align-items: center;
		margin: 0 var(--spacing-xs);
	}

	.btn-sell {
		background-image: var(--gradient-danger);
	}

	.btn-buy {
		background-image: var(--gradient-success);
	}

	.btn-text-white {
		color: var(--color-text-inverse);
		font-size: var(--font-md);
		font-weight: 700;
		letter-spacing: 0.5px;
	}
</style>
