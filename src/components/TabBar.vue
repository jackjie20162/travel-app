<template>
  <nav v-if="showTabBar" class="tab-bar">
    <router-link to="/" class="tab-item" :class="{ active: route.meta.tab === 'home' || route.path === '/' }">
      <span class="tab-icon">⌂</span><small>{{ t('nav.home') }}</small>
    </router-link>
    <router-link to="/explore" class="tab-item" :class="{ active: route.meta.tab === 'explore' }">
      <span class="tab-icon">⌕</span><small>{{ t('nav.explore') }}</small>
    </router-link>
    <router-link to="/orders" class="tab-item" :class="{ active: route.meta.tab === 'orders' }">
      <span class="tab-icon">📋</span><small>{{ t('nav.orders') }}</small>
    </router-link>
    <router-link to="/favorites" class="tab-item" :class="{ active: route.meta.tab === 'favorites' }">
      <span class="tab-icon">♡</span><small>{{ t('nav.favorites') }}</small>
    </router-link>
    <router-link to="/profile" class="tab-item" :class="{ active: route.meta.tab === 'profile' }">
      <span class="tab-icon">◯</span><small>{{ t('nav.profile') }}</small>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLocale } from '../composables/useLocale.js'
const route = useRoute()
const { t } = useLocale()
const showTabBar = computed(() => route.meta.tab !== undefined)
</script>
