<template>
  <div class="page-support">
    <div class="support-bar">
      <span class="support-title">在线客服</span>
      <span class="conn-pill" :class="status">{{ statusText }}</span>
    </div>

    <!-- 咨询商品上下文：从商品详情“问客服”带入 -->
    <div v-if="consultProduct" class="consult-bar" @click="openProduct(consultProduct)">
      <img v-if="consultProduct.coverImage" :src="consultProduct.coverImage" class="cb-cover" alt="" />
      <div v-else class="cb-cover cb-cover-ph">🏙️</div>
      <div class="cb-info">
        <div class="cb-label">正在咨询</div>
        <div class="cb-name">{{ consultProduct.title }}</div>
      </div>
      <span v-if="consultProduct.minPrice" class="cb-price">¥{{ consultProduct.minPrice }}起</span>
    </div>

    <div ref="scrollEl" class="chat-scroll">
      <div v-if="hasMore" class="load-more">
        <button class="more-btn" :disabled="loadingHistory" @click="onLoadMore">
          {{ loadingHistory ? '加载中…' : '查看更早消息' }}
        </button>
      </div>

      <div v-if="!messages.length" class="chat-hint">
        <p>向 Global Dubai 客服发起咨询</p>
        <small class="muted">输入您的问题即可开始，我们会尽快回复</small>
      </div>

      <div
        v-for="(m, i) in messages"
        :key="m.msgId || `${m.seq}_${m.time}_${i}`"
        class="msg"
        :class="isOutgoing(m) ? 'out' : 'in'"
      >
        <div class="bubble" :class="{ plain: msgType(m) !== CONTENT_TYPE.TEXT }">
          <!-- 图片消息 -->
          <img
            v-if="msgType(m) === CONTENT_TYPE.IMAGE"
            :src="m.content"
            class="bubble-img"
            alt="图片"
            @click="previewImg(m.content)"
          />
          <!-- 商品卡片消息 -->
          <div v-else-if="msgType(m) === CONTENT_TYPE.PRODUCT" class="product-card" @click="goProduct(m)">
            <img v-if="productOf(m).cover" :src="productOf(m).cover" class="pc-cover" alt="" />
            <div v-else class="pc-cover pc-cover-ph">🏙️</div>
            <div class="pc-info">
              <div class="pc-name">{{ productOf(m).name || '商品' }}</div>
              <div v-if="productOf(m).price" class="pc-price">¥{{ productOf(m).price }} 起</div>
              <div class="pc-hint">点击查看商品 ›</div>
            </div>
          </div>
          <!-- 文本消息 -->
          <div v-else class="bubble-text">{{ m.content }}</div>
          <div class="bubble-time">{{ formatClock(m.time) }}</div>
        </div>
      </div>
    </div>

    <div class="chat-composer">
      <label class="img-btn" :class="{ disabled: uploading || !connected }" title="发送图片">
        <input type="file" accept="image/*" :disabled="uploading || !connected" @change="onPickImage" style="display:none" />
        <span>{{ uploading ? '⏳' : '🖼️' }}</span>
      </label>
      <textarea
        v-model="draft"
        class="composer-input"
        rows="1"
        placeholder="输入消息…"
        @keydown.enter.exact.prevent="onSend"
      ></textarea>
      <button class="send-btn" :disabled="!canSend" @click="onSend">发送</button>
    </div>

    <!-- 图片全屏预览 -->
    <div v-if="previewUrl" class="img-preview" @click="previewUrl = ''">
      <img :src="previewUrl" alt="预览" />
    </div>

    <div v-if="toast" class="error-toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ImClient } from './imClient'
import {
  buildImWsUrl,
  getImIdentity,
  getSupportTarget,
  normalizeSession,
  CONTENT_TYPE,
  uploadImage,
  buildProductContent,
  parseProductContent,
} from './api'
import { getProductDetail } from '../../api.js'
import { useUser } from '../../composables/user.js'
import { formatClock } from './format'

const route = useRoute()
const router = useRouter()
const user = useUser()

const status = ref('connecting') // connecting | online | offline | error
const messages = ref([]) // 单会话消息（升序）
const session = ref(null) // 商户客服会话（首次收/发后绑定）
const draft = ref('')
const hasMore = ref(false)
const loadingHistory = ref(false)
const scrollEl = ref(null)
const toast = ref('')
const consultProduct = ref(null) // 从商品详情带入的咨询商品
const uploading = ref(false)
const previewUrl = ref('')

let pendingLoadMore = false
let productCardSent = false
let client = null

const connected = computed(() => status.value === 'online')
const statusText = computed(
  () =>
    ({ connecting: '连接中…', online: '已连接', offline: '已断开', error: '连接异常' })[
      status.value
    ] || status.value,
)
const canSend = computed(() => connected.value && draft.value.trim().length > 0)

function msgType(m) {
  return m.contentType || CONTENT_TYPE.TEXT
}
function productOf(m) {
  return parseProductContent(m.content) || {}
}
function goProduct(m) {
  const p = productOf(m)
  if (p.productId) router.push(`/product/${p.productId}`)
}
function openProduct(p) {
  if (p?.id) router.push(`/product/${p.id}`)
}
function previewImg(url) {
  previewUrl.value = url
}
function showToast(msg) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 2500)
}

function buildHandlers() {
  return {
    onStatus: (s) => {
      status.value = s
      if (s === 'online') client.loadSessions()
    },
    onSessions: (list) => {
      // 取商户客服会话（peer_type=2）
      const merchant = (list || []).map(normalizeSession).find((x) => x.peerType === 2)
      if (merchant && !session.value) {
        session.value = merchant
        if (!messages.value.length) loadHistory(merchant.sessionId, 0)
      }
      // 带商品上下文进入：自动发送一次商品卡片，确保商户看到咨询的商品
      if (consultProduct.value && !productCardSent) {
        sendProductCard(consultProduct.value)
      }
    },
    onHistory: ({ sessionId, list, hasMore: more }) => {
      if (session.value && sessionId !== session.value.sessionId) return
      if (pendingLoadMore) {
        messages.value = dedupMerge(list, messages.value)
      } else {
        messages.value = dedupMerge(messages.value, list)
      }
      hasMore.value = more
      loadingHistory.value = false
    },
    onMessage: (m) => {
      bindSessionFromMsg(m)
      messages.value = dedupMerge(messages.value, [m])
      client.ack(m.msgId)
    },
    onOffline: (list) => {
      list.forEach((m) => {
        bindSessionFromMsg(m)
        client.ack(m.msgId)
      })
      messages.value = dedupMerge(messages.value, list)
    },
    onError: (msg) => showToast(msg),
  }
}

// 收到对端消息时，用其身份绑定会话（用于后续发送寻址与收发方向判定）
function bindSessionFromMsg(m) {
  if (session.value || !m.sessionId) return
  session.value = {
    sessionId: m.sessionId,
    peerImUid: m.fromUid,
    peerType: m.fromType || 2,
    peerBizUid: m.fromBizUid || 0,
  }
}

function loadHistory(sessionId, beforeSeq) {
  if (!connected.value) return
  pendingLoadMore = beforeSeq > 0
  loadingHistory.value = true
  client.loadHistory(sessionId, beforeSeq)
}

function onLoadMore() {
  if (!session.value || !messages.value.length) return
  loadHistory(session.value.sessionId, messages.value[0].seq)
}

// 乐观消息序号：在当前会话最大 seq 上递增，使新发消息按序排在已有消息之后；
// 若与在途收到消息的服务端 seq 撞号，dedupMerge 会回退比较发送时间，仍保证时间顺序
function nextOptimisticSeq() {
  let max = 0
  for (const m of messages.value) if (m.seq > max) max = m.seq
  return max + 1
}

// 统一发送入口：寻址（已绑定会话用 im_uid，否则用商户业务身份）+ 乐观追加
function sendChatMessage(content, contentType) {
  if (!connected.value) return
  if (session.value) {
    client.sendChat({ to: session.value.peerImUid, content, contentType })
  } else {
    const { toType, toBizUid } = getSupportTarget()
    client.sendChat({ toType, toBizUid, content, contentType })
  }
  messages.value = dedupMerge(messages.value, [
    {
      msgId: '',
      sessionId: session.value?.sessionId || '',
      fromUid: '',
      toUid: session.value?.peerImUid || '',
      content,
      contentType,
      seq: nextOptimisticSeq(),
      time: Date.now(),
    },
  ])
}

function onSend() {
  const text = draft.value.trim()
  if (!text || !connected.value) return
  sendChatMessage(text, CONTENT_TYPE.TEXT)
  draft.value = ''
}

function sendProductCard(p) {
  if (!p || productCardSent) return
  productCardSent = true
  sendChatMessage(buildProductContent(p), CONTENT_TYPE.PRODUCT)
}

async function onPickImage(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (!connected.value) {
    showToast('未连接，无法发送图片')
    return
  }
  uploading.value = true
  try {
    const url = await uploadImage(file)
    sendChatMessage(url, CONTENT_TYPE.IMAGE)
  } catch (err) {
    showToast(err.message || '图片上传失败')
  } finally {
    uploading.value = false
  }
}

// 对端 im_uid 之外即为本人发出（含本地乐观消息 fromUid 空串）
function isOutgoing(m) {
  return !session.value || m.fromUid !== session.value.peerImUid
}

// 合并去重并按 seq/time 升序
function dedupMerge(a, b) {
  const seen = new Set()
  const out = []
  for (const m of [...(a || []), ...(b || [])]) {
    const key = m.msgId || `${m.seq}_${m.time}_${m.content}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }
  out.sort((x, y) => x.seq - y.seq || x.time - y.time)
  return out
}

async function scrollToBottom() {
  await nextTick()
  const el = scrollEl.value
  if (el) el.scrollTop = el.scrollHeight
}
watch(() => messages.value.length, scrollToBottom)

onMounted(async () => {
  // 确保拿到用户 id 作为 biz_uid
  if (user.isLoggedIn.value && !user.currentUser.value?.id) {
    try {
      await user.fetchProfile()
    } catch {
      /* 忽略，使用缓存身份 */
    }
  }
  const { bizUid } = getImIdentity()
  if (!bizUid) {
    status.value = 'error'
    showToast('未获取到用户身份，请重新登录')
    return
  }
  // 加载咨询商品上下文（从商品详情“问客服”带入）
  const productId = route.query.productId
  if (productId) {
    try {
      consultProduct.value = await getProductDetail(productId)
    } catch {
      /* 商品加载失败不阻塞客服会话 */
    }
  }
  client = new ImClient(buildImWsUrl, buildHandlers())
  client.connect()
})

onUnmounted(() => client && client.close())
</script>

<style scoped>
.page-support {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 52px);
  background: #f5f6fa;
}
.support-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.support-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}
.conn-pill {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #94a3b8;
}
.conn-pill.online {
  background: #ecfdf5;
  color: #059669;
}
.conn-pill.error {
  background: #fee2e2;
  color: #dc2626;
}
/* 咨询商品条 */
.consult-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: #fff8f2;
  border-bottom: 1px solid #ffe0c7;
  cursor: pointer;
}
.cb-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f2f6ff;
}
.cb-cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.cb-info {
  flex: 1;
  min-width: 0;
}
.cb-label {
  font-size: 11px;
  color: #ff6600;
}
.cb-name {
  font-size: 13px;
  color: #1a1a2e;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cb-price {
  font-size: 13px;
  color: #ff4400;
  font-weight: 600;
  flex-shrink: 0;
}
.chat-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}
.load-more {
  text-align: center;
  margin-bottom: 12px;
}
.more-btn {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
}
.more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.chat-hint {
  text-align: center;
  padding: 48px 16px;
  color: #64748b;
}
.chat-hint p {
  font-size: 15px;
  margin-bottom: 6px;
}
.msg {
  display: flex;
  margin-bottom: 12px;
}
.msg.in {
  justify-content: flex-start;
}
.msg.out {
  justify-content: flex-end;
}
.bubble {
  max-width: 74%;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #eee;
}
.msg.out .bubble {
  background: #1a1a2e;
  border-color: #1a1a2e;
}
/* 图片/商品卡片消息：气泡透明，仅承载内容 */
.bubble.plain,
.msg.out .bubble.plain {
  background: transparent;
  border: none;
  padding: 0;
}
.bubble-text {
  font-size: 14px;
  color: #1a1a2e;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}
.msg.out .bubble-text {
  color: #fff;
}
.bubble-img {
  max-width: 200px;
  max-height: 260px;
  border-radius: 10px;
  display: block;
  cursor: pointer;
  object-fit: cover;
  background: #eef1f6;
}
.product-card {
  display: flex;
  gap: 10px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 10px;
  width: 240px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.pc-cover {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f2f6ff;
}
.pc-cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.pc-info {
  flex: 1;
  min-width: 0;
}
.pc-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.pc-price {
  font-size: 14px;
  color: #ff4400;
  font-weight: 600;
  margin-top: 4px;
}
.pc-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}
.bubble-time {
  margin-top: 4px;
  font-size: 10px;
  color: #94a3b8;
  text-align: right;
}
.msg.out .bubble-time {
  color: rgba(255, 255, 255, 0.6);
}
.bubble.plain .bubble-time,
.msg.out .bubble.plain .bubble-time {
  color: #94a3b8;
}
.chat-composer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #eee;
}
.img-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border-radius: 10px;
  background: #f1f5f9;
}
.img-btn:active {
  background: #e2e8f0;
}
.img-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.composer-input {
  flex: 1;
  resize: none;
  max-height: 96px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  line-height: 1.4;
}
.composer-input:focus {
  border-color: #1a1a2e;
}
.send-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg, #ff6600, #ff4400);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.img-preview {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.img-preview img {
  max-width: 92%;
  max-height: 88%;
  object-fit: contain;
}
</style>
