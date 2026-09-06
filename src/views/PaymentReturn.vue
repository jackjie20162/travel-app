<template>
  <div class="page-pay-return">
    <!-- 加载中 -->
    <div v-if="loading" class="result-state loading-state">
      <div class="spinner"></div>
      <h2>支付处理中</h2>
      <p class="muted">正在确认您的 PayPal 付款，请稍候…</p>
    </div>

    <!-- 支付成功 -->
    <div v-else-if="payment" class="result-state">
      <div class="success-icon">✓</div>
      <h1>支付成功</h1>
      <p class="muted">您的 PayPal 付款已确认</p>

      <section class="result-card">
        <div class="result-row">
          <span>支付单号</span>
          <span class="mono">{{ payment.paymentNo }}</span>
        </div>
        <div class="result-row">
          <span>订单号</span>
          <span class="mono">{{ payment.orderNo }}</span>
        </div>
        <div class="result-row">
          <span>支付方式</span>
          <span>PayPal</span>
        </div>
        <div class="result-row total">
          <span>支付金额</span>
          <strong>{{ payment.currency }} {{ payment.amount }}</strong>
        </div>
      </section>

      <div class="result-actions">
        <router-link :to="`/order/${payment.orderNo}`" class="btn-primary">查看订单</router-link>
        <router-link to="/orders" class="btn-secondary">我的订单</router-link>
        <router-link to="/" class="btn-secondary">继续浏览</router-link>
      </div>
    </div>

    <!-- 支付失败 -->
    <div v-else class="result-state error-state">
      <div class="fail-icon">✕</div>
      <h1>支付确认失败</h1>
      <p class="error-msg">{{ errorMsg }}</p>
      <p class="muted">如已扣款，请稍后在「我的订单」中查看，资金将在几分钟内原路退回。</p>

      <div class="result-actions">
        <router-link to="/orders" class="btn-primary">查看我的订单</router-link>
        <router-link to="/" class="btn-secondary">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { capturePaypalPayment } from '../api.js'

const route = useRoute()
const loading = ref(true)
const payment = ref(null)
const errorMsg = ref('')

onMounted(async () => {
  try {
    // PayPal 回调带 token / PayerID / state 等参数，透传给后端完成 capture
    const qs = route.fullPath.split('?')[1] || ''
    const data = await capturePaypalPayment(qs)
    payment.value = data
  } catch (e) {
    errorMsg.value = e.message || '支付确认失败，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>
