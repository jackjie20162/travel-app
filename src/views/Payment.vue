<template>
  <div class="page-payment">
    <h2>订单支付</h2>

    <!-- 订单信息 -->
    <section class="payment-summary">
      <div class="summary-row">
        <span>订单号</span><span class="mono">{{ orderNo }}</span>
      </div>
      <div class="summary-row total">
        <span>应付金额</span>
        <strong>{{ currency }} {{ formatPrice(totalAmount) }}</strong>
      </div>
    </section>

    <!-- 支付方式 -->
    <section class="payment-section">
      <h3>选择支付方式</h3>
      <div class="pay-methods">
        <div class="pay-method" :class="{ selected: provider === 'paypal' }" @click="provider = 'paypal'">
          <span class="pay-icon">💳</span>
          <div>
            <h4>PayPal</h4>
            <small>国际信用卡 / PayPal 余额</small>
          </div>
        </div>
      </div>
    </section>

    <!-- 操作 -->
    <div class="payment-action">
      <button class="btn-primary" :disabled="paying" @click="pay">
        {{ paying ? '处理中…' : `立即支付 ${currency} ${formatPrice(totalAmount)}` }}
      </button>
    </div>

    <div v-if="error" class="error-toast">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPayment } from '../api.js'

const route = useRoute()
const router = useRouter()

const orderNo = route.query.orderNo || ''
const totalAmount = parseInt(route.query.totalAmount) || 0
const currency = route.query.currency || 'AED'

const provider = ref('paypal')
const paying = ref(false)
const error = ref('')

function formatPrice(v) {
  if (v == null) return '--'
  return String(v)
}

function generateIdempotencyKey() {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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
    error.value = e.message || '支付发起失败，请重试'
  } finally {
    paying.value = false
  }
}
</script>
