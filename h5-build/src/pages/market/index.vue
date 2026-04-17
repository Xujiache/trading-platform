<template>
	<view class="market-page">
		<view class="market-header">
			<view class="search-input-wrap">
				<image class="search-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E" mode="aspectFit"></image>
				<input class="search-input" type="text" placeholder="搜索品种代码或名称" :value="keyword"
					@input="onSearchInput" />
			</view>
			<view class="filter-bar">
				<view class="filter-dropdown" @click="showCategorySheet = true">
					<text class="filter-label">{{categories[activeCategory].label}}</text>
					<image class="filter-arrow" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="filter-dropdown" @click="showSortSheet = true">
					<text class="filter-label">{{boardTabs[activeBoardTab]}}</text>
					<image class="filter-arrow" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<view class="list-header">
			<text class="header-col-name">名称</text>
			<text class="header-col-price">最新价</text>
			<text class="header-col-change">涨跌幅</text>
		</view>

		<scroll-view class="symbol-list" direction="vertical">
			<view v-for="(item, idx) in filteredSymbols" :key="idx" class="symbol-row" @click="goDetail(item)">
				<view class="symbol-info">
					<text class="symbol-code">{{item.symbol}}</text>
					<text class="symbol-name">{{item.name}}</text>
				</view>
				<text class="symbol-price" :class="item.change >= 0 ? 'price-up' : 'price-down'">{{formatPrice(item.bid, item.price_decimals)}}</text>
				<text class="change-value" :class="item.change >= 0 ? 'price-up' : 'price-down'">{{item.change_percent >= 0 ? '+' : ''}}{{item.change_percent.toFixed(2)}}%</text>
			</view>
			<view v-if="filteredSymbols.length == 0" class="empty-view">
				<text class="empty-text">暂无数据</text>
			</view>
		</scroll-view>

		<view class="sheet-mask" v-if="showCategorySheet || showSortSheet" @click="showCategorySheet = false; showSortSheet = false">
			<view class="sheet-panel" @click.stop="">
				<view class="sheet-header">
					<text class="sheet-title">{{showCategorySheet ? '选择分类' : '排序方式'}}</text>
					<text class="sheet-close" @click="showCategorySheet = false; showSortSheet = false">关闭</text>
				</view>
				<view v-if="showCategorySheet" class="sheet-options">
					<view v-for="(cat, idx) in categories" :key="idx" class="sheet-option" :class="{'sheet-option-active': activeCategory == idx}" @click="switchCategory(idx); showCategorySheet = false">
						<text class="sheet-option-text" :class="{'sheet-option-text-active': activeCategory == idx}">{{cat.label}}</text>
					</view>
				</view>
				<view v-if="showSortSheet" class="sheet-options">
					<view v-for="(tab, idx) in boardTabs" :key="idx" class="sheet-option" :class="{'sheet-option-active': activeBoardTab == idx}" @click="switchBoardTab(idx); showSortSheet = false">
						<text class="sheet-option-text" :class="{'sheet-option-text-active': activeBoardTab == idx}">{{tab}}</text>
					</view>
				</view>
			</view>
		</view>
		<FloatingTabBar :current="1" />
	</view>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'
	import { connectWebSocket, subscribeSymbols, disconnectWebSocket } from '@/utils/websocket.uts'
	import FloatingTabBar from '../../components/FloatingTabBar.vue'

	type SymbolItem = {
		id : number
		symbol : string
		name : string
		category : string
		is_hot : boolean
		price_decimals : number
		bid : number
		ask : number
		high : number
		low : number
		open : number
		change : number
		change_percent : number
		volume : number
	}

	const boardTabs = ['全部', '自选', '热门', '涨幅榜', '跌幅榜', '高波动']
	const categories = [
		{ key: 'all', label: '全部' },
		{ key: 'precious_metal', label: '贵金属' },
		{ key: 'energy', label: '能源' },
		{ key: 'forex', label: '外汇' },
	]

	const symbols = ref<SymbolItem[]>([])
	const keyword = ref('')
	const activeBoardTab = ref(0)
	const activeCategory = ref(0)
	const showCategorySheet = ref(false)
	const showSortSheet = ref(false)
	let refreshTimer = 0

	const favorites = ref<string[]>([])

	onLoad(() => {
		loadFavorites()
		loadSymbols()
		connectWebSocket((tickData : any) => {
			if (tickData == null) return
			const obj = tickData as any
			const sym = obj['symbol'] as string
			for (let i = 0; i < symbols.value.length; i++) {
				if (symbols.value[i].symbol == sym) {
					symbols.value[i].bid = obj['bid'] as number
					symbols.value[i].ask = obj['ask'] as number
					symbols.value[i].high = obj['high'] as number
					symbols.value[i].low = obj['low'] as number
					symbols.value[i].change = obj['change'] as number
					symbols.value[i].change_percent = obj['change_percent'] as number
					symbols.value[i].volume = obj['volume'] as number
					break
				}
			}
		})
	})

	onUnload(() => {
		if (refreshTimer > 0) {
			clearInterval(refreshTimer)
		}
		disconnectWebSocket()
	})

	const filteredSymbols = computed((): SymbolItem[] => {
		let list = symbols.value.slice(0)

		const catKey = categories[activeCategory.value].key
		if (catKey != 'all') {
			list = list.filter((s : SymbolItem) : boolean => s.category == catKey)
		}

		if (keyword.value.length > 0) {
			const kw = keyword.value.toLowerCase()
			list = list.filter((s : SymbolItem) : boolean =>
				s.symbol.toLowerCase().indexOf(kw) >= 0 || s.name.toLowerCase().indexOf(kw) >= 0
			)
		}

		const tab = activeBoardTab.value
		if (tab == 1) {
			list = list.filter((s : SymbolItem) : boolean => favorites.value.indexOf(s.symbol) >= 0)
		} else if (tab == 2) {
			list = list.filter((s : SymbolItem) : boolean => s.is_hot)
		} else if (tab == 3) {
			list.sort((a : SymbolItem, b : SymbolItem) : number => {
				if (b.change_percent > a.change_percent) return 1
				if (b.change_percent < a.change_percent) return -1
				return 0
			})
		} else if (tab == 4) {
			list.sort((a : SymbolItem, b : SymbolItem) : number => {
				if (a.change_percent > b.change_percent) return 1
				if (a.change_percent < b.change_percent) return -1
				return 0
			})
		} else if (tab == 5) {
			list.sort((a : SymbolItem, b : SymbolItem) : number => {
				const aVol = Math.abs(a.change_percent)
				const bVol = Math.abs(b.change_percent)
				if (bVol > aVol) return 1
				if (bVol < aVol) return -1
				return 0
			})
		}

		return list
	})

	function loadFavorites() {
		const stored = uni.getStorageSync('market_favorites') as string
		if (stored.length > 0) {
			const arr = JSON.parse<string[]>(stored)
			if (arr != null) {
				favorites.value = arr!
			}
		}
	}

	function loadSymbols() {
		get('/api/mobile/market/symbols').then((res) => {
			if (res.code == 200 && res.data != null) {
				const arr = JSON.parse<SymbolItem[]>(JSON.stringify(res.data))
				if (arr != null) {
					symbols.value = arr!
					const symCodes : string[] = []
					for (let i = 0; i < arr!.length; i++) {
						symCodes.push(arr![i].symbol)
					}
					subscribeSymbols(symCodes)
				}
			}
		}).catch((_e : any) => { })
	}

	function onSearchInput(e : InputEvent) {
		keyword.value = e.detail.value
	}

	function switchBoardTab(idx : number) {
		activeBoardTab.value = idx
	}

	function switchCategory(idx : number) {
		activeCategory.value = idx
	}

	function formatPrice(price : number, decimals : number) : string {
		return price.toFixed(decimals)
	}

	function goDetail(item : SymbolItem) {
		uni.navigateTo({
			url: `/pages/market/detail?id=${item.id}&symbol=${item.symbol}`
		})
	}
</script>

<style>
	.market-page { flex: 1; background-color: var(--color-bg-page); }

	.market-header {
		background-color: var(--color-bg-card);
		padding: env(safe-area-inset-top, 20px) 16px 0;
	}
	.search-input-wrap {
		display: flex; flex-direction: row; align-items: center;
		background-color: var(--color-bg-section); border-radius: var(--radius-pill);
		padding: 0 16px; height: 40px;
		border: 1px solid var(--color-border-light);
	}
	.search-icon { width: 16px; height: 16px; margin-right: 8px; flex-shrink: 0; }
	.search-input { flex: 1; font-size: 13px; height: 40px; color: var(--color-text-primary); background: transparent; }

	.filter-bar {
		display: flex; flex-direction: row; padding: 12px 0 10px; gap: 12px;
	}
	.filter-dropdown {
		display: flex; flex-direction: row; align-items: center;
		padding: 6px 14px; border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		border: 1px solid var(--color-border-light);
	}
	.filter-label { font-size: 13px; color: var(--color-text-primary); font-weight: 600; }
	.filter-arrow { width: 12px; height: 12px; margin-left: 4px; }

	.list-header {
		display: flex; flex-direction: row; align-items: center;
		padding: 10px 16px; background-color: var(--color-bg-section);
		border-bottom: 1px solid var(--color-divider);
	}
	.header-col-name { flex: 1; font-size: 11px; color: var(--color-text-muted); font-weight: 500; }
	.header-col-price { width: 110px; font-size: 11px; color: var(--color-text-muted); text-align: right; font-weight: 500; }
	.header-col-change { width: 80px; font-size: 11px; color: var(--color-text-muted); text-align: right; font-weight: 500; }

	.symbol-list { flex: 1; background-color: var(--color-bg-card); }
	.symbol-row {
		display: flex; flex-direction: row; align-items: center;
		padding: 14px 16px;
		border-bottom: 1px solid var(--color-divider);
	}
	.symbol-info { flex: 1; }
	.symbol-code { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
	.symbol-name { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
	.symbol-price {
		width: 110px; font-size: 15px; text-align: right; font-weight: 700;
		font-family: 'DIN Alternate', 'Roboto Mono', 'SF Mono', monospace;
	}
	.change-value {
		width: 80px; font-size: 13px; text-align: right; font-weight: 700;
		font-family: 'DIN Alternate', 'Roboto Mono', 'SF Mono', monospace;
	}
	.price-up { color: var(--color-danger); }
	.price-down { color: var(--color-success); }

	.sheet-mask {
		position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 998;
		background-color: rgba(0,0,0,0.4); justify-content: flex-end;
	}
	.sheet-panel {
		background-color: var(--color-bg-card); border-top-left-radius: 20px; border-top-right-radius: 20px;
		padding: 20px; padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
	}
	.sheet-header {
		display: flex; flex-direction: row; justify-content: space-between; align-items: center;
		margin-bottom: 16px;
	}
	.sheet-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
	.sheet-close { font-size: 14px; color: var(--color-text-muted); }
	.sheet-options { display: flex; flex-direction: column; }
	.sheet-option {
		padding: 14px 16px; border-radius: 10px; margin-bottom: 4px;
	}
	.sheet-option-active { background-color: var(--color-primary-bg); }
	.sheet-option-text { font-size: 15px; color: var(--color-text-primary); }
	.sheet-option-text-active { color: var(--color-primary); font-weight: 600; }

	.empty-view { padding: 80px 0; justify-content: center; align-items: center; }
	.empty-text { font-size: 14px; color: var(--color-text-muted); }
</style>
