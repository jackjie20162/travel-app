<template>
  <div class="page-explore">
    <h2>探索迪拜体验</h2>

    <!-- 搜索 & 筛选 -->
    <div class="filter-bar">
      <input v-model="keyword" placeholder="搜索关键词" @keyup.enter="load"/>
      <select v-model="destination" @change="load">
        <option value="">全部目的地</option>
        <option v-for="d in destOptions" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>

    <!-- AI 推荐提示 -->
    <div v-if="route.query.ai" class="ai-hint">
      <b>✨ AI 推荐</b>
      <span>根据你的偏好（{{ route.query.keyword }}）、{{ route.query.days }}天、预算 {{ route.query.budget }} AED 筛选</span>
    </div>

    <!-- 结果列表 -->
    <div v-if="loading" class="center">加载中…</div>
    <div v-else-if="!products.length" class="center empty">没有找到匹配的商品</div>
    <div v-else class="product-list">
      <div v-for="p in products" :key="p.id" class="list-item" @click="goProduct(p)">
        <div class="item-icon">{{ destEmoji(p.destination) }}</div>
        <div class="item-info">
          <h3>{{ p.title }}</h3>
          <small>{{ p.destination || 'Dubai' }} · {{ p.code }}</small>
          <p>{{ p.description || '迪拜精彩体验' }}</p>
        </div>
        <div class="item-price">
          <strong>{{ p.currency || 'AED' }} {{ formatPrice(p.minPrice) }}</strong>
          <small>起</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProducts } from '../api.js'

const route = useRoute()
const router = useRouter()

const keyword = ref(route.query.keyword || '')
const destination = ref(route.query.destination || '')
const products = ref([])
const loading = ref(false)

const destOptions = ['Dubai', 'Abu Dhabi', 'Desert', 'Marina', 'Culture']

function destEmoji(dest) {
  const map = { 'desert': '🏜️', 'abu dhabi': '🕌', 'marina': '⛵', 'culture': '🎭' }
  return map[(dest || '').toLowerCase()] || '🏙️'
}

function formatPrice(v) {
  if (v == null || v <= 0) return '--'
  return String(v)
}

function goProduct(p) {
  router.push({ name: 'ProductDetail', params: { id: p.id } })
}

async function load() {
  loading.value = true
  try {
    const data = await getProducts({
      keyword: keyword.value || undefined,
      destination: destination.value || undefined,
    })
    products.value = data.items || data.data?.items || data.data || []
  } catch (e) {
    console.error('探索加载失败', e)
    products.value = []
  } finally {
    loading.value = false
  }
}

watch(() => route.query, (q) => {
  keyword.value = q.keyword || ''
  destination.value = q.destination || ''
  load()
})

onMounted(load)
</script>
