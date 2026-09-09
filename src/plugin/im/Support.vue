<template>
  <div class="page-support">
    <div class="support-bar">
      <span class="support-title">在线客服</span>
      <span class="conn-pill" :class="status">{{ statusText }}</span>
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
        <div class="bubble">
          <div class="bubble-text">{{ m.content }}</div>
          <div class="bubble-time">{{ formatClock(m.time) }}</div>
        </div>
      </div>
    </div>

    <div class="chat-composer">
      <textarea
        v-model="draft"
        class="composer-input"
        rows="1"
        placeholder="输入消息…"
        @keydown.enter.exact.prevent="onSend"
      ></textarea>
      <button class="send-btn" :disabled="!canSend" @click="onSend">发送</button>
    </div>

    <div v-if="toast" class="error-toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ImClient } from './imClient'
import { buildImWsUrl, getImIdentity, getSupportTarget, normalizeSession } from './api'
import { useUser } from '../../composables/user.js'
import { formatClock } from './format'

const user = useUser()

const status = ref('connecting') // connecting | online | offline | error
const messages = ref([]) // 单会话消息（升序）
const session = ref(null) // 商户客服会话（首次收/发后绑定）
const draft = ref('')
const hasMore = ref(false)
const loadingHistory = ref(false)
const scrollEl = ref(null)
const toast = ref('')

let pendingLoadMore = false
let client = null

const connected = computed(() => status.value === 'online')
const statusText = computed(
  () =>
    ({ connecting: '连接中…', online: '已连接', offline: '已断开', error: '连接异常' })[
      status.value
    ] || status.value,
)
const canSend = computed(() => connected.value && draft.value.trim().length > 0)

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
    onError: (msg) => {
      toast.value = msg
      setTimeout(() => (toast.value = ''), 2500)
    },
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

function onSend() {
  const text = draft.value.trim()
  if (!text || !connected.value) return
  if (session.value) {
    client.sendChat({ to: session.value.peerImUid, content: text })
  } else {
    const { toType, toBizUid } = getSupportTarget()
    client.sendChat({ toType, toBizUid, content: text })
  }
  // 乐观追加本人消息（fromUid=0，据此判为发出）
  messages.value = dedupMerge(messages.value, [
    { msgId: '', sessionId: session.value?.sessionId || '', fromUid: 0, toUid: session.value?.peerImUid || 0, content: text, seq: 0, time: Date.now() },
  ])
  draft.value = ''
}

// 对端 im_uid 之外即为本人发出（含本地乐观消息 fromUid=0）
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
    toast.value = '未获取到用户身份，请重新登录'
    return
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
.bubble-time {
  margin-top: 4px;
  font-size: 10px;
  color: #94a3b8;
  text-align: right;
}
.msg.out .bubble-time {
  color: rgba(255, 255, 255, 0.6);
}
.chat-composer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #eee;
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
</style>
