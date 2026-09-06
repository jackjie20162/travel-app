<template>
  <div class="page-success">
    <div class="success-icon">✓</div>
    <h1>下单成功！</h1>
    <p class="muted">订单号：<span class="mono">{{ orderNo }}</span></p>
    <p class="muted">请完成支付以确认预订。支付成功后将生成电子凭证。</p>

    <div class="success-actions">
      <router-link :to="`/order/${orderNo}`" class="btn-secondary">查看订单</router-link>
      <router-link to="/orders" class="btn-secondary">我的订单</router-link>
      <router-link to="/" class="btn-primary">继续浏览</router-link>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const orderNo = route.params.orderNo || ''
</script>
