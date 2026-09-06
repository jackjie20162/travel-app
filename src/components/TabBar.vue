<template>
  <nav v-if="showTabBar" class="tab-bar">
    <router-link to="/" class="tab-item" :class="{ active: route.meta.tab === 'home' || route.path === '/' }">
      <span class="tab-icon">⌂</span><small>首页</small>
    </router-link>
    <router-link to="/explore" class="tab-item" :class="{ active: route.meta.tab === 'explore' }">
      <span class="tab-icon">⌕</span><small>探索</small>
    </router-link>
    <router-link to="/orders" class="tab-item" :class="{ active: route.meta.tab === 'orders' }">
      <span class="tab-icon">📋</span><small>订单</small>
    </router-link>
    <router-link to="/favorites" class="tab-item" :class="{ active: route.meta.tab === 'favorites' }">
      <span class="tab-icon">♡</span><small>收藏</small>
    </router-link>
    <router-link to="/profile" class="tab-item" :class="{ active: route.meta.tab === 'profile' }">
      <span class="tab-icon">◯</span><small>我的</small>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const showTabBar = computed(() => route.meta.tab !== undefined)
</script>
