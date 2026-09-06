<template>
  <div class="page-home">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="eyebrow">DUBAI EXPERIENCES</div>
      <h1>发现你的下一段<br/>迪拜旅程</h1>
      <p class="muted">真实库存 · 实时价格 · 在线预订</p>
      <div class="search-bar">
        <input v-model="keyword" placeholder="搜索沙漠冲沙、哈利法塔、游船…" @keyup.enter="doSearch"/>
        <button @click="doSearch">搜索</button>
      </div>
    </section>

    <!-- AI Planner 入口 -->
    <section class="planner-card" @click="showPlanner = true">
      <div>
        <b>✨ AI Planner</b>
        <p>告诉我预算、天数和想玩的项目，AI 为你生成可预订行程。</p>
      </div>
      <button>开始规划</button>
    </section>

    <!-- 热门目的地 -->
    <section class="section">
      <h2>热门目的地</h2>
      <div class="dest-row">
        <div v-for="d in destinations" :key="d.name" class="dest-chip" @click="goExplore(d.name)">
          <span class="dest-emoji">{{ d.emoji }}</span>
          <span>{{ d.name }}</span>
        </div>
      </div>
    </section>

    <!-- 热门体验 -->
    <section class="section">
      <div class="section-header">
        <h2>热门体验</h2>
        <router-link to="/explore" class="link">查看全部 →</router-link>
      </div>
      <div v-if="loading" class="center">加载中…</div>
      <div v-else-if="!products.length" class="center empty">暂无商品，请先由商户发布旅游产品。</div>
      <div v-else class="product-grid">
        <article v-for="p in products" :key="p.id" class="product-card" @click="goProduct(p)">
          <div class="card-cover">
            <span class="cover-emoji">{{ destEmoji(p.destination) }}</span>
            <button class="fav-btn" @click.stop="toggle(p.id)">
              {{ isFav(p.id) ? '♥' : '♡' }}
            </button>
          </div>
          <div class="card-body">
            <small class="card-dest">{{ p.destination || 'Dubai' }}</small>
            <h3>{{ p.title }}</h3>
            <p>{{ p.description || '迪拜精彩体验' }}</p>
            <div class="card-footer">
              <strong>{{ p.currency || 'AED' }} {{ formatPrice(p.minPrice) }}</strong>
              <span class="tag">起</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- AI Planner 弹窗 -->
    <div v-if="showPlanner" class="modal-overlay" @click.self="showPlanner = false">
      <div class="modal">
        <h3>✨ AI 行程规划</h3>
        <p class="muted">输入你的旅行偏好，AI 将推荐可预订的商品组合。</p>
        <label>天数
          <input v-model.number="plannerDays" type="number" min="1" max="14" placeholder="3"/>
        </label>
        <label>预算 (AED)
          <input v-model.number="plannerBudget" type="number" min="0" placeholder="5000"/>
        </label>
        <label>偏好
          <input v-model="plannerPrefs" placeholder="沙漠、文化、美食…"/>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showPlanner = false">取消</button>
          <button class="btn-primary" @click="startPlanner">生成行程</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts } from '../api.js'
import { useFavorites } from '../composables/favorites.js'

const router = useRouter()
const { isFav, toggle } = useFavorites()

const keyword = ref('')
const products = ref([])
const loading = ref(false)
const showPlanner = ref(false)
const plannerDays = ref(3)
const plannerBudget = ref(5000)
const plannerPrefs = ref('')

const destinations = [
  { name: 'Dubai', emoji: '🏙️' },
  { name: 'Abu Dhabi', emoji: '🕌' },
  { name: 'Desert', emoji: '🏜️' },
  { name: 'Marina', emoji: '⛵' },
  { name: 'Culture', emoji: '🎭' },
]

function destEmoji(dest) {
  const map = { 'desert': '🏜️', 'abu dhabi': '🕌', 'marina': '⛵', 'culture': '🎭' }
  return map[(dest || '').toLowerCase()] || '🏙️'
}

function formatPrice(v) {
  if (v == null || v <= 0) return '--'
  return String(v)
}

function goExplore(dest) {
  router.push({ path: '/explore', query: { destination: dest } })
}

function goProduct(p) {
  router.push({ name: 'ProductDetail', params: { id: p.id } })
}

function doSearch() {
  loadProducts()
}

async function loadProducts() {
  loading.value = true
  try {
    const data = await getProducts({ keyword: keyword.value || undefined })
    products.value = data.items || data.data?.items || data.data || []
  } catch (e) {
    console.error('加载商品失败', e)
    products.value = []
  } finally {
    loading.value = false
  }
}

function startPlanner() {
  showPlanner.value = false
  router.push({
    path: '/explore',
    query: {
      keyword: plannerPrefs.value,
      ai: '1',
      days: plannerDays.value,
      budget: plannerBudget.value,
    },
  })
}

onMounted(loadProducts)
</script>
