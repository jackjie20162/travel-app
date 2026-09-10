<template>
  <div class="page-favorites">
    <h2>{{ t('favorites.title') }}</h2>

    <div v-if="!favProducts.length" class="center empty">
      <p>{{ t('favorites.empty') }}</p>
      <router-link to="/" class="link">{{ t('favorites.goBrowse') }}</router-link>
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
          <p>{{ p.description || t('favorites.defaultDesc') }}</p>
          <div class="card-footer">
            <strong>{{ formatPrice(p.minPrice) }}</strong>
            <span class="tag">{{ t('favorites.from') }}</span>
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
import { useLocale } from '../composables/useLocale.js'

const router = useRouter()
const { ids, toggle } = useFavorites()
const { t, formatPrice } = useLocale()
const favProducts = ref([])

function destEmoji(dest) {
  const map = { 'desert': '🏜️', 'abu dhabi': '🕌', 'marina': '⛵', 'culture': '🎭' }
  return map[(dest || '').toLowerCase()] || '🏙️'
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
