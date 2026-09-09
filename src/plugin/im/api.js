// 旅行 App 端 IM：客户身份解析与 WebSocket 接入地址
// 客户以 user_type=3 接入，biz_uid 取登录用户 id；咨询对象为商户客服（user_type=2）。
import { getMerchantId, getStoredUser } from '../../api.js'
import { useUser } from '../../composables/user.js'

// IM 用户身份类型（与 im-common/constant 保持一致）
export const IM_USER_TYPE = {
  ADMIN: 1,
  MERCHANT: 2,
  CLIENT: 3,
}

// 客户 IM 身份：user_type=3，biz_uid 取当前登录用户 id
export function getImIdentity() {
  const { currentUser } = useUser()
  const id = currentUser.value?.id ?? getStoredUser()?.id ?? 0
  return { userType: IM_USER_TYPE.CLIENT, bizUid: Number(id) }
}

// 咨询对象：商户客服，biz_uid 取当前商户 ID
export function getSupportTarget() {
  return { toType: IM_USER_TYPE.MERCHANT, toBizUid: Number(getMerchantId() || 0) }
}

// IM 网关 WebSocket 基址（默认本地 9281，生产用 VITE_IM_WS_URL 覆盖）
export function getImWsBase() {
  return import.meta.env.VITE_IM_WS_URL || 'ws://127.0.0.1:9281/ws'
}

// 拼接鉴权 query：浏览器 WebSocket 无法自定义 Header，用 query 传身份
export function buildImWsUrl() {
  const { userType, bizUid } = getImIdentity()
  const base = getImWsBase()
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}user_type=${userType}&biz_uid=${bizUid}`
}

// 归一化会话对象：后端 snake_case -> 前端 camelCase
export function normalizeSession(s) {
  return {
    sessionId: s.session_id,
    peerImUid: s.peer_im_uid,
    peerType: s.peer_type,
    peerBizUid: s.peer_biz_uid,
    lastContent: s.last_content || '',
    lastSeq: s.last_seq || 0,
    lastTime: s.last_time || 0,
    unread: s.unread || 0,
  }
}
