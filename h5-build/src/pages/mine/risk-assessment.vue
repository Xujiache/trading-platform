<template>
	<scroll-view class="ra-page" direction="vertical">
		<CustomNavBar title="风险测评" />
		<view class="result-card" v-if="currentLevel != 'none'">
			<text class="result-title">您的风险等级</text>
			<text class="result-level">{{levelText}}</text>
			<view class="redo-btn" @click="showQuestions = true">
				<text class="redo-text">重新测评</text>
			</view>
		</view>

		<view class="question-section" v-if="currentLevel == 'none' || showQuestions">
			<text class="q-title">风险测评问卷</text>

			<view class="q-item" v-for="(q, idx) in questions" :key="idx">
				<text class="q-text">{{idx + 1}}. {{q.title}}</text>
				<view class="option" v-for="(opt, oidx) in q.options" :key="oidx"
					:class="{ selected: answers[idx] == opt.score }"
					@click="selectAnswer(idx, opt.score)">
					<text class="option-text">{{opt.label}}</text>
				</view>
			</view>

			<view style="height: 80px; flex-shrink: 0;"></view>
			<view class="submit-btn" @click="submitAssessment">
				<text class="submit-text">提交测评</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get, post } from '../../utils/request.uts'

	const currentLevel = ref('none')
	const showQuestions = ref(false)
	const answers = ref<number[]>([0, 0, 0, 0, 0])

	type QuestionOption = { label : string; score : number }
	type Question = { title : string; options : QuestionOption[] }

	const questions = ref<Question[]>([
		{ title: '您的投资经验有多长？', options: [{ label: '无经验', score: 5 }, { label: '1-3年', score: 10 }, { label: '3-5年', score: 15 }, { label: '5年以上', score: 20 }] },
		{ title: '您能承受的最大亏损比例？', options: [{ label: '10%以内', score: 5 }, { label: '10-30%', score: 10 }, { label: '30-50%', score: 15 }, { label: '50%以上', score: 20 }] },
		{ title: '您的投资目标是？', options: [{ label: '保本为主', score: 5 }, { label: '稳健增值', score: 10 }, { label: '积极增长', score: 15 }, { label: '追求高收益', score: 20 }] },
		{ title: '您了解杠杆交易的风险吗？', options: [{ label: '不了解', score: 5 }, { label: '略知一二', score: 10 }, { label: '比较了解', score: 15 }, { label: '非常了解', score: 20 }] },
		{ title: '您的可投资资金占总资产比例？', options: [{ label: '10%以内', score: 5 }, { label: '10-30%', score: 10 }, { label: '30-50%', score: 15 }, { label: '50%以上', score: 20 }] },
	])

	const levelText = computed(() : string => {
		if (currentLevel.value == 'conservative') return '保守型'
		if (currentLevel.value == 'moderate') return '稳健型'
		if (currentLevel.value == 'aggressive') return '进取型'
		if (currentLevel.value == 'professional') return '专业型'
		return '未测评'
	})

	onLoad(() => {
		get('/api/mobile/user/risk-assessment').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				currentLevel.value = (d['level'] as string) ?? 'none'
			}
		}).catch((_e) => {})
	})

	function selectAnswer(qIdx : number, score : number) {
		const arr = answers.value.slice(0)
		arr[qIdx] = score
		answers.value = arr
	}

	function submitAssessment() {
		const ansArr : any[] = []
		for (let i = 0; i < answers.value.length; i++) {
			ansArr.push({ score: answers.value[i] } as any)
		}
		post('/api/mobile/user/risk-assessment', { answers: ansArr } as any).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				currentLevel.value = (d['level'] as string) ?? 'none'
				showQuestions.value = false
				uni.showToast({ title: '测评完成', icon: 'success' })
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_e) => {})
	}
</script>

<style>
	.ra-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.result-card {
		margin: var(--spacing-lg);
		padding: var(--spacing-3xl) var(--spacing-xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		align-items: center;
		box-shadow: var(--shadow-card);
	}

	.result-title {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-sm);
	}

	.result-level {
		font-size: var(--font-4xl);
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: var(--spacing-lg);
	}

	.redo-btn {
		padding: var(--spacing-sm) var(--spacing-xl);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-primary);
		border-radius: var(--radius-pill);
		transition: all var(--transition-fast);
	}

	.redo-text {
		font-size: var(--font-sm);
		color: var(--color-primary);
		font-weight: 500;
	}

	.question-section {
		margin: var(--spacing-lg);
		padding: var(--spacing-xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.q-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xl);
	}

	.q-item {
		margin-bottom: var(--spacing-xl);
	}

	.q-text {
		font-size: var(--font-md);
		color: var(--color-text-primary);
		font-weight: 600;
		margin-bottom: var(--spacing-md);
	}

	.option {
		padding: var(--spacing-md) var(--spacing-lg);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-sm);
		background-color: var(--color-bg-card);
		transition: all var(--transition-fast);
	}

	.option.selected {
		border-color: var(--color-primary);
		background-color: var(--color-primary-bg);
	}

	.option-text {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
	}

	.submit-btn {
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background-image: var(--gradient-primary);
		border-radius: var(--radius-md);
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
		font-weight: 600;
	}
</style>
