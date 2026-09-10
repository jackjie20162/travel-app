<template>
  <div class="page-success">
    <div class="success-icon">✓</div>
    <h1>{{ t('orderSuccess.title') }}</h1>
    <p class="muted">{{ t('orderSuccess.orderNoLabel') }}<span class="mono">{{ orderNo }}</span></p>
    <p class="muted">{{ t('orderSuccess.hint') }}</p>

    <div class="success-actions">
      <router-link :to="`/order/${orderNo}`" class="btn-secondary">{{ t('orderSuccess.viewOrder') }}</router-link>
      <router-link to="/orders" class="btn-secondary">{{ t('orderSuccess.myOrders') }}</router-link>
      <router-link to="/" class="btn-primary">{{ t('orderSuccess.continueBrowse') }}</router-link>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useLocale } from '../composables/useLocale.js'
const route = useRoute()
const { t } = useLocale()
const orderNo = route.params.orderNo || ''
</script>
