import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from './api.js'

const routes = [
  { path: '/', name: 'Home', component: () => import('./views/Home.vue'), meta: { tab: 'home' } },
  { path: '/explore', name: 'Explore', component: () => import('./views/Explore.vue'), meta: { tab: 'explore' } },
  { path: '/product/:id', name: 'ProductDetail', component: () => import('./views/ProductDetail.vue') },
  { path: '/booking', name: 'Booking', component: () => import('./views/Booking.vue'), meta: { requiresAuth: true } },
  { path: '/payment', name: 'Payment', component: () => import('./views/Payment.vue'), meta: { requiresAuth: true } },
  { path: '/payments/return', name: 'PaymentReturn', component: () => import('./views/PaymentReturn.vue') },
  { path: '/order/success/:orderNo', name: 'OrderSuccess', component: () => import('./views/OrderSuccess.vue') },
  { path: '/orders', name: 'Orders', component: () => import('./views/Orders.vue'), meta: { tab: 'orders', requiresAuth: true } },
  { path: '/order/:orderNo', name: 'OrderDetail', component: () => import('./views/OrderDetail.vue'), meta: { requiresAuth: true } },
  { path: '/order/:orderNo/review', name: 'ReviewForm', component: () => import('./views/ReviewForm.vue'), meta: { requiresAuth: true } },
  { path: '/favorites', name: 'Favorites', component: () => import('./views/Favorites.vue'), meta: { tab: 'favorites' } },
  { path: '/profile', name: 'Profile', component: () => import('./views/Profile.vue'), meta: { tab: 'profile' } },
  { path: '/login', name: 'Login', component: () => import('./views/Login.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Navigation guard: redirect to login for auth-required pages
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !getToken()) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
