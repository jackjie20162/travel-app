<template>
  <div class="page-favorites">
    <h2>我的收藏</h2>

    <div v-if="!favProducts.length" class="center empty">
      <p>还没有收藏任何商品</p>
      <router-link to="/" class="link">去浏览商品 →</router-link>
    </div>

    <div v-else class="product-grid">
      <article v-for="p in favProducts" :key="p.id" class="product-card" @click="goProduct(p)">
        <div class="card-cover">
          <span class="cover-emoji">{{ destEmoji(p.destination) }}</span>
          <button class="fav-btn" @click.stop="toggle(p.id)">♥</button>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts } from '../api.js'
import { useFavorites } from '../composables/favorites.js'

const router = useRouter()
const { ids, toggle } = useFavorites()
const favProducts = ref([])

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

async function loadFavProducts() {
  if (!ids.value.length) {
    favProducts.value = []
    return
  }
  try {
    // 获取所有商品，然后过滤收藏的
    const data = await getProducts({ pageSize: 100 })
    const all = data.items || data.data?.items || data.data || []
    const idSet = new Set(ids.value)
    favProducts.value = all.filter(p => idSet.has(p.id))
  } catch {
    favProducts.value = []
  }
}

watch(ids, loadFavProducts)
onMounted(loadFavProducts)
</script>
