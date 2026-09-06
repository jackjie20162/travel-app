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
      <section v-if="order.status === 'CONFIRMED' || order.status === 'PAID'" class="detail-section">
        <h3>电子凭证</h3>
        <div class="voucher-box">
          <div class="voucher-no">{{ order.voucherNo || order.orderNo }}</div>
          <small>凭此凭证到现场核销</small>
        </div>
      </section>

      <!-- 操作 -->
      <div class="detail-actions">
        <router-link to="/orders" class="btn-secondary">返回订单列表</router-link>
        <router-link to="/" class="btn-primary">继续浏览</router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder } from '../api.js'

const route = useRoute()
const order = ref(null)
const loading = ref(true)

function statusText(s) {
  const map = {
    PENDING_PAYMENT: '待支付',
    PAYMENT_PROCESSING: '支付处理中',
    PAID: '待核销',
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
</script>
