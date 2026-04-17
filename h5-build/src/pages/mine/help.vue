<template>
	<scroll-view class="help-page" direction="vertical">
		<CustomNavBar title="帮助中心" />
		<view class="search-bar">
			<input class="search-input" v-model="keyword" placeholder="搜索帮助文档" @confirm="doSearch" />
		</view>

		<view class="category-bar">
			<view v-for="cat in categories" :key="cat.key" :class="['cat-item', { active: currentCat == cat.key }]"
				@click="switchCategory(cat.key)">
				<text :class="['cat-text', { active: currentCat == cat.key }]">{{cat.label}}</text>
			</view>
		</view>

		<view class="help-list">
			<view v-if="list.length == 0" class="empty"><text class="empty-text">暂无文档</text></view>
			<view v-for="item in list" :key="item.id" class="help-item" @click="goDetail(item.id)">
				<text class="help-title">{{item.title}}</text>
				<text class="help-meta">浏览 {{item.view_count}}</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get } from '../../utils/request.uts'

	type HelpItem = { id : number; title : string; category : string; view_count : number }
	type CatItem = { key : string; label : string }

	const categories = ref<CatItem[]>([
		{ key: '', label: '全部' }, { key: 'trading_rules', label: '交易规则' },
		{ key: 'fee_info', label: '费用说明' }, { key: 'deposit_withdraw', label: '出入金' }, { key: 'faq', label: '常见问题' }
	])
	const currentCat = ref('')
	const keyword = ref('')
	const list = ref<HelpItem[]>([])

	onShow(() => { loadList() })

	function switchCategory(key : string) { currentCat.value = key; loadList() }

	function loadList() {
		let url = '/api/mobile/help/list'
		if (currentCat.value.length > 0) url += `?category=${currentCat.value}`
		get(url).then((res) => {
			if (res.code == 200 && res.data != null) {
				parseList(res.data as any[])
			}
		}).catch((_e) => {})
	}

	function doSearch() {
		if (keyword.value.length == 0) { loadList(); return }
		get(`/api/mobile/help/search?keyword=${keyword.value}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				parseList(res.data as any[])
			}
		}).catch((_e) => {})
	}

	function parseList(items : any[]) {
		const arr : HelpItem[] = []
		for (let i = 0; i < items.length; i++) {
			const it = items[i]
			arr.push({ id: (it['id'] as number) ?? 0, title: (it['title'] as string) ?? '', category: (it['category'] as string) ?? '', view_count: (it['view_count'] as number) ?? 0 } as HelpItem)
		}
		list.value = arr
	}

	function goDetail(id : number) {
		uni.navigateTo({ url: `/pages/mine/help-detail?id=${id}` })
	}
</script>

<style>
	.help-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.search-bar {
		padding: var(--spacing-md) var(--spacing-lg);
		background-color: var(--color-bg-card);
	}

	.search-input {
		background-color: var(--color-bg-section);
		border-radius: var(--radius-pill);
		padding: var(--spacing-md) var(--spacing-xl);
		font-size: var(--font-sm);
		color: var(--color-text-primary);
	}

	.category-bar {
		flex-direction: row;
		background-color: var(--color-bg-card);
		padding: var(--spacing-sm) var(--spacing-md);
		margin-bottom: var(--spacing-sm);
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: var(--color-divider);
	}

	.cat-item {
		padding: var(--spacing-xs) var(--spacing-md);
		margin-right: var(--spacing-sm);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		border-width: 1px;
		border-style: solid;
		border-color: transparent;
		transition-property: background-color;
		transition-duration: var(--transition-fast);
	}

	.cat-item.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.cat-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.cat-text.active {
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.help-list {
		padding: 0 var(--spacing-lg);
		padding-top: var(--spacing-sm);
	}

	.empty {
		padding: 60px;
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.help-item {
		padding: var(--spacing-lg);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		margin-bottom: var(--spacing-sm);
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		box-shadow: var(--shadow-sm);
	}

	.help-title {
		font-size: var(--font-md);
		color: var(--color-text-primary);
		flex: 1;
		font-weight: 500;
	}

	.help-meta {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}
</style>
