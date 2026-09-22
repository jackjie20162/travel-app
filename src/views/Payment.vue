<template>
  <div class="page-payment">
    <h2>{{ t('payment.title') }}</h2>

    <!-- 订单信息 -->
    <section class="payment-summary">
      <div class="summary-row">
        <span>{{ t('payment.orderNo') }}</span><span class="mono">{{ orderNo }}</span>
      </div>
      <div class="summary-row total">
        <span>{{ t('payment.amountDue') }}</span>
        <strong>{{ payAmountText }}</strong>
      </div>
    </section>

    <!-- 支付方式 -->
    <section class="payment-section">
      <h3>{{ t('payment.selectMethod') }}</h3>
      <div class="pay-methods">
        <div class="pay-method" :class="{ selected: provider === 'paypal' }" @click="provider = 'paypal'">
          <span class="pay-icon">💳</span>
          <div>
            <h4>{{ t('payment.paypal') }}</h4>
            <small>{{ t('payment.paypalDesc') }}</small>
          </div>
        </div>
        <div class="pay-method" :class="{ selected: provider === 'stripe' }" @click="provider = 'stripe'">
          <span class="pay-icon">💎</span>
          <div>
            <h4>{{ t('payment.stripe') }}</h4>
            <small>{{ t('payment.stripeDesc') }}</small>
          </div>
        </div>
      </div>
    </section>

    <!-- Stripe 内嵌支付表单 -->
    <StripePaymentForm
      v-if="provider === 'stripe'"
      :order-no="orderNo"
      :pay-amount-text="payAmountText"
      @success="onStripeSuccess"
      @error="onStripeError"
    />

    <!-- PayPal 操作按钮 -->
    <div v-if="provider === 'paypal'" class="payment-action">
      <button class="btn-primary" :disabled="paying" @click="pay">
        {{ paying ? t('common.processing') : t('payment.payNow', { amount: payAmountText }) }}
      </button>
    </div>

    <div v-if="error" class="error-toast">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPayment } from '../api.js'
import { useLocale } from '../composables/useLocale.js'
import StripePaymentForm from './StripePaymentForm.vue'

const route = useRoute()
const router = useRouter()
const { t, formatPrice, formatAmount } = useLocale()

const orderNo = route.query.orderNo || ''
const totalAmount = parseInt(route.query.totalAmount) || 0
// P2 下单锁汇后由 Booking 透传 displayAmount/displayCurrency；未就绪时回退按基准币换算。
const lockedAmount = route.query.displayAmount
const lockedCurrency = route.query.displayCurrency

const provider = ref('paypal')
const paying = ref(false)
const error = ref('')

const payAmountText = computed(() => {
  if (lockedAmount != null && lockedCurrency) {
    return formatAmount(Number(lockedAmount), lockedCurrency)
  }
  return formatPrice(totalAmount)
})

function generateIdempotencyKey() {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function onStripeSuccess() {
  // StripePaymentForm already navigates on success
}

function onStripeError(e) {
  error.value = e.message || t('payment.payFailed')
}

async function pay() {
  if (paying.value) return
  paying.value = true
  error.value = ''
  try {
    const resp = await createPayment({
      orderNo,
      provider: provider.value,
      idempotencyKey: generateIdempotencyKey(),
    })
    // 如果返回了 PayPal 结账链接，跳转过去
    if (resp.checkoutUrl) {
      window.location.href = resp.checkoutUrl
    } else {
      // 直接跳到订单成功页（模拟支付完成）
      router.push({ name: 'OrderSuccess', params: { orderNo } })
    }
  } catch (e) {
    error.value = e.message || t('payment.payFailed')
  } finally {
    paying.value = false
  }
}
</script>
