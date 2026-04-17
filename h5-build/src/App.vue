<script setup lang="ts">
	import { onLaunch, onAppShow, onAppHide, onLastPageBackPress, onExit } from '@dcloudio/uni-app'

	// #ifdef APP-ANDROID || APP-HARMONY
	let firstBackTime = 0
	// #endif

	onLaunch(() => {
		console.log('App Launch')
		const theme = uni.getStorageSync('themeMode') as string
		applyTheme(theme || 'auto')
	})

	function applyTheme(mode : string) {
		let darkMode = false
		if (mode === 'dark') {
			darkMode = true
		} else if (mode === 'auto') {
			try {
				const sysInfo = uni.getSystemInfoSync()
				darkMode = sysInfo.theme === 'dark'
			} catch (e) {
				darkMode = false
			}
		}
		// #ifdef H5
		const pageEl = document.querySelector('uni-page-body') || document.documentElement
		if (darkMode) {
			pageEl.setAttribute('data-theme', 'dark')
			document.documentElement.setAttribute('data-theme', 'dark')
		} else {
			pageEl.removeAttribute('data-theme')
			document.documentElement.removeAttribute('data-theme')
		}
		// #endif
	}

	onAppShow(() => {
		console.log('App Show')
	})

	onAppHide(() => {
		console.log('App Hide')
	})

	// #ifdef APP-ANDROID || APP-HARMONY
	onLastPageBackPress(() => {
		console.log('App LastPageBackPress')
		if (firstBackTime == 0) {
			uni.showToast({
				title: '再按一次退出应用',
				position: 'bottom',
			})
			firstBackTime = Date.now()
			setTimeout(() => {
				firstBackTime = 0
			}, 2000)
		} else if (Date.now() - firstBackTime < 2000) {
			firstBackTime = Date.now()
			uni.exit()
		}
	})

	onExit(() => {
		console.log('App Exit')
	})
	// #endif
</script>

<style>
	/* Hide native tabBar completely to prevent flash */
	.uni-tabbar-bottom,
	uni-tabbar,
	.uni-tabbar {
		display: none !important;
		height: 0 !important;
		visibility: hidden !important;
		opacity: 0 !important;
	}

	/* Global Flexbox Reset for H5 to match nvue behavior */
	view, scroll-view, swiper-item {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	page {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		min-height: 100vh;
		--color-primary: #2563EB;
		--color-primary-light: #3B82F6;
		--color-primary-dark: #1D4ED8;
		--color-primary-bg: #EFF6FF;
		--color-accent: #F59E0B;
		--color-accent-bg: #FFFBEB;
		--color-success: #10B981;
		--color-success-bg: #ECFDF5;
		--color-danger: #EF4444;
		--color-danger-bg: #FEF2F2;
		--color-warning: #F59E0B;
		--color-warning-bg: #FFFBEB;

		--color-text-primary: #0F172A;
		--color-text-secondary: #475569;
		--color-text-muted: #94A3B8;
		--color-text-placeholder: #CBD5E1;
		--color-text-inverse: #FFFFFF;

		--color-bg-page: #F0F2F5;
		--color-bg-card: #FFFFFF;
		--color-bg-section: #F8FAFC;
		--color-bg-input: #F8FAFC;
		--color-bg-hover: #F1F5F9;

		--color-border: #E2E8F0;
		--color-border-light: #F1F5F9;
		--color-divider: #F1F5F9;

		--gradient-primary: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
		--gradient-dark: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
		--gradient-gold: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
		--gradient-success: linear-gradient(135deg, #10B981 0%, #059669 100%);
		--gradient-danger: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);

		--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
		--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
		--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
		--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.12);
		--shadow-card: 0 2px 12px rgba(0, 0, 0, 0.06);
		--shadow-btn: 0 2px 6px rgba(37, 99, 235, 0.3);

		--radius-sm: 6px;
		--radius-md: 10px;
		--radius-lg: 16px;
		--radius-xl: 20px;
		--radius-pill: 999px;
		--radius-circle: 50%;

		--spacing-xs: 4px;
		--spacing-sm: 8px;
		--spacing-md: 12px;
		--spacing-lg: 16px;
		--spacing-xl: 20px;
		--spacing-2xl: 24px;
		--spacing-3xl: 32px;

		--font-xs: 11px;
		--font-sm: 12px;
		--font-base: 14px;
		--font-md: 15px;
		--font-lg: 16px;
		--font-xl: 18px;
		--font-2xl: 20px;
		--font-3xl: 24px;
		--font-4xl: 28px;
		--font-5xl: 32px;

		--transition-fast: 0.15s ease;
		--transition-base: 0.25s ease;
		--transition-slow: 0.35s ease;

		background-color: var(--color-bg-page);
		color: var(--color-text-primary);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: var(--font-base);
		line-height: 1.5;
		-webkit-font-smoothing: antialiased;
	}

	/* Dark Mode */
	page[data-theme="dark"],
	[data-theme="dark"] page,
	html[data-theme="dark"] page {
		--color-primary: #3B82F6;
		--color-primary-light: #60A5FA;
		--color-primary-dark: #2563EB;
		--color-primary-bg: rgba(37, 99, 235, 0.15);
		--color-accent: #F59E0B;
		--color-accent-bg: rgba(245, 158, 11, 0.15);
		--color-success: #10B981;
		--color-success-bg: rgba(16, 185, 129, 0.15);
		--color-danger: #EF4444;
		--color-danger-bg: rgba(239, 68, 68, 0.15);
		--color-warning: #F59E0B;
		--color-warning-bg: rgba(245, 158, 11, 0.15);

		--color-text-primary: #E2E8F0;
		--color-text-secondary: #94A3B8;
		--color-text-muted: #64748B;
		--color-text-placeholder: #475569;
		--color-text-inverse: #FFFFFF;

		--color-bg-page: #0B0F19;
		--color-bg-card: #151A2D;
		--color-bg-section: #1A2035;
		--color-bg-input: #1A2035;
		--color-bg-hover: #1E293B;

		--color-border: #1E293B;
		--color-border-light: #1E293B;
		--color-divider: #1E293B;

		--gradient-primary: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		--gradient-dark: linear-gradient(135deg, #0B0F19 0%, #151A2D 100%);
		--gradient-gold: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
		--gradient-success: linear-gradient(135deg, #10B981 0%, #059669 100%);
		--gradient-danger: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);

		--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
		--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
		--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4);
		--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.5);
		--shadow-card: 0 2px 12px rgba(0, 0, 0, 0.3);
		--shadow-btn: 0 2px 6px rgba(59, 130, 246, 0.3);

		background-color: var(--color-bg-page);
		color: var(--color-text-primary);
	}

	@media (prefers-color-scheme: dark) {
		page:not([data-theme="light"]) {
			--color-primary: #3B82F6;
			--color-primary-light: #60A5FA;
			--color-primary-dark: #2563EB;
			--color-primary-bg: rgba(37, 99, 235, 0.15);
			--color-text-primary: #E2E8F0;
			--color-text-secondary: #94A3B8;
			--color-text-muted: #64748B;
			--color-text-placeholder: #475569;
			--color-bg-page: #0B0F19;
			--color-bg-card: #151A2D;
			--color-bg-section: #1A2035;
			--color-bg-input: #1A2035;
			--color-bg-hover: #1E293B;
			--color-border: #1E293B;
			--color-border-light: #1E293B;
			--color-divider: #1E293B;
			--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
			--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
			--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4);
			--shadow-card: 0 2px 12px rgba(0, 0, 0, 0.3);
			background-color: #0B0F19;
			color: #E2E8F0;
		}
	}

	#app {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 100vh;
	}

	.uni-row { display: flex; flex-direction: row; }
	.uni-column { display: flex; flex-direction: column; }

	.text-up { color: var(--color-success) !important; }
	.text-down { color: var(--color-danger) !important; }
	.text-green { color: var(--color-success) !important; }
	.text-red { color: var(--color-danger) !important; }
	.text-muted { color: var(--color-text-muted) !important; }
	.text-primary { color: var(--color-primary) !important; }
	.text-bold { font-weight: 600 !important; }
	.text-center { text-align: center !important; }

	.btn-primary, .save-btn, .submit-btn, .add-btn, .code-btn {
		border-radius: var(--radius-lg) !important;
		transition: opacity 0.15s ease, transform 0.15s ease;
	}
	.btn-primary:active, .save-btn:active, .submit-btn:active, .add-btn:active, .code-btn:active {
		opacity: 0.85;
		transform: scale(0.97);
	}
</style>