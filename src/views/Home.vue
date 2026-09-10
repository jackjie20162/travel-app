<template>
  <div class="page-home">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="eyebrow">{{ t('home.eyebrow') }}</div>
      <h1>{{ t('home.heroTitleTop') }}<br/>{{ t('home.heroTitleBottom') }}</h1>
      <p class="muted">{{ t('home.heroSubtitle') }}</p>
      <div class="search-bar">
        <input v-model="keyword" :placeholder="t('home.searchPlaceholder')" @keyup.enter="doSearch"/>
        <button @click="doSearch">{{ t('home.search') }}</button>
      </div>
    </section>

    <!-- AI Planner 入口 -->
    <section class="planner-card" @click="showPlanner = true">
      <div>
        <b>{{ t('home.plannerTitle') }}</b>
        <p>{{ t('home.plannerDesc') }}</p>
      </div>
      <button>{{ t('home.plannerStart') }}</button>
    </section>

    <!-- 热门目的地 -->
    <section class="section">
      <h2>{{ t('home.hotDestinations') }}</h2>
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
        <h2>{{ t('home.hotExperiences') }}</h2>
        <router-link to="/explore" class="link">{{ t('common.viewAll') }}</router-link>
      </div>
      <div v-if="loading" class="center">{{ t('common.loading') }}</div>
      <div v-else-if="!products.length" class="center empty">{{ t('home.emptyProducts') }}</div>
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
            <p>{{ p.description || t('home.defaultDesc') }}</p>
            <div class="card-footer">
              <strong>{{ formatPrice(p.minPrice) }}</strong>
              <span class="tag">{{ t('home.from') }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- AI Planner 弹窗 -->
    <div v-if="showPlanner" class="modal-overlay" @click.self="showPlanner = false">
      <div class="modal">
        <h3>{{ t('home.plannerModalTitle') }}</h3>
        <p class="muted">{{ t('home.plannerModalDesc') }}</p>
        <label>{{ t('home.days') }}
          <input v-model.number="plannerDays" type="number" min="1" max="14" placeholder="3"/>
        </label>
        <label>{{ t('home.budget') }}
          <input v-model.number="plannerBudget" type="number" min="0" placeholder="5000"/>
        </label>
        <label>{{ t('home.preferences') }}
          <input v-model="plannerPrefs" :placeholder="t('home.preferencesPh')"/>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showPlanner = false">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="startPlanner">{{ t('home.generate') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts } from '../api.js'
import { useFavorites } from '../composables/favorites.js'
import { useLocale } from '../composables/useLocale.js'

const router = useRouter()
const { isFav, toggle } = useFavorites()
const { t, formatPrice, locale } = useLocale()

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
// 切换语言后重新拉取，获取后端按 locale 返回的翻译文案
watch(locale, () => loadProducts())
</script>
