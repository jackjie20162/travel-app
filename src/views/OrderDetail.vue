<template>
  <div class="page-order-detail">
    <div v-if="loading" class="center">加载中…</div>
    <div v-else-if="!order" class="center empty">订单不存在</div>
    <template v-else>
      <!-- 状态头 -->
      <div class="status-header" :class="order.status">
        <h2>{{ statusText(order.status) }}</h2>
        <p class="mono">{{ order.orderNo }}</p>
      </div>

      <!-- 订单详情 -->
      <section class="detail-section">
        <h3>订单信息</h3>
        <div class="info-row"><span>商品</span><span>{{ order.productTitle || '旅游产品' }}</span></div>
        <div class="info-row"><span>日期</span><span>{{ order.date || '--' }}</span></div>
        <div class="info-row"><span>时段</span><span>{{ order.timeSlot || '--' }}</span></div>
        <div class="info-row"><span>数量</span><span>{{ order.quantity || 1 }}</span></div>
        <div class="info-row total">
          <span>合计</span>
          <strong>{{ order.currency || 'AED' }} {{ formatPrice(order.totalAmount) }}</strong>
        </div>
      </section>

      <!-- 旅客信息 -->
      <section v-if="order.customerEmail" class="detail-section">
        <h3>旅客信息</h3>
        <div class="info-row"><span>邮箱</span><span>{{ order.customerEmail }}</span></div>
      </section>

      <!-- 凭证 -->
      <section v-if="order.status === 'PENDING_VERIFY' || order.status === 'VERIFIED'" class="detail-section">
        <h3>电子凭证</h3>
        <div class="voucher-box">
          <div class="voucher-no">{{ order.voucherNo || order.orderNo }}</div>
          <small>凭此凭证到现场核销</small>
        </div>
      </section>

      <!-- 退款提示 -->
      <section v-if="order.status === 'PENDING_REFUND'" class="detail-section refund-notice">
        <h3>退款申请中</h3>
        <p>您的退款申请已提交，等待商户处理。</p>
        <p v-if="order.rejectReason" class="muted">商户回复：{{ order.rejectReason }}</p>
      </section>

      <!-- 评价 -->
      <section v-if="order.status === 'COMPLETED'" class="detail-section">
        <h3>订单评价</h3>
        <div v-if="existingReview" class="review-display">
          <div class="review-stars-row">
            <span v-for="n in 5" :key="n" class="star" :class="{ active: existingReview.rating >= n }">★</span>
            <span class="review-date">{{ formatDate(existingReview.createtime) }}</span>
          </div>
          <p v-if="existingReview.content" class="review-text">{{ existingReview.content }}</p>
          <div v-if="existingReview.replyContent" class="review-merchant-reply">
            <strong>商家回复：</strong>{{ existingReview.replyContent }}
          </div>
        </div>
        <div v-else class="review-prompt">
          <p>您对这次旅行满意吗？快来分享您的体验吧！</p>
          <router-link :to="`/order/${order.orderNo}/review`" class="btn-review">写评价</router-link>
        </div>
      </section>

      <!-- 操作 -->
      <div class="detail-actions">
        <button v-if="canCancel" class="btn-danger" @click="showCancelDialog">取消订单</button>
        <button v-if="canRequestRefund" class="btn-warning" @click="showRefundDialog">申请退款</button>
        <router-link to="/orders" class="btn-secondary">返回订单列表</router-link>
        <router-link to="/" class="btn-primary">继续浏览</router-link>
      </div>
    </template>

    <!-- 取消订单对话框 -->
    <div v-if="cancelDialogVisible" class="modal-overlay" @click.self="cancelDialogVisible = false">
      <div class="modal">
        <h3>取消订单</h3>
        <p class="muted" style="margin-bottom:12px;font-size:13px">取消后订单将变为已取消状态，款项将原路退回。</p>
        <label>取消原因
          <textarea v-model="cancelReason" rows="3" placeholder="请输入取消原因" style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;outline:none;margin-top:4px;font-family:inherit;resize:vertical"></textarea>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="cancelDialogVisible = false">返回</button>
          <button class="btn-danger" :disabled="!cancelReason.trim() || cancelling" @click="handleCancel">确认取消</button>
        </div>
      </div>
    </div>

    <!-- 申请退款对话框 -->
    <div v-if="refundDialogVisible" class="modal-overlay" @click.self="refundDialogVisible = false">
      <div class="modal">
        <h3>申请退款</h3>
        <p class="muted" style="margin-bottom:12px;font-size:13px">退款申请提交后需等待商户审批。</p>
        <label>退款原因
          <textarea v-model="refundReason" rows="3" placeholder="请说明退款原因" style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;outline:none;margin-top:4px;font-family:inherit;resize:vertical"></textarea>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="refundDialogVisible = false">返回</button>
          <button class="btn-warning" :disabled="!refundReason.trim() || requestingRefund" @click="handleRequestRefund">提交申请</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder, getOrderReview, requestRefund, cancelOrder } from '../api.js'

const route = useRoute()
const order = ref(null)
const loading = ref(true)
const existingReview = ref(null)
const cancelDialogVisible = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)
const refundDialogVisible = ref(false)
const refundReason = ref('')
const requestingRefund = ref(false)

function statusText(s) {
  const map = {
    PENDING_PAYMENT: '待支付',
    PAYMENT_PROCESSING: '支付处理中',
    PENDING_ACCEPTANCE: '待接单',
    PENDING_VERIFY: '待核销',
    VERIFIED: '已核销',
    PENDING_REFUND: '退款中',
    CONFIRMED: '已确认',
    CANCELLED: '已取消',
    COMPLETED: '已完成',
    REFUNDED: '已退款',
  }
  return map[s] || s || '未知'
}

function formatPrice(v) {
  if (v == null) return '--'
  return String(v)
}

async function loadOrder() {
  loading.value = true
  try {
    const data = await getOrder(route.params.orderNo)
    order.value = data
    // Load review if completed
    if (data.status === 'COMPLETED') {
      loadReview()
    }
  } catch (e) {
    console.error('加载订单失败', e)
    // 尝试从本地存储读取
    try {
      const cached = JSON.parse(localStorage.getItem('travel_orders') || '[]')
      order.value = cached.find(o => o.orderNo === route.params.orderNo) || null
    } catch {
      order.value = null
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)

async function loadReview() {
  try {
    const resp = await getOrderReview(route.params.orderNo)
    if (resp && resp.id) {
      existingReview.value = resp
    }
  } catch {
    // No review yet
  }
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString()
}

// 待支付状态可取消
const canCancel = computed(() => {
  return order.value?.status === 'PENDING_PAYMENT'
})

// 待接单/待核销状态可申请退款
const canRequestRefund = computed(() => {
  const s = order.value?.status
  return s === 'PENDING_ACCEPTANCE' || s === 'PENDING_VERIFY'
})

function showCancelDialog() {
  cancelReason.value = ''
  cancelDialogVisible.value = true
}

async function handleCancel() {
  if (!cancelReason.value.trim()) return
  cancelling.value = true
  try {
    await cancelOrder(route.params.orderNo)
    cancelDialogVisible.value = false
    alert('订单已取消')
    await loadOrder()
  } catch (e) {
    alert(e.message || '取消失败')
  } finally {
    cancelling.value = false
  }
}

function showRefundDialog() {
  refundReason.value = ''
  refundDialogVisible.value = true
}

async function handleRequestRefund() {
  if (!refundReason.value.trim()) return
  requestingRefund.value = true
  try {
    await requestRefund(route.params.orderNo, refundReason.value)
    refundDialogVisible.value = false
    alert('退款申请已提交，请等待商户处理')
    await loadOrder()
  } catch (e) {
    alert(e.message || '申请失败')
  } finally {
    requestingRefund.value = false
  }
}
</script>
