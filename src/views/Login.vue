<template>
  <div class="page-auth">
    <div class="auth-header">
      <h1>{{ isRegister ? '创建账户' : '欢迎回来' }}</h1>
      <p class="muted">Global Dubai Travel</p>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <!-- 注册额外字段 -->
      <div v-if="isRegister" class="form-group">
        <label>昵称</label>
        <input v-model="form.nickname" placeholder="可选" />
      </div>

      <div class="form-group">
        <label>用户名</label>
        <input v-model="form.username" placeholder="请输入用户名" required />
      </div>

      <div class="form-group">
        <label>密码</label>
        <input v-model="form.password" type="password" placeholder="请输入密码" required />
      </div>

      <!-- 注册额外字段 -->
      <template v-if="isRegister">
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="form.email" type="email" placeholder="可选" />
        </div>
        <div class="form-group">
          <label>手机号</label>
          <input v-model="form.mobile" type="tel" placeholder="可选" />
        </div>
      </template>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <button class="btn-primary auth-submit" type="submit" :disabled="loading">
        {{ loading ? '请稍候…' : (isRegister ? '注册' : '登录') }}
      </button>
    </form>

    <div class="auth-switch">
      <span>{{ isRegister ? '已有账户？' : '还没有账户？' }}</span>
      <a href="#" @click.prevent="isRegister = !isRegister">
        {{ isRegister ? '去登录' : '注册新账户' }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUser } from '../composables/user.js'

const router = useRouter()
const route = useRoute()
const { login, register } = useUser()

const isRegister = ref(route.query.mode === 'register')
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
  email: '',
  mobile: '',
  nickname: '',
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (isRegister.value) {
      await register({
        username: form.username,
        password: form.password,
        email: form.email,
        mobile: form.mobile,
        nickname: form.nickname,
      })
    } else {
      await login({ username: form.username, password: form.password })
    }
    // Redirect to the page user came from, or profile
    const redirect = route.query.redirect || '/profile'
    router.replace(redirect)
  } catch (e) {
    error.value = e.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-auth {
  padding: 40px 16px;
  max-width: 400px;
  margin: 0 auto;
}
.auth-header {
  text-align: center;
  margin-bottom: 32px;
}
.auth-header h1 {
  font-size: 26px;
  margin-bottom: 4px;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-group label {
  font-size: 14px;
  color: #64748b;
}
.form-group input {
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus {
  border-color: #1a1a2e;
}
.auth-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  border: 1px solid #fecaca;
}
.auth-submit {
  width: 100%;
  text-align: center;
  margin-top: 8px;
}
.auth-switch {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #64748b;
}
.auth-switch a {
  color: #2563eb;
  font-weight: 600;
  margin-left: 4px;
}
</style>
