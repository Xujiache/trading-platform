const BASE_URL = ''
let isRedirectingToLogin = false

type RequestOptions = {
	url : string
	method ?: 'GET' | 'POST' | 'PUT' | 'DELETE'
	data ?: any | null
	header ?: any | null
}

type ApiResult = {
	code : number
	msg : string
	data : any | null
}

export function request(options : RequestOptions) : Promise<ApiResult> {
	return new Promise((resolve, reject) => {
		if (isRedirectingToLogin) {
			reject(new Error('redirecting'))
			return
		}

		const token = uni.getStorageSync('token') as string
		const header = {
			'Content-Type': 'application/json',
			...((options.header != null) ? options.header! : {}),
		} as any
		if (token.length > 0) {
			header['Authorization'] = `Bearer ${token}`
		}

		uni.request({
			url: `${BASE_URL}${options.url}`,
			method: options.method ?? 'GET',
			data: options.data,
			header: header,
			success: (res) => {
				const data = res.data as ApiResult
				if (data.code == 401) {
					uni.removeStorageSync('token')
					uni.removeStorageSync('refreshToken')
					uni.removeStorageSync('userInfo')
					if (!isRedirectingToLogin) {
						isRedirectingToLogin = true
						uni.reLaunch({ url: '/pages/auth/login' })
					}
					reject(new Error(data.msg))
					return
				}
				resolve(data)
			},
			fail: (err) => {
				if (isRedirectingToLogin) {
					reject(new Error('redirecting'))
					return
				}
				uni.showToast({ title: '网络请求失败', icon: 'none' })
				reject(err)
			}
		})
	})
}

export function resetLoginRedirect() {
	isRedirectingToLogin = false
}

export function get(url : string, data ?: any | null) : Promise<ApiResult> {
	return request({ url: url, method: 'GET', data: data })
}

export function post(url : string, data ?: any | null) : Promise<ApiResult> {
	return request({ url: url, method: 'POST', data: data })
}

export function put(url : string, data ?: any | null) : Promise<ApiResult> {
	return request({ url: url, method: 'PUT', data: data })
}

export function del(url : string, data ?: any | null) : Promise<ApiResult> {
	return request({ url: url, method: 'DELETE', data: data })
}
