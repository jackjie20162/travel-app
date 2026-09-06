<template>
  <div class="app">
    <AppHeader/>
    <main class="app-main" :class="{ 'no-tab': !showTab }">
      <router-view/>
    </main>
    <TabBar/>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import TabBar from './components/TabBar.vue'

const route = useRoute()
const showTab = computed(() => route.meta.tab !== undefined)
</script>
