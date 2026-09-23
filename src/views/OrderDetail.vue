<template>
  <div class="page-order-detail">
    <div v-if="loading" class="center">{{ t('common.loading') }}</div>
    <div v-else-if="!order" class="center empty">{{ t('order.notFound') }}</div>
    <template v-else>
      <!-- 状态头 -->
      <div class="status-header" :class="order.status">
        <h2>{{ statusText(order.status) }}</h2>
        <p class="mono">{{ order.orderNo }}</p>
      </div>

      <!-- 订单详情 -->
      <section class="detail-section">
        <h3>{{ t('order.orderInfo') }}</h3>
        <div class="info-row"><span>{{ t('order.labelProduct') }}</span><span>{{ order.productTitle || t('order.defaultProduct') }}</span></div>
        <div class="info-row"><span>{{ t('order.labelDate') }}</span><span>{{ order.date || '--' }}</span></div>
        <div class="info-row"><span>{{ t('order.labelTimeSlot') }}</span><span>{{ order.timeSlot || '--' }}</span></div>
        <div class="info-row"><span>{{ t('order.labelQuantity') }}</span><span>{{ order.quantity || 1 }}</span></div>
        <div class="info-row total">
          <span>{{ t('order.labelTotal') }}</span>
          <strong>{{ orderAmount(order) }}</strong>
        </div>
      </section>

      <!-- 旅客信息 -->
      <section v-if="order.customerEmail" class="detail-section">
        <h3>{{ t('order.travelerInfo') }}</h3>
        <div class="info-row"><span>{{ t('order.email') }}</span><span>{{ order.customerEmail }}</span></div>
      </section>

      <!-- 凭证 -->
      <section v-if="order.status === 'PENDING_VERIFY' || order.status === 'VERIFIED'" class="detail-section">
        <h3>{{ t('order.voucher') }}</h3>
        <div class="voucher-box">
          <div class="voucher-no">{{ order.voucherNo || order.orderNo }}</div>
          <small>{{ t('order.voucherHint') }}</small>
        </div>
      </section>

      <!-- 退款提示 -->
      <section v-if="order.status === 'PENDING_REFUND'" class="detail-section refund-notice">
        <h3>{{ t('order.refundPending') }}</h3>
        <p>{{ t('order.refundPendingDesc') }}</p>
        <p v-if="order.rejectReason" class="muted">{{ t('order.merchantReplyLabel') }}{{ order.rejectReason }}</p>
      </section>

      <!-- 评价 -->
      <section v-if="order.status === 'COMPLETED'" class="detail-section">
        <h3>{{ t('order.reviewSection') }}</h3>
        <div v-if="existingReview" class="review-display">
          <div class="review-stars-row">
            <span v-for="n in 5" :key="n" class="star" :class="{ active: existingReview.rating >= n }">★</span>
            <span class="review-date">{{ formatDate(existingReview.createtime) }}</span>
          </div>
          <p v-if="existingReview.content" class="review-text">{{ existingReview.content }}</p>
          <div v-if="existingReview.replyContent" class="review-merchant-reply">
            <strong>{{ t('product.merchantReply') }}</strong>{{ existingReview.replyContent }}
          </div>
        </div>
        <div v-else class="review-prompt">
          <p>{{ t('order.reviewPrompt') }}</p>
          <router-link :to="`/order/${order.orderNo}/review`" class="btn-review">{{ t('order.writeReview') }}</router-link>
        </div>
      </section>

      <!-- 操作 -->
      <div class="detail-actions">
        <button v-if="canCancel" class="btn-danger" @click="showCancelDialog">{{ t('order.cancelOrder') }}</button>
        <button v-if="canRequestRefund" class="btn-warning" @click="showRefundDialog">{{ t('order.requestRefund') }}</button>
        <router-link to="/orders" class="btn-secondary">{{ t('order.backToList') }}</router-link>
        <router-link :to="{ path: '/support', query: { orderNo: order.orderNo } }" class="btn-secondary">{{ t('order.consultOrder') }}</router-link>
        <router-link to="/" class="btn-primary">{{ t('order.continueBrowse') }}</router-link>
      </div>
    </template>

    <!-- 取消订单对话框 -->
    <div v-if="cancelDialogVisible" class="modal-overlay" @click.self="cancelDialogVisible = false">
      <div class="modal">
        <h3>{{ t('order.cancelTitle') }}</h3>
        <p class="muted" style="margin-bottom:12px;font-size:13px">{{ t('order.cancelHint') }}</p>
        <label>{{ t('order.cancelReason') }}
          <textarea v-model="cancelReason" rows="3" :placeholder="t('order.cancelReasonPh')" style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;outline:none;margin-top:4px;font-family:inherit;resize:vertical"></textarea>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="cancelDialogVisible = false">{{ t('common.back') }}</button>
          <button class="btn-danger" :disabled="!cancelReason.trim() || cancelling" @click="handleCancel">{{ t('order.confirmCancel') }}</button>
        </div>
      </div>
    </div>

    <!-- 申请退款对话框 -->
    <div v-if="refundDialogVisible" class="modal-overlay" @click.self="refundDialogVisible = false">
      <div class="modal">
        <h3>{{ t('order.refundTitle') }}</h3>
        <p class="muted" style="margin-bottom:12px;font-size:13px">{{ t('order.refundHint') }}</p>
        <label>{{ t('order.refundReason') }}
          <textarea v-model="refundReason" rows="3" :placeholder="t('order.refundReasonPh')" style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;outline:none;margin-top:4px;font-family:inherit;resize:vertical"></textarea>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="refundDialogVisible = false">{{ t('common.back') }}</button>
          <button class="btn-warning" :disabled="!refundReason.trim() || requestingRefund" @click="handleRequestRefund">{{ t('order.submitRequest') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder, getOrderReview, requestRefund, cancelOrder } from '../api.js'
import { useLocale } from '../composables/useLocale.js'

const route = useRoute()
const { t, te, formatPrice, formatAmount } = useLocale()
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
  if (!s) return t('status.UNKNOWN')
  return te('status.' + s) ? t('status.' + s) : s
}

/** 优先展示下单锁定的金额/币种；无锁定值时按当前币种换算基准金额。 */
function orderAmount(o) {
  if (o && o.displayAmount != null && o.displayCurrency) {
    return formatAmount(o.displayAmount, o.displayCurrency)
  }
  return formatPrice(o?.totalAmount)
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
    alert(t('order.cancelled'))
    await loadOrder()
  } catch (e) {
    alert(e.message || t('order.cancelFailed'))
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
    alert(t('order.refundSubmitted'))
    await loadOrder()
  } catch (e) {
    alert(e.message || t('order.refundFailed'))
  } finally {
    requestingRefund.value = false
  }
}
</script>
