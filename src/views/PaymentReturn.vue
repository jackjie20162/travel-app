<template>
  <div class="page-pay-return">
    <!-- 加载中 -->
    <div v-if="loading" class="result-state loading-state">
      <div class="spinner"></div>
      <h2>{{ t('paymentReturn.processing') }}</h2>
      <p class="muted">{{ t('paymentReturn.processingHint') }}</p>
    </div>

    <!-- 支付成功 -->
    <div v-else-if="payment" class="result-state">
      <div class="success-icon">✓</div>
      <h1>{{ t('paymentReturn.success') }}</h1>
      <p class="muted">{{ t('paymentReturn.successHint') }}</p>

      <section class="result-card">
        <div class="result-row">
          <span>{{ t('paymentReturn.paymentNo') }}</span>
          <span class="mono">{{ payment.paymentNo }}</span>
        </div>
        <div class="result-row">
          <span>{{ t('paymentReturn.orderNo') }}</span>
          <span class="mono">{{ payment.orderNo }}</span>
        </div>
        <div class="result-row">
          <span>{{ t('paymentReturn.payMethod') }}</span>
          <span>{{ t('payment.paypal') }}</span>
        </div>
        <div class="result-row total">
          <span>{{ t('paymentReturn.payAmount') }}</span>
          <strong>{{ payAmountText }}</strong>
        </div>
      </section>

      <div class="result-actions">
        <router-link :to="`/order/${payment.orderNo}`" class="btn-primary">{{ t('paymentReturn.viewOrder') }}</router-link>
        <router-link to="/orders" class="btn-secondary">{{ t('paymentReturn.myOrders') }}</router-link>
        <router-link to="/" class="btn-secondary">{{ t('paymentReturn.continueBrowse') }}</router-link>
      </div>
    </div>

    <!-- 支付失败 -->
    <div v-else class="result-state error-state">
      <div class="fail-icon">✕</div>
      <h1>{{ t('paymentReturn.failed') }}</h1>
      <p class="error-msg">{{ errorMsg }}</p>
      <p class="muted">{{ t('paymentReturn.failedHint') }}</p>

      <div class="result-actions">
        <router-link to="/orders" class="btn-primary">{{ t('paymentReturn.viewMyOrders') }}</router-link>
        <router-link to="/" class="btn-secondary">{{ t('paymentReturn.backHome') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { capturePaypalPayment } from '../api.js'
import { useLocale } from '../composables/useLocale.js'

const route = useRoute()
const { t, formatAmount } = useLocale()
const loading = ref(true)
const payment = ref(null)
const errorMsg = ref('')

const payAmountText = computed(() => {
  const p = payment.value
  if (!p) return '--'
  const cur = p.displayCurrency || p.currency
  const amt = p.displayAmount != null ? p.displayAmount : p.amount
  return formatAmount(amt, cur)
})

onMounted(async () => {
  try {
    // PayPal 回调带 token / PayerID / state 等参数，透传给后端完成 capture
    const qs = route.fullPath.split('?')[1] || ''
    const data = await capturePaypalPayment(qs)
    payment.value = data
  } catch (e) {
    errorMsg.value = e.message || t('paymentReturn.confirmFailed')
  } finally {
    loading.value = false
  }
})
</script>
