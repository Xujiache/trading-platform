<template>
	<view class="kline-page">
		<CustomNavBar title="K线图" />
		<view class="kline-header">
			<view class="header-left">
				<text class="header-symbol">{{symbolCode}}</text>
				<text class="header-price" :class="currentTick.change >= 0 ? 'price-up' : 'price-down'">
					{{currentTick.bid.toFixed(2)}}
				</text>
				<text class="header-change" :class="currentTick.change >= 0 ? 'price-up' : 'price-down'">
					{{currentTick.change >= 0 ? '+' : ''}}{{currentTick.change_percent.toFixed(2)}}%
				</text>
			</view>
			<view class="ohlcv-row">
				<view class="ohlcv-item">
					<text class="ohlcv-label">开</text>
					<text class="ohlcv-value">{{currentTick.open.toFixed(2)}}</text>
				</view>
				<view class="ohlcv-item">
					<text class="ohlcv-label">高</text>
					<text class="ohlcv-value price-up">{{currentTick.high.toFixed(2)}}</text>
				</view>
				<view class="ohlcv-item">
					<text class="ohlcv-label">低</text>
					<text class="ohlcv-value price-down">{{currentTick.low.toFixed(2)}}</text>
				</view>
				<view class="ohlcv-item">
					<text class="ohlcv-label">量</text>
					<text class="ohlcv-value">{{currentTick.volume}}</text>
				</view>
			</view>
		</view>

		<scroll-view class="period-bar" direction="horizontal" :show-scrollbar="false">
			<view class="period-list">
				<view v-for="(p, idx) in periods" :key="idx" class="period-chip"
					:class="{'period-chip-active': activePeriod == idx}" @click="switchPeriod(idx)">
					<text class="period-chip-text" :class="{'period-chip-text-active': activePeriod == idx}">{{p.label}}</text>
				</view>
			</view>
		</scroll-view>

		<view class="chart-area">
			<canvas class="kline-canvas" canvas-id="klineCanvas" id="klineCanvas"
				style="width: 100%; height: 300px;"></canvas>
			<view v-if="klines.length > 0" class="mini-kline-list">
				<view class="kline-table-header">
					<text class="kline-col">时间</text>
					<text class="kline-col">开盘</text>
					<text class="kline-col">最高</text>
					<text class="kline-col">最低</text>
					<text class="kline-col">收盘</text>
				</view>
				<scroll-view class="kline-table-body" direction="vertical">
					<view v-for="(k, idx) in recentKlines" :key="idx" class="kline-table-row">
						<text class="kline-col kline-col-time">{{formatTime(k.time)}}</text>
						<text class="kline-col">{{k.open.toFixed(2)}}</text>
						<text class="kline-col price-up">{{k.high.toFixed(2)}}</text>
						<text class="kline-col price-down">{{k.low.toFixed(2)}}</text>
						<text class="kline-col" :class="k.close >= k.open ? 'price-up' : 'price-down'">{{k.close.toFixed(2)}}</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, computed } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'
	import { connectWebSocket, subscribeSymbols, disconnectWebSocket } from '@/utils/websocket.uts'

	type KlineItem = {
		time : string
		open : number
		high : number
		low : number
		close : number
		volume : number
	}

	type TickData = {
		bid : number
		ask : number
		high : number
		low : number
		open : number
		change : number
		change_percent : number
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

	const symbolCode = ref('')
	const activePeriod = ref(0)
	const klines = ref<KlineItem[]>([])
	const klineCache = new Map<string, KlineItem[]>()
	const currentTick = ref<TickData>({
		bid: 0, ask: 0, high: 0, low: 0, open: 0,
		change: 0, change_percent: 0, volume: 0
	} as TickData)

	const recentKlines = computed((): KlineItem[] => {
		const arr = klines.value
		if (arr.length <= 20) return arr
		return arr.slice(arr.length - 20)
	})

	onLoad((options : OnLoadOptions) => {
		symbolCode.value = options['symbol'] ?? ''
		const periodKey = options['period'] ?? '1m'

		for (let i = 0; i < periods.length; i++) {
			if (periods[i].key == periodKey) {
				activePeriod.value = i
				break
			}
		}

		uni.setNavigationBarTitle({ title: `${symbolCode.value} K线` })
		loadKline()

		connectWebSocket((tickData : any) => {
			if (tickData == null) return
			const obj = tickData as any
			const tickSym = obj['symbol'] as string
			if (tickSym == symbolCode.value) {
				const newBid = obj['bid'] as number
				currentTick.value = {
					bid: newBid,
					ask: obj['ask'] as number,
					high: obj['high'] as number,
					low: obj['low'] as number,
					open: obj['open'] as number,
					change: obj['change'] as number,
					change_percent: obj['change_percent'] as number,
					volume: obj['volume'] as number,
				} as TickData

				updateLastKline(newBid)
			}
		})

		setTimeout(() => {
			subscribeSymbols([symbolCode.value])
		}, 500)
	})

	onUnload(() => {
		disconnectWebSocket()
	})

	function loadKline() {
		const period = periods[activePeriod.value].key
		const cacheKey = `${symbolCode.value}_${period}`
		const cached = klineCache.get(cacheKey)
		if (cached != null && cached!.length > 0) {
			klines.value = cached!
			setTimeout(() => { drawKlineChart() }, 50)
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
					klines.value = items
					klineCache.set(cacheKey, items)
					setTimeout(() => { drawKlineChart() }, 50)
				}
			}
		}).catch((_e : any) => { })
	}

	let redrawTimer = 0

	function updateLastKline(price : number) {
		const arr = klines.value
		if (arr.length == 0) return

		const last = arr[arr.length - 1]
		last.close = price
		if (price > last.high) last.high = price
		if (price < last.low) last.low = price
		arr[arr.length - 1] = last
		klines.value = arr

		if (redrawTimer > 0) return
		redrawTimer = setTimeout(() => {
			redrawTimer = 0
			drawKlineChart()
		}, 500) as number
	}

	function switchPeriod(idx : number) {
		activePeriod.value = idx
		loadKline()
	}

	function formatTime(time : string) : string {
		if (time.length > 16) return time.substring(5, 16)
		return time
	}

	function drawKlineChart() {
		const data = klines.value
		if (data.length == 0) return

		const ctx = uni.createCanvasContext('klineCanvas')
		const canvasWidth = 350
		const canvasHeight = 280
		const padding = 40
		const chartW = canvasWidth - padding * 2
		const chartH = canvasHeight - padding * 2

		ctx.setFillStyle('#1a1a2e')
		ctx.fillRect(0, 0, canvasWidth, canvasHeight)

		const displayCount = Math.min(data.length, 60)
		const displayData = data.slice(data.length - displayCount)

		let minPrice = displayData[0].low
		let maxPrice = displayData[0].high
		for (let i = 1; i < displayData.length; i++) {
			if (displayData[i].low < minPrice) minPrice = displayData[i].low
			if (displayData[i].high > maxPrice) maxPrice = displayData[i].high
		}
		const priceRange = maxPrice - minPrice
		if (priceRange == 0) return
		const margin = priceRange * 0.05
		minPrice = minPrice - margin
		maxPrice = maxPrice + margin
		const totalRange = maxPrice - minPrice

		ctx.setStrokeStyle('#2a2a4a')
		ctx.setLineWidth(0.5)
		for (let i = 0; i <= 4; i++) {
			const y = padding + (chartH / 4) * i
			ctx.beginPath()
			ctx.moveTo(padding, y)
			ctx.lineTo(padding + chartW, y)
			ctx.stroke()
			const price = maxPrice - (totalRange / 4) * i
			ctx.setFillStyle('#888888')
			ctx.setFontSize(9)
			ctx.fillText(price.toFixed(2), 2, y + 3)
		}

		const barW = chartW / displayCount
		const bodyW = barW * 0.7

		for (let i = 0; i < displayData.length; i++) {
			const k = displayData[i]
			const x = padding + barW * i + barW / 2
			const isUp = k.close >= k.open

			const openY = padding + ((maxPrice - k.open) / totalRange) * chartH
			const closeY = padding + ((maxPrice - k.close) / totalRange) * chartH
			const highY = padding + ((maxPrice - k.high) / totalRange) * chartH
			const lowY = padding + ((maxPrice - k.low) / totalRange) * chartH

			const color = isUp ? '#4caf50' : '#f44336'
			ctx.setStrokeStyle(color)
			ctx.setLineWidth(1)
			ctx.beginPath()
			ctx.moveTo(x, highY)
			ctx.lineTo(x, lowY)
			ctx.stroke()

			ctx.setFillStyle(color)
			const bodyTop = Math.min(openY, closeY)
			const bodyHeight = Math.max(Math.abs(closeY - openY), 1)
			ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyHeight)
		}

		ctx.draw()
	}
</script>

<style>
	.kline-page {
		flex: 1;
		background-color: #0B1120;
	}

	.kline-header {
		padding: var(--spacing-lg);
		background-color: #111827;
		border-bottom-width: 1px;
		border-bottom-color: rgba(255, 255, 255, 0.06);
		border-bottom-style: solid;
	}

	.header-left {
		flex-direction: row;
		align-items: baseline;
		margin-bottom: var(--spacing-md);
	}

	.header-symbol {
		font-size: var(--font-xl);
		font-weight: 700;
		color: #F1F5F9;
		margin-right: var(--spacing-md);
		letter-spacing: 0.3px;
	}

	.header-price {
		font-size: var(--font-3xl);
		font-weight: 800;
		margin-right: var(--spacing-sm);
		font-variant-numeric: tabular-nums;
	}

	.header-change {
		font-size: var(--font-sm);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.price-up {
		color: #34D399;
	}

	.price-down {
		color: #F87171;
	}

	.ohlcv-row {
		flex-direction: row;
		background-color: rgba(255, 255, 255, 0.03);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm) var(--spacing-xs);
	}

	.ohlcv-item {
		flex: 1;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.ohlcv-label {
		font-size: var(--font-xs);
		color: #64748B;
		margin-right: var(--spacing-xs);
		font-weight: 500;
	}

	.ohlcv-value {
		font-size: var(--font-xs);
		color: #CBD5E1;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.period-bar {
		height: 44px;
		background-color: #111827;
		border-bottom-width: 1px;
		border-bottom-color: rgba(255, 255, 255, 0.06);
		border-bottom-style: solid;
	}

	.period-list {
		flex-direction: row;
		align-items: center;
		padding: 0 var(--spacing-sm);
		height: 44px;
	}

	.period-chip {
		padding: var(--spacing-xs) var(--spacing-md);
		margin: 0 3px;
		border-radius: var(--radius-pill);
		background-color: transparent;
		transition-property: background-color;
		transition-duration: var(--transition-fast);
	}

	.period-chip-active {
		background-color: var(--color-primary);
	}

	.period-chip-text {
		font-size: var(--font-xs);
		color: #64748B;
		font-weight: 500;
	}

	.period-chip-text-active {
		color: #FFFFFF;
		font-weight: 700;
	}

	.chart-area {
		flex: 1;
		padding: var(--spacing-md);
	}

	.chart-content {
		flex: 1;
		align-items: center;
		justify-content: flex-start;
		padding-top: var(--spacing-lg);
	}

	.chart-title {
		font-size: var(--font-md);
		color: #CBD5E1;
		margin-bottom: var(--spacing-sm);
		font-weight: 600;
	}

	.chart-info {
		font-size: var(--font-xs);
		color: #475569;
		margin-bottom: var(--spacing-lg);
	}

	.mini-kline-list {
		width: 100%;
		background-color: #111827;
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	.kline-table-header {
		flex-direction: row;
		padding: var(--spacing-sm) 0;
		border-bottom-width: 1px;
		border-bottom-color: rgba(255, 255, 255, 0.08);
		border-bottom-style: solid;
	}

	.kline-table-body {
		max-height: 400px;
	}

	.kline-table-row {
		flex-direction: row;
		padding: var(--spacing-sm) 0;
		border-bottom-width: 1px;
		border-bottom-color: rgba(255, 255, 255, 0.04);
		border-bottom-style: solid;
	}

	.kline-col {
		flex: 1;
		font-size: var(--font-xs);
		color: #CBD5E1;
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}

	.kline-col-time {
		color: #64748B;
	}

	.kline-canvas {
		border-radius: var(--radius-md);
	}
</style>
