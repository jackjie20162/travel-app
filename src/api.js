/**
 * Travel API 封装层
 * 对应 travel-api REST 端点：商品、库存、订单、支付
 *
 * 开发环境通过 vite proxy 转发到 travel-api:9206，无需跨域。
 * 所有请求自动携带 X-Tenant-ID / X-Merchant-ID 租户上下文头。
 */

const STORAGE_TENANT = 'travel_tenant_id'
const STORAGE_MERCHANT = 'travel_merchant_id'
const STORAGE_TOKEN = 'travel_user_token'
const STORAGE_USER = 'travel_user_info'

/** 获取当前租户 ID（默认 1，可在"我的 → 设置"中修改） */
export function getTenantId() {
  return localStorage.getItem(STORAGE_TENANT) || '1'
}

/** 获取当前商户 ID（默认 1） */
export function getMerchantId() {
  return localStorage.getItem(STORAGE_MERCHANT) || '1'
}

export function setTenantId(id) {
  localStorage.setItem(STORAGE_TENANT, id)
}

export function setMerchantId(id) {
  localStorage.setItem(STORAGE_MERCHANT, id)
}

/**
 * 统一请求函数
 * - 使用相对路径，由 vite proxy 转发到 travel-api
 * - 自动注入租户/商户上下文头
 */
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': getTenantId(),
    'X-Merchant-ID': getMerchantId(),
    ...options.headers,
  }
  // Attach Bearer token if user is logged in
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(path, { ...options, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

/* ── 商品（消费者公开接口） ── */

export function getProducts({ keyword, destination, page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (destination) params.set('destination', destination)
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  const qs = params.toString()
  return request(`/api/travel/products${qs ? '?' + qs : ''}`)
}

export function getProductDetail(id) {
  return request(`/api/travel/products/${id}`)
}

export function getProductPackages(productId) {
  return request(`/api/travel/products/${productId}/packages`)
}

/* ── 库存 ── */

export function checkInventory({ packageId, date, timeSlot, quantity }) {
  return request('/api/travel/inventory/check', {
    method: 'POST',
    body: JSON.stringify({ packageId, date, timeSlot: timeSlot || '', quantity }),
  })
}

/** 批量查询某套餐在某日期范围内的库存（用于日历展示） */
export function batchInventory({ packageId, startDate, endDate }) {
  const params = new URLSearchParams({ startDate, endDate })
  return request(`/api/travel/inventory/packages/${packageId}/batch?${params}`)
}

/* ── 订单 ── */

export function createOrder(payload) {
  return request('/api/travel/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getOrder(orderNo) {
  return request(`/api/travel/orders/${orderNo}`)
}

export function getMyOrders({ status, page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  const qs = params.toString()
  return request(`/api/travel/my/orders${qs ? '?' + qs : ''}`)
}

export function requestRefund(orderNo, reason) {
  return request(`/api/travel/my/orders/${orderNo}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function cancelOrder(orderNo) {
  return request(`/api/travel/my/orders/${orderNo}/cancel`, {
    method: 'POST',
  })
}

/* ── 评价 ── */

export function createReview(payload) {
  return request('/api/travel/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getProductReviews(productId, { page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return request(`/api/travel/products/${productId}/reviews?${params}`)
}

export function getOrderReview(orderNo) {
  return request(`/api/travel/my/orders/${orderNo}/review`)
}

/* ── 支付 ── */

export function createPayment({ orderNo, provider, idempotencyKey }) {
  return request('/api/travel/payments', {
    method: 'POST',
    body: JSON.stringify({ orderNo, provider, idempotencyKey }),
  })
}

export function getPayment(paymentNo) {
  return request(`/api/travel/payments/${paymentNo}`)
}

/** PayPal 支付回调：将 URL 查询参数透传给后端完成 capture */
export function capturePaypalPayment(queryString) {
  return request(`/api/travel/payments/paypal/return${queryString ? '?' + queryString : ''}`)
}

/* ── 用户认证 ── */

export function getToken() {
  return localStorage.getItem(STORAGE_TOKEN) || ''
}

export function setToken(token) {
  localStorage.setItem(STORAGE_TOKEN, token)
}

export function clearToken() {
  localStorage.removeItem(STORAGE_TOKEN)
  localStorage.removeItem(STORAGE_USER)
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  localStorage.setItem(STORAGE_USER, JSON.stringify(user))
}

export function register({ username, password, email, mobile, nickname }) {
  return request('/api/travel/user/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email, mobile, nickname }),
  })
}

export function login({ username, password }) {
  return request('/api/travel/user/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function loginByMobile({ mobile, password }) {
  return request('/api/travel/user/login-mobile', {
    method: 'POST',
    body: JSON.stringify({ mobile, password }),
  })
}

export function getProfile() {
  return request('/api/travel/user/profile')
}

export function updateProfile(payload) {
  return request('/api/travel/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function changePassword({ oldPassword, newPassword }) {
  return request('/api/travel/user/password', {
    method: 'PUT',
    body: JSON.stringify({ oldPassword, newPassword }),
  })
}

export function logout() {
  clearToken()
}
