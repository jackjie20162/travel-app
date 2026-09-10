<template>
  <div class="page-auth">
    <div class="auth-header">
      <h1>{{ isRegister ? t('auth.createAccount') : t('auth.welcomeBack') }}</h1>
      <p class="muted">{{ t('profile.subtitle') }}</p>
    </div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <!-- 注册额外字段 -->
      <template v-if="isRegister">
        <div class="form-group">
          <label>{{ t('auth.username') }}</label>
          <input v-model="form.username" :placeholder="t('auth.usernamePh')" required />
        </div>
        <div class="form-group">
          <label>{{ t('auth.nickname') }}</label>
          <input v-model="form.nickname" :placeholder="t('common.optional')" />
        </div>
        <div class="form-group">
          <label>{{ t('auth.password') }}</label>
          <input v-model="form.password" type="password" :placeholder="t('auth.passwordPh')" required />
        </div>
      </template>

      <div class="form-group">
        <label>{{ t('auth.email') }}</label>
        <input v-model="form.email" type="email" :placeholder="t('auth.emailPh')" required />
      </div>

      <!-- 注册额外字段 -->
      <div v-if="isRegister" class="form-group">
        <label>{{ t('auth.mobile') }}</label>
        <input v-model="form.mobile" type="tel" :placeholder="t('common.optional')" />
      </div>

      <!-- 图形验证码 -->
      <div class="form-group">
        <label>{{ t('auth.captcha') }}</label>
        <div class="captcha-row">
          <input v-model="form.captchaAnswer" :placeholder="t('auth.captchaPh')" required />
          <div class="captcha-img" @click="refreshCaptcha" :title="t('auth.clickRefresh')">
            <img v-if="captchaSrc" :src="captchaSrc" alt="captcha" />
            <span v-else>{{ t('auth.clickGet') }}</span>
          </div>
        </div>
      </div>

      <!-- 邮件验证码 -->
      <div class="form-group">
        <label>{{ t('auth.emailCode') }}</label>
        <div class="captcha-row">
          <input v-model="form.emailCode" :placeholder="t('auth.emailCodePh')" required />
          <button type="button" class="btn-send-code" :disabled="codeCooldown > 0 || sendingCode" @click="handleSendCode">
            {{ sendingCode ? t('auth.sending') : (codeCooldown > 0 ? `${codeCooldown}s` : t('auth.sendCode')) }}
          </button>
        </div>
      </div>

      <div v-if="error" class="auth-error">{{ error }}</div>

      <button class="btn-primary auth-submit" type="submit" :disabled="loading">
        {{ loading ? t('common.pleaseWait') : (isRegister ? t('auth.register') : t('auth.login')) }}
      </button>
    </form>

    <div class="auth-switch">
      <span>{{ isRegister ? t('auth.hasAccount') : t('auth.noAccount') }}</span>
      <a href="#" @click.prevent="isRegister = !isRegister">
        {{ isRegister ? t('auth.goLogin') : t('auth.registerNew') }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUser } from '../composables/user.js'
import { useLocale } from '../composables/useLocale.js'

const router = useRouter()
const route = useRoute()
const { login, register, fetchCaptcha, sendEmailCode } = useUser()
const { t } = useLocale()

const isRegister = ref(route.query.mode === 'register')
const loading = ref(false)
const error = ref('')
const sendingCode = ref(false)
const codeCooldown = ref(0)
let cooldownTimer = null

const form = reactive({
  username: '',
  password: '',
  email: '',
  mobile: '',
  nickname: '',
  captchaId: '',
  captchaAnswer: '',
  emailCode: '',
})

const captchaSrc = ref('')

onMounted(() => {
  refreshCaptcha()
})

watch(isRegister, () => {
  refreshCaptcha()
})

async function refreshCaptcha() {
  try {
    const data = await fetchCaptcha()
    form.captchaId = data.captchaId
    // 用 TextEncoder 正确编码 SVG 为 base64
    const bytes = new TextEncoder().encode(data.captchaImage)
    const base64 = btoa(String.fromCharCode(...bytes))
    captchaSrc.value = 'data:image/svg+xml;base64,' + base64
  } catch (e) {
    error.value = t('auth.captchaFailed')
    captchaSrc.value = ''
  }
}

async function handleSendCode() {
  error.value = ''
  const email = form.email
  if (!email) {
    error.value = t('auth.emailRequired')
    return
  }
  if (!form.captchaId || !form.captchaAnswer) {
    error.value = t('auth.captchaRequired')
    return
  }
  sendingCode.value = true
  try {
    await sendEmailCode({
      email,
      captchaId: form.captchaId,
      captchaAnswer: form.captchaAnswer,
    })
    startCooldown()
    refreshCaptcha()
    form.captchaAnswer = ''
  } catch (e) {
    error.value = e.message || t('auth.sendCodeFailed')
    refreshCaptcha()
    form.captchaAnswer = ''
  } finally {
    sendingCode.value = false
  }
}

function startCooldown() {
  codeCooldown.value = 60
  cooldownTimer = setInterval(() => {
    codeCooldown.value--
    if (codeCooldown.value <= 0) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

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
        captchaId: form.captchaId,
        captchaAnswer: form.captchaAnswer,
        emailCode: form.emailCode,
      })
    } else {
      await login({
        email: form.email,
        captchaId: form.captchaId,
        captchaAnswer: form.captchaAnswer,
        emailCode: form.emailCode,
      })
    }
    const redirect = route.query.redirect || '/profile'
    router.replace(redirect)
  } catch (e) {
    error.value = e.message || t('auth.operationFailed')
    refreshCaptcha()
    form.captchaAnswer = ''
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
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.captcha-row input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
}
.captcha-img {
  width: 110px;
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f8fafc;
  flex-shrink: 0;
}
.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.captcha-img span {
  font-size: 12px;
  color: #94a3b8;
}
.btn-send-code {
  padding: 10px 14px;
  border: 1px solid #2563eb;
  border-radius: 10px;
  background: white;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}
.btn-send-code:disabled {
  border-color: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
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
  margin-inline-start: 4px;
}
</style>
