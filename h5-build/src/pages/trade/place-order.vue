<template>
	<view class="place-order-page">
		<CustomNavBar title="下单" />
		<scroll-view class="form-scroll" direction="vertical">
			<view class="section">
				<text class="section-title">选择品种</text>
				<view class="symbol-selector" @click="showSymbolPicker = true">
					<text class="symbol-selected" v-if="selectedSymbol != null">
						{{(selectedSymbol!['symbol'] as string)}} - {{(selectedSymbol!['name'] as string)}}
					</text>
					<text class="symbol-placeholder" v-else>请选择交易品种</text>
					<text class="arrow-right">›</text>
				</view>
				<view v-if="selectedSymbol != null" class="price-display">
					<view class="price-col">
						<text class="price-label">买入价(Ask)</text>
						<text class="price-val text-green">{{currentAsk}}</text>
					</view>
					<view class="price-col">
						<text class="price-label">卖出价(Bid)</text>
						<text class="price-val text-red">{{currentBid}}</text>
					</view>
				</view>
			</view>

			<view class="section">
				<text class="section-title">订单类型</text>
				<view class="order-type-row">
					<view class="type-btn" :class="{'type-btn-active': orderType == 'market'}"
						@click="orderType = 'market'">
						<text class="type-btn-text" :class="{'type-btn-text-active': orderType == 'market'}">市价单</text>
					</view>
					<view class="type-btn" :class="{'type-btn-active': orderType == 'pending'}"
						@click="orderType = 'pending'">
						<text class="type-btn-text" :class="{'type-btn-text-active': orderType == 'pending'}">挂单</text>
					</view>
				</view>
			</view>

			<view class="section" v-if="orderType == 'pending'">
				<text class="section-title">挂单类型</text>
				<view class="pending-types">
					<view v-for="(pt, idx) in pendingTypes" :key="idx" class="pending-type-item"
						:class="{'pending-type-active': pendingType == pt.key}" @click="pendingType = pt.key">
						<text class="pending-type-text"
							:class="{'pending-type-text-active': pendingType == pt.key}">{{pt.label}}</text>
					</view>
				</view>
				<view class="form-row">
					<text class="form-label">目标价格</text>
					<input class="form-input" type="digit" placeholder="输入目标价" :value="targetPrice"
						@input="(e : InputEvent) => { targetPrice = e.detail.value }" />
				</view>
			</view>

			<view class="section">
				<text class="section-title">交易方向</text>
				<view class="direction-row">
					<view class="dir-btn dir-btn-buy" :class="{'dir-btn-buy-active': direction == 'buy'}"
						@click="setDirection('buy')">
						<text class="dir-btn-text" :class="{'dir-btn-text-active': direction == 'buy'}">买入(做多)</text>
					</view>
					<view class="dir-btn dir-btn-sell" :class="{'dir-btn-sell-active': direction == 'sell'}"
						@click="setDirection('sell')">
						<text class="dir-btn-text" :class="{'dir-btn-text-active': direction == 'sell'}">卖出(做空)</text>
					</view>
				</view>
			</view>

			<view class="section">
				<text class="section-title">手数</text>
				<view class="lots-quick">
					<view v-for="(l, idx) in lotsOptions" :key="idx" class="lots-item"
						:class="{'lots-item-active': lots == l}" @click="setLots(l)">
						<text class="lots-text" :class="{'lots-text-active': lots == l}">{{l}}</text>
					</view>
				</view>
				<view class="form-row">
					<text class="form-label">自定义手数</text>
					<input class="form-input" type="digit" :placeholder="`${minLot} ~ ${maxLot}`" :value="lots + ''"
						@input="(e : InputEvent) => { lots = parseFloat(e.detail.value); estimateFees() }" />
				</view>
			</view>

			<view class="section">
				<text class="section-title">杠杆</text>
				<view class="lots-quick">
					<view v-for="(lv, idx) in leverageOptions" :key="idx" class="lots-item"
						:class="{'lots-item-active': leverage == lv}" @click="setLeverage(lv)">
						<text class="lots-text" :class="{'lots-text-active': leverage == lv}">{{lv}}x</text>
					</view>
				</view>
			</view>

			<view class="section">
				<text class="section-title">止损止盈（选填）</text>
				<view class="form-row">
					<text class="form-label">止损价</text>
					<input class="form-input" type="digit" placeholder="选填" :value="stopLoss"
						@input="(e : InputEvent) => { stopLoss = e.detail.value }" />
				</view>
				<view class="form-row">
					<text class="form-label">止盈价</text>
					<input class="form-input" type="digit" placeholder="选填" :value="takeProfit"
						@input="(e : InputEvent) => { takeProfit = e.detail.value }" />
				</view>
				<view class="form-row">
					<text class="form-label">移动止损(点)</text>
					<input class="form-input" type="digit" placeholder="选填，设置后止损跟随价格移动" :value="trailingStop"
						@input="(e : InputEvent) => { trailingStop = e.detail.value }" />
				</view>
			</view>

			<view class="section" v-if="false">
				<text class="section-title">费用预估</text>
				<view class="fee-row">
					<text class="fee-label">保证金</text>
					<text class="fee-value">${{(feeEstimate!['margin'] as number).toFixed(2)}}</text>
				</view>
				<view class="fee-row">
					<text class="fee-label">手续费</text>
					<text class="fee-value">${{(feeEstimate!['commission'] as number).toFixed(2)}}</text>
				</view>
				<view class="fee-row">
					<text class="fee-label">点差成本</text>
					<text class="fee-value">${{(feeEstimate!['spreadCost'] as number).toFixed(2)}}</text>
				</view>
				<view class="fee-row">
					<text class="fee-label">每日隔夜费</text>
					<text class="fee-value">${{(feeEstimate!['swapPerDay'] as number).toFixed(2)}}</text>
				</view>
				<view class="fee-row fee-row-total">
					<text class="fee-label-bold">开仓总成本</text>
					<text class="fee-value-bold">${{(feeEstimate!['totalOpenCost'] as number).toFixed(2)}}</text>
				</view>
			</view>

			<view style="height: 80px; flex-shrink: 0;"></view>
			<view class="submit-area">
				<view class="submit-btn" :class="direction == 'buy' ? 'submit-btn-buy' : 'submit-btn-sell'"
					@click="submitOrder">
					<text class="submit-btn-text">
						{{orderType == 'market' ? (direction == 'buy' ? '买入下单' : '卖出下单') : '创建挂单'}}
					</text>
				</view>
			</view>
		</scroll-view>

		<view class="symbol-picker-mask" v-if="showSymbolPicker" @click="showSymbolPicker = false">
			<view class="symbol-picker" @click.stop="">
				<view class="picker-header">
					<text class="picker-title">选择交易品种</text>
					<text class="picker-close" @click="showSymbolPicker = false">✕</text>
				</view>
				<scroll-view class="picker-list" direction="vertical">
					<view v-for="(s, idx) in symbolList" :key="idx" class="picker-item" @click="selectSymbol(s)">
						<text class="picker-symbol">{{s['symbol'] as string}}</text>
						<text class="picker-name">{{s['name'] as string}}</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { get, post } from '@/utils/request.uts'

	const savedAccType = uni.getStorageSync('preferredAccountType') as string
	const accountType = ref(savedAccType.length > 0 ? savedAccType : 'demo')
	const orderType = ref('market')
	const direction = ref('buy')
	const lots = ref(0.01)
	const leverage = ref(100)
	const stopLoss = ref('')
	const takeProfit = ref('')
	const trailingStop = ref('')
	const targetPrice = ref('')
	const pendingType = ref('buy_limit')
	const showSymbolPicker = ref(false)
	const selectedSymbol = ref<any | null>(null)
	const symbolList = ref<any[]>([])
	const feeEstimate = ref<any | null>(null)
	const currentBid = ref('0')
	const currentAsk = ref('0')
	const minLot = ref(0.01)
	const maxLot = ref(100)

	const lotsOptions = [0.01, 0.05, 0.1, 0.5, 1.0]
	const leverageOptions = [10, 20, 50, 100, 200]
	const pendingTypes = [
		{ key: 'buy_limit', label: '买入限价' },
		{ key: 'buy_stop', label: '买入止损' },
		{ key: 'sell_limit', label: '卖出限价' },
		{ key: 'sell_stop', label: '卖出止损' },
	]

	let priceTimer = 0

	onLoad((options : OnLoadOptions) => {
		if (options['accountType'] != null) {
			accountType.value = options['accountType']!
		}
		if (options['direction'] != null) {
			direction.value = options['direction']!
		}
		if (options['symbolId'] != null) {
			loadSymbolById(options['symbolId']!)
		} else if (options['symbol'] != null) {
			loadSymbolByCode(options['symbol']!)
		}
		loadSymbols()
	})

	onUnload(() => {
		if (priceTimer > 0) clearInterval(priceTimer)
	})

	function loadSymbols() {
		get('/api/mobile/trade/symbols').then((res) => {
			if (res.code == 200 && res.data != null) {
				const arr = JSON.parse<any[]>(JSON.stringify(res.data))
				if (arr != null) symbolList.value = arr!
			}
		}).catch((_e : any) => { })
	}

	function loadSymbolById(idStr : string) {
		get(`/api/mobile/market/symbols/${idStr}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				selectedSymbol.value = d
				onSymbolSelected()
			}
		}).catch((_e : any) => { })
	}

	function loadSymbolByCode(code : string) {
		get('/api/mobile/market/symbols').then((res) => {
			if (res.code == 200 && res.data != null) {
				const arr = JSON.parse<any[]>(JSON.stringify(res.data))
				if (arr != null) {
					for (let i = 0; i < arr!.length; i++) {
						if ((arr![i]['symbol'] as string) == code) {
							selectedSymbol.value = arr![i]
							onSymbolSelected()
							break
						}
					}
				}
			}
		}).catch((_e : any) => { })
	}

	function setDirection(dir : string) {
		direction.value = dir
		estimateFees()
	}

	function setLots(l : number) {
		lots.value = l
		estimateFees()
	}

	function setLeverage(lv : number) {
		leverage.value = lv
		estimateFees()
	}

	function selectSymbol(sym : any) {
		selectedSymbol.value = sym
		showSymbolPicker.value = false
		onSymbolSelected()
	}

	function onSymbolSelected() {
		if (selectedSymbol.value == null) return
		const s = selectedSymbol.value!
		minLot.value = (s['min_lot'] as number) ?? 0.01
		maxLot.value = (s['max_lot'] as number) ?? 100
		currentBid.value = ((s['bid'] as number) ?? 0).toString()
		currentAsk.value = ((s['ask'] as number) ?? 0).toString()

		if (priceTimer > 0) clearInterval(priceTimer)
		priceTimer = setInterval(() => { refreshPrice() }, 2000) as number
		estimateFees()
	}

	function refreshPrice() {
		if (selectedSymbol.value == null) return
		const symId = selectedSymbol.value!['id'] as number
		get(`/api/mobile/market/symbols/${symId}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				currentBid.value = ((d['bid'] as number) ?? 0).toString()
				currentAsk.value = ((d['ask'] as number) ?? 0).toString()
			}
		}).catch((_e : any) => { })
	}

	function estimateFees() {
		if (selectedSymbol.value == null) return
		const symId = selectedSymbol.value!['id'] as number
		post('/api/mobile/trade/estimate', {
			symbolId: symId,
			direction: direction.value,
			lots: lots.value,
			leverage: leverage.value,
		}).then((res) => {
			if (res.code == 200 && res.data != null) {
				feeEstimate.value = res.data as any
			}
		}).catch((_e : any) => { })
	}

	function submitOrder() {
		if (selectedSymbol.value == null) {
			uni.showToast({ title: '请选择交易品种', icon: 'none' })
			return
		}

		const symId = selectedSymbol.value!['id'] as number

		if (orderType.value == 'market') {
			const data = {
				symbolId: symId,
				direction: direction.value,
				lots: lots.value,
				leverage: leverage.value,
				accountType: accountType.value,
			} as any
			if (stopLoss.value.length > 0) data['stopLoss'] = parseFloat(stopLoss.value)
			if (takeProfit.value.length > 0) data['takeProfit'] = parseFloat(takeProfit.value)
			if (trailingStop.value.length > 0) data['trailingStop'] = parseFloat(trailingStop.value)

			post('/api/mobile/trade/order', data).then((res) => {
				if (res.code == 201 || res.code == 200) {
					uni.showToast({ title: '下单成功', icon: 'success' })
					setTimeout(() => { uni.navigateBack({}) }, 1500)
				} else {
					uni.showToast({ title: res.msg, icon: 'none' })
				}
			}).catch((_e : any) => {
				uni.showToast({ title: '下单失败', icon: 'none' })
			})
		} else {
			if (targetPrice.value.length == 0) {
				uni.showToast({ title: '请输入目标价格', icon: 'none' })
				return
			}
			const pDir = pendingType.value.indexOf('buy') >= 0 ? 'buy' : 'sell'
			const data = {
				symbolId: symId,
				direction: pDir,
				pendingType: pendingType.value,
				lots: lots.value,
				leverage: leverage.value,
				targetPrice: parseFloat(targetPrice.value),
				accountType: accountType.value,
			} as any
			if (stopLoss.value.length > 0) data['stopLoss'] = parseFloat(stopLoss.value)
			if (takeProfit.value.length > 0) data['takeProfit'] = parseFloat(takeProfit.value)
			if (trailingStop.value.length > 0) data['trailingStop'] = parseFloat(trailingStop.value)

			post('/api/mobile/trade/pending', data).then((res) => {
				if (res.code == 201 || res.code == 200) {
					uni.showToast({ title: '挂单创建成功', icon: 'success' })
					setTimeout(() => { uni.navigateBack({}) }, 1500)
				} else {
					uni.showToast({ title: res.msg, icon: 'none' })
				}
			}).catch((_e : any) => {
				uni.showToast({ title: '创建失败', icon: 'none' })
			})
		}
	}
</script>

<style>
	.place-order-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.form-scroll {
		flex: 1;
	}

	.section {
		margin: var(--spacing-sm) var(--spacing-md);
		padding: var(--spacing-md);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	.section-title {
		font-size: var(--font-sm);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
		letter-spacing: 0.3px;
	}

	.symbol-selector {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-md);
		background-color: var(--color-bg-input);
		border-radius: var(--radius-sm);
		border-width: 1px;
		border-color: var(--color-border);
		border-style: solid;
		transition: border-color var(--transition-fast);
	}

	.symbol-selected {
		font-size: var(--font-md);
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.symbol-placeholder {
		font-size: var(--font-md);
		color: var(--color-text-muted);
	}

	.arrow-right {
		font-size: 20px;
		color: var(--color-text-muted);
	}

	.price-display {
		flex-direction: row;
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background-color: var(--color-bg-section);
		border-radius: var(--radius-sm);
	}

	.price-col {
		flex: 1;
		align-items: center;
	}

	.price-label {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.3px;
	}

	.price-val {
		font-size: var(--font-xl);
		font-weight: 700;
		margin-top: var(--spacing-xs);
		letter-spacing: -0.3px;
	}

	.order-type-row {
		flex-direction: row;
		gap: var(--spacing-sm);
	}

	.type-btn {
		flex: 1;
		height: 40px;
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-input);
		border-width: 1.5px;
		border-color: transparent;
		border-style: solid;
		transition: all var(--transition-fast);
	}

	.type-btn-active {
		background-color: var(--color-primary-bg);
		border-color: var(--color-primary);
	}

	.type-btn-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.type-btn-text-active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.pending-types {
		flex-direction: row;
		flex-wrap: wrap;
		margin-bottom: var(--spacing-md);
		gap: var(--spacing-sm);
	}

	.pending-type-item {
		padding: var(--spacing-sm) var(--spacing-md);
		margin: 2px;
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-input);
		border-width: 1.5px;
		border-color: transparent;
		border-style: solid;
		transition: all var(--transition-fast);
	}

	.pending-type-active {
		background-color: var(--color-primary-bg);
		border-color: var(--color-primary);
	}

	.pending-type-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.pending-type-text-active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.direction-row {
		flex-direction: row;
		gap: var(--spacing-sm);
	}

	.dir-btn {
		flex: 1;
		height: 52px;
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.dir-btn-buy {
		background-color: var(--color-success-bg);
		border-width: 1.5px;
		border-color: transparent;
		border-style: solid;
	}

	.dir-btn-buy-active {
		background: var(--gradient-success);
		border-color: transparent;
		box-shadow: var(--shadow-btn);
	}

	.dir-btn-sell {
		background-color: var(--color-danger-bg);
		border-width: 1.5px;
		border-color: transparent;
		border-style: solid;
	}

	.dir-btn-sell-active {
		background: var(--gradient-danger);
		border-color: transparent;
		box-shadow: var(--shadow-btn);
	}

	.dir-btn-text {
		font-size: var(--font-md);
		color: var(--color-text-secondary);
		font-weight: 700;
	}

	.dir-btn-text-active {
		color: var(--color-text-inverse);
	}

	.lots-quick {
		flex-direction: row;
		margin-bottom: var(--spacing-sm);
		gap: var(--spacing-sm);
	}

	.lots-item {
		flex: 1;
		height: 36px;
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-input);
		border-width: 1.5px;
		border-color: transparent;
		border-style: solid;
		transition: all var(--transition-fast);
	}

	.lots-item-active {
		background-color: var(--color-primary-bg);
		border-color: var(--color-primary);
	}

	.lots-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.lots-text-active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.form-row {
		flex-direction: row;
		align-items: center;
		margin-top: var(--spacing-sm);
	}

	.form-label {
		width: 100px;
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.form-input {
		flex: 1;
		height: 40px;
		background-color: var(--color-bg-input);
		border-radius: var(--radius-sm);
		padding: 0 var(--spacing-md);
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		border-width: 1px;
		border-color: var(--color-border);
		border-style: solid;
		transition: border-color var(--transition-fast);
	}

	.fee-row {
		flex-direction: row;
		justify-content: space-between;
		padding: var(--spacing-sm) 0;
	}

	.fee-row-total {
		border-top-width: 1px;
		border-top-color: var(--color-divider);
		border-top-style: solid;
		margin-top: var(--spacing-sm);
		padding-top: var(--spacing-md);
	}

	.fee-label {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.fee-value {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.fee-label-bold {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 700;
	}

	.fee-value-bold {
		font-size: var(--font-md);
		color: var(--color-primary);
		font-weight: 700;
	}

	.submit-area {
		padding: var(--spacing-lg) var(--spacing-md);
		padding-bottom: var(--spacing-3xl);
		position: fixed;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 99;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.submit-btn {
		height: 52px;
		border-radius: var(--radius-lg);
		justify-content: center;
		align-items: center;
		box-shadow: var(--shadow-lg);
		transition: opacity var(--transition-fast);
	}

	.submit-btn-buy {
		background: var(--gradient-success);
	}

	.submit-btn-sell {
		background: var(--gradient-danger);
	}

	.submit-btn-text {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text-inverse);
		letter-spacing: 1px;
	}

	.symbol-picker-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(15, 23, 42, 0.6);
		justify-content: flex-end;
	}

	.symbol-picker {
		background-color: var(--color-bg-card);
		border-top-left-radius: var(--radius-xl);
		border-top-right-radius: var(--radius-xl);
		max-height: 500px;
		box-shadow: var(--shadow-xl);
	}

	.picker-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
	}

	.picker-title {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.picker-close {
		font-size: 18px;
		color: var(--color-text-muted);
		padding: var(--spacing-xs) var(--spacing-sm);
	}

	.picker-list {
		max-height: 400px;
	}

	.picker-item {
		flex-direction: row;
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
		align-items: center;
		transition: background-color var(--transition-fast);
	}

	.picker-symbol {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-right: var(--spacing-md);
	}

	.picker-name {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.text-green {
		color: var(--color-success);
	}

	.text-red {
		color: var(--color-danger);
	}
</style>
