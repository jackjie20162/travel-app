<template>
  <header class="app-header">
    <button v-if="showBack" class="back-btn" @click="router.back()">←</button>
    <div class="header-title" @click="router.push('/')">
      <b>GLOBAL DUBAI</b>
    </div>
    <div class="header-actions">
      <button class="icon-btn locale-btn" @click.stop="showLocaleMenu = !showLocaleMenu" :title="t('profile.language')">
        🌐
      </button>
      <button v-if="showFav" class="icon-btn" @click="router.push(user.isLoggedIn.value ? '/profile' : '/login')">
        {{ user.isLoggedIn.value ? '◉' : '◯' }}
      </button>
    </div>

    <!-- 语言 / 货币 切换面板 -->
    <div v-if="showLocaleMenu" class="locale-menu" @click.stop>
      <div class="locale-group">
        <div class="locale-group-title">{{ t('profile.language') }}</div>
        <button
          v-for="lc in supportedLocales"
          :key="lc"
          class="locale-option"
          :class="{ active: locale === lc }"
          @click="onSelectLocale(lc)"
        >{{ localeLabels[lc] }}</button>
      </div>
      <div class="locale-group">
        <div class="locale-group-title">{{ t('profile.currencyLabel') }}</div>
        <button
          v-for="c in currencyList"
          :key="c.code"
          class="locale-option"
          :class="{ active: currency === c.code }"
          @click="onSelectCurrency(c.code)"
        >{{ c.code }} · {{ t('currency.' + c.code) }}</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUser } from '../composables/user.js'
import { useLocale } from '../composables/useLocale.js'

const route = useRoute()
const router = useRouter()
const user = useUser()
const { t, locale, setLocale, supportedLocales, localeLabels, currency, currencyList, setCurrency } = useLocale()

const showBack = computed(() => !route.meta.tab)
const showFav = computed(() => route.meta.tab !== undefined)

const showLocaleMenu = ref(false)

function onSelectLocale(lc) {
  setLocale(lc)
}

function onSelectCurrency(code) {
  setCurrency(code)
  showLocaleMenu.value = false
}

function onClickOutside() {
  showLocaleMenu.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.app-header {
  position: relative;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.locale-btn {
  font-size: 16px;
}
.locale-menu {
  position: absolute;
  top: 100%;
  inset-inline-end: 12px;
  z-index: 100;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  min-width: 180px;
}
.locale-group + .locale-group {
  margin-top: 8px;
  border-top: 1px solid #f0f2f5;
  padding-top: 8px;
}
.locale-group-title {
  font-size: 11px;
  color: #94a3b8;
  padding: 4px 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.locale-option {
  display: block;
  width: 100%;
  text-align: start;
  background: none;
  border: none;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  font-family: inherit;
}
.locale-option:hover {
  background: #f5f6f8;
}
.locale-option.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}
</style>
