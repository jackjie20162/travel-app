<template>
  <header class="app-header">
    <button v-if="showBack" class="back-btn" @click="router.back()">←</button>
    <div class="header-title" @click="router.push('/')">
      <b>GLOBAL DUBAI</b>
    </div>
    <button v-if="showFav" class="icon-btn" @click="router.push(user.isLoggedIn.value ? '/profile' : '/login')">
      {{ user.isLoggedIn.value ? '◉' : '◯' }}
    </button>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUser } from '../composables/user.js'

const route = useRoute()
const router = useRouter()
const user = useUser()

const showBack = computed(() => !route.meta.tab)
const showFav = computed(() => route.meta.tab !== undefined)
</script>
