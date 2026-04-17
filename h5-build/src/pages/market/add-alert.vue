<template>
	<scroll-view class="add-alert-page" direction="vertical">
		<CustomNavBar title="新增预警" />
		<view class="form-section">
			<text class="form-label">选择品种</text>
			<view class="symbol-picker" @click="showSymbolPicker = true">
				<text class="picker-value" v-if="selectedSymbol.length > 0">{{selectedSymbol}}</text>
				<text class="picker-placeholder" v-else>请选择交易品种</text>
			</view>
		</view>

		<view class="form-section">
			<text class="form-label">预警类型</text>
			<view class="type-group">
				<view v-for="(t, idx) in alertTypes" :key="idx" class="type-item"
					:class="{'type-active': selectedType == idx}" @click="selectedType = idx">
					<text class="type-text" :class="{'type-text-active': selectedType == idx}">{{t.label}}</text>
				</view>
			</view>
		</view>

		<view class="form-section">
			<text class="form-label">目标值</text>
			<input class="form-input" type="digit" :placeholder="getTargetPlaceholder()" :value="targetValue"
				@input="onTargetInput" />
			<text class="form-hint">{{getTargetHint()}}</text>
		</view>

		<view class="form-section">
			<text class="form-label">通知方式</text>
			<view class="type-group">
				<view v-for="(n, idx) in notifyMethods" :key="idx" class="type-item"
					:class="{'type-active': selectedNotify == idx}" @click="selectedNotify = idx">
					<text class="type-text" :class="{'type-text-active': selectedNotify == idx}">{{n.label}}</text>
				</view>
			</view>
		</view>

		<view class="form-section">
			<text class="form-label">备注（可选）</text>
			<input class="form-input" type="text" placeholder="添加备注说明" :value="note" @input="onNoteInput" />
		</view>

		<view style="height: 80px; flex-shrink: 0;"></view>
		<view class="submit-btn" @click="submitAlert">
			<text class="submit-text">创建预警</text>
		</view>

		<view v-if="showSymbolPicker" class="picker-overlay" @click="showSymbolPicker = false">
			<view class="picker-panel" @click.stop="">
				<view class="picker-header">
					<text class="picker-title">选择品种</text>
					<text class="picker-close" @click="showSymbolPicker = false">关闭</text>
				</view>
				<scroll-view class="picker-list" direction="vertical">
					<view v-for="(s, idx) in symbolList" :key="idx" class="picker-item"
						@click="selectSymbol(s)">
						<text class="picker-item-code">{{s.symbol}}</text>
						<text class="picker-item-name">{{s.name}}</text>
					</view>
				</scroll-view>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get, post } from '@/utils/request.uts'

	type SimpleSymbol = {
		symbol : string
		name : string
	}

	const alertTypes = [
		{ key: 'price_above', label: '价格高于' },
		{ key: 'price_below', label: '价格低于' },
		{ key: 'change_percent', label: '涨跌幅达' },
	]

	const notifyMethods = [
		{ key: 'push', label: '推送通知' },
		{ key: 'email', label: '邮件通知' },
	]

	const selectedSymbol = ref('')
	const selectedType = ref(0)
	const targetValue = ref('')
	const selectedNotify = ref(0)
	const note = ref('')
	const showSymbolPicker = ref(false)
	const symbolList = ref<SimpleSymbol[]>([])

	onLoad((options : OnLoadOptions) => {
		const sym = options['symbol'] ?? ''
		if (sym.length > 0) {
			selectedSymbol.value = sym
		}
		loadSymbols()
	})

	function loadSymbols() {
		get('/api/mobile/market/symbols').then((res) => {
			if (res.code == 200 && res.data != null) {
				const raw = JSON.stringify(res.data)
				const arr = JSON.parse<any[]>(raw)
				if (arr != null) {
					const list : SimpleSymbol[] = []
					for (let i = 0; i < arr!.length; i++) {
						const item = arr![i]
						list.push({
							symbol: item['symbol'] as string,
							name: item['name'] as string,
						} as SimpleSymbol)
					}
					symbolList.value = list
				}
			}
		}).catch((_e : any) => { })
	}

	function selectSymbol(s : SimpleSymbol) {
		selectedSymbol.value = s.symbol
		showSymbolPicker.value = false
	}

	function onTargetInput(e : InputEvent) {
		targetValue.value = e.detail.value
	}

	function onNoteInput(e : InputEvent) {
		note.value = e.detail.value
	}

	function getTargetPlaceholder() : string {
		if (selectedType.value == 2) return '请输入百分比，如 5'
		return '请输入目标价格'
	}

	function getTargetHint() : string {
		if (selectedType.value == 0) return '当价格高于此值时触发预警'
		if (selectedType.value == 1) return '当价格低于此值时触发预警'
		return '当涨跌幅达到此百分比时触发预警'
	}

	function submitAlert() {
		if (selectedSymbol.value.length == 0) {
			uni.showToast({ title: '请选择品种', icon: 'none' })
			return
		}
		if (targetValue.value.length == 0) {
			uni.showToast({ title: '请输入目标值', icon: 'none' })
			return
		}

		const data = {
			symbol: selectedSymbol.value,
			alert_type: alertTypes[selectedType.value].key,
			target_value: parseFloat(targetValue.value),
			notify_method: notifyMethods[selectedNotify.value].key,
			note: note.value.length > 0 ? note.value : null,
		}

		post('/api/mobile/market/alerts', data).then((res) => {
			if (res.code == 201 || res.code == 200) {
				uni.showToast({ title: '预警创建成功', icon: 'success' })
				setTimeout(() => {
					uni.navigateBack({})
				}, 1500)
			} else {
				const msg = res.msg ?? '创建失败'
				uni.showToast({ title: msg, icon: 'none' })
			}
		}).catch((_e : any) => {
			uni.showToast({ title: '网络错误', icon: 'none' })
		})
	}
</script>

<style>
	.add-alert-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.form-section {
		background-color: var(--color-bg-card);
		padding: var(--spacing-xl);
		margin-bottom: 1px;
		margin-left: var(--spacing-md);
		margin-right: var(--spacing-md);
		margin-top: var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.form-label {
		font-size: var(--font-sm);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
		letter-spacing: 0.2px;
	}

	.symbol-picker {
		height: 48px;
		background-color: var(--color-bg-input);
		border-radius: var(--radius-md);
		padding: 0 var(--spacing-lg);
		justify-content: center;
		border-width: 1px;
		border-color: var(--color-border);
		border-style: solid;
		transition-property: border-color;
		transition-duration: var(--transition-fast);
	}

	.picker-value {
		font-size: var(--font-md);
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.picker-placeholder {
		font-size: var(--font-md);
		color: var(--color-text-muted);
	}

	.type-group {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.type-item {
		padding: var(--spacing-sm) var(--spacing-lg);
		margin-right: var(--spacing-sm);
		margin-bottom: var(--spacing-xs);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		border-width: 1px;
		border-color: var(--color-border-light);
		border-style: solid;
		transition-property: background-color, border-color;
		transition-duration: var(--transition-fast);
	}

	.type-active {
		background-color: var(--color-primary-bg);
		border-color: var(--color-primary);
	}

	.type-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.type-text-active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.form-input {
		height: 48px;
		background-color: var(--color-bg-input);
		border-radius: var(--radius-md);
		padding: 0 var(--spacing-lg);
		font-size: var(--font-md);
		color: var(--color-text-primary);
		border-width: 1px;
		border-color: var(--color-border);
		border-style: solid;
		transition-property: border-color;
		transition-duration: var(--transition-fast);
	}

	.form-hint {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: var(--spacing-sm);
	}

	.submit-btn {
		margin: var(--spacing-2xl) var(--spacing-lg);
		height: 52px;
		background-image: var(--gradient-primary);
		border-radius: var(--radius-md);
		justify-content: center;
		align-items: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		position: fixed;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 99;
	}

	.submit-text {
		font-size: var(--font-md);
		color: var(--color-text-inverse);
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.picker-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(15, 23, 42, 0.6);
		justify-content: flex-end;
	}

	.picker-panel {
		background-color: var(--color-bg-card);
		border-top-left-radius: var(--radius-xl);
		border-top-right-radius: var(--radius-xl);
		max-height: 500px;
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
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.picker-close {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.picker-list {
		max-height: 400px;
	}

	.picker-item {
		flex-direction: row;
		align-items: center;
		padding: var(--spacing-lg) var(--spacing-lg);
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
		transition-property: background-color;
		transition-duration: var(--transition-fast);
	}

	.picker-item-code {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-right: var(--spacing-md);
		letter-spacing: 0.3px;
	}

	.picker-item-name {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}
</style>
