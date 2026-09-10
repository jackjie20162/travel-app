<template>
  <div class="page-orders">
    <h2>{{ t('order.myOrders') }}</h2>

    <!-- Tab 栏 -->
    <div class="order-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="order-tab"
        :class="{ active: activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        <span>{{ t(tab.labelKey) }}</span>
        <span v-if="badges[tab.value]" class="tab-badge">{{ badges[tab.value] > 99 ? '99+' : badges[tab.value] }}</span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading && !orders.length" class="center">
      <div class="spinner"></div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!orders.length" class="center empty">
      <p>{{ t('order.empty') }}</p>
      <router-link to="/" class="link">{{ t('order.goBrowse') }}</router-link>
    </div>

    <!-- 订单列表 -->
    <div v-else class="order-list">
      <div v-for="o in orders" :key="o.orderNo" class="order-card" @click="goDetail(o.orderNo)">
        <div class="order-header">
          <span class="mono">{{ o.orderNo }}</span>
          <span class="order-status" :class="o.status">{{ statusText(o.status) }}</span>
        </div>
        <div class="order-body">
          <div class="order-info">
            <small>{{ o.customerEmail || t('order.travelOrder') }}</small>
          </div>
          <strong>{{ orderAmount(o) }}</strong>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="orders.length && orders.length < total" class="load-more" @click="loadMore">
      <span v-if="!loadingMore">{{ t('order.loadMore') }}</span>
      <span v-else class="muted">{{ t('common.loading') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders } from '../api.js'
import { useLocale } from '../composables/useLocale.js'

const router = useRouter()
const { t, te, formatPrice, formatAmount } = useLocale()
const orders = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const activeTab = ref('')
const page = ref(1)
const total = ref(0)
const badges = reactive({ PENDING_PAYMENT: 0, PENDING_ACCEPTANCE: 0 })

const tabs = [
  { value: '', labelKey: 'order.tabAll' },
  { value: 'PENDING_PAYMENT', labelKey: 'status.PENDING_PAYMENT' },
  { value: 'PENDING_ACCEPTANCE', labelKey: 'status.PENDING_ACCEPTANCE' },
  { value: 'PENDING_VERIFY', labelKey: 'status.PENDING_VERIFY' },
  { value: 'COMPLETED', labelKey: 'status.COMPLETED' },
  { value: 'CANCELLED', labelKey: 'status.CANCELLED' },
]

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

async function loadOrders(append = false) {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
    page.value = 1
    orders.value = []
  }
  try {
    const params = { page: page.value, pageSize: 20 }
    if (activeTab.value) params.status = activeTab.value
    const resp = await getMyOrders(params)
    const items = resp?.items || []
    if (append) {
      orders.value = [...orders.value, ...items]
    } else {
      orders.value = items
    }
    total.value = Number(resp?.total || 0)
  } catch (e) {
    console.error('加载订单失败', e)
    // 降级：尝试从本地存储读取
    if (!append) {
      try {
        orders.value = JSON.parse(localStorage.getItem('travel_orders') || '[]')
      } catch {
        orders.value = []
      }
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadBadgeCounts() {
  try {
    const [p, a] = await Promise.all([
      getMyOrders({ status: 'PENDING_PAYMENT', page: 1, pageSize: 1 }),
      getMyOrders({ status: 'PENDING_ACCEPTANCE', page: 1, pageSize: 1 }),
    ])
    badges.PENDING_PAYMENT = Number(p?.total || 0)
    badges.PENDING_ACCEPTANCE = Number(a?.total || 0)
  } catch { /* ignore */ }
}

function switchTab(val) {
  activeTab.value = val
  loadOrders()
}

function loadMore() {
  page.value++
  loadOrders(true)
}

function goDetail(orderNo) {
  router.push({ name: 'OrderDetail', params: { orderNo } })
}

onMounted(() => {
  loadOrders()
  loadBadgeCounts()
})
</script>

<style scoped>
.order-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eee;
  margin-bottom: 16px;
  -webkit-overflow-scrolling: touch;
}
.order-tabs::-webkit-scrollbar { display: none }
.order-tab {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 10px 6px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  transition: color .2s, background .2s;
  border-bottom: 2px solid transparent;
}
.order-tab.active {
  color: #1a1a2e;
  font-weight: 600;
  border-bottom-color: #ff6600;
  background: #fff7ed;
}
.tab-badge {
  position: absolute;
  inset-block-start: 2px;
  inset-inline-end: 2px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #ef4444;
  border-radius: 8px;
  text-align: center;
  padding: 0 4px;
}
.load-more {
  text-align: center;
  padding: 16px;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
}
</style>
