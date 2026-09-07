/**
 * 用户认证状态管理 composable
 * 提供登录状态、用户信息、登录/登出操作，跨组件共享。
 */
import { ref, computed } from 'vue'
import {
  getToken, setToken, clearToken,
  getStoredUser, setStoredUser,
  login as apiLogin,
  register as apiRegister,
  getProfile as apiGetProfile,
  logout as apiLogout,
  getCaptcha as apiGetCaptcha,
  sendEmailCode as apiSendEmailCode,
} from '../api.js'

// 全局响应式状态（模块级单例，所有组件共享同一份）
const currentUser = ref(getStoredUser())
const authToken = ref(getToken())

export function useUser() {
  const isLoggedIn = computed(() => !!authToken.value)
  const username = computed(() => currentUser.value?.username || '')
  const nickname = computed(() => currentUser.value?.nickname || username.value)
  const avatar = computed(() => currentUser.value?.avatar || '')

  async function login({ email, captchaId, captchaAnswer, emailCode }) {
    const resp = await apiLogin({ email, captchaId, captchaAnswer, emailCode })
    const data = resp.data || resp
    if (!data.token) {
      throw new Error('登录失败：未返回有效凭证')
    }
    authToken.value = data.token
    currentUser.value = data.user
    setToken(data.token)
    setStoredUser(data.user)
    return data
  }

  async function register({ username, password, email, mobile, nickname, captchaId, captchaAnswer, emailCode }) {
    const resp = await apiRegister({ username, password, email, mobile, nickname, captchaId, captchaAnswer, emailCode })
    const data = resp.data || resp
    if (!data.token) {
      throw new Error('注册失败：未返回有效凭证')
    }
    authToken.value = data.token
    currentUser.value = data.user
    setToken(data.token)
    setStoredUser(data.user)
    return data
  }

  async function fetchCaptcha() {
    return apiGetCaptcha()
  }

  async function sendEmailCode(payload) {
    return apiSendEmailCode(payload)
  }

  async function fetchProfile() {
    try {
      const resp = await apiGetProfile()
      const data = resp.data || resp
      currentUser.value = data
      setStoredUser(data)
      return data
    } catch (e) {
      // Only logout on 401/403, not on network errors
      if (e.message && (e.message.includes('401') || e.message.includes('403'))) {
        logout()
      }
      throw e
    }
  }

  function logout() {
    authToken.value = ''
    currentUser.value = null
    apiLogout()
  }

  return {
    currentUser,
    authToken,
    isLoggedIn,
    username,
    nickname,
    avatar,
    login,
    register,
    fetchProfile,
    logout,
    fetchCaptcha,
    sendEmailCode,
  }
}
