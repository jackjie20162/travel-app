<template>
  <div class="page-profile">
    <!-- 未登录状态 -->
    <div v-if="!user.isLoggedIn" class="profile-header">
      <div class="avatar">👤</div>
      <h2>{{ t('profile.title') }}</h2>
      <p class="muted">{{ t('profile.subtitle') }}</p>
      <div class="auth-actions">
        <button class="btn-primary" @click="router.push('/login')">{{ t('profile.loginRegister') }}</button>
      </div>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="profile-header">
      <div class="avatar">{{ user.avatar || '👤' }}</div>
      <h2>{{ user.nickname || user.username }}</h2>
      <p class="muted" v-if="user.currentUser?.email">{{ user.currentUser.email }}</p>
      <p class="muted" v-else-if="user.currentUser?.mobile">{{ user.currentUser.mobile }}</p>
      <div class="user-stats" v-if="user.currentUser">
        <div class="stat-item">
          <strong>{{ user.currentUser.score || 0 }}</strong>
          <small>{{ t('profile.points') }}</small>
        </div>
        <div class="stat-item">
          <strong>{{ formatMoney(user.currentUser.money) }}</strong>
          <small>{{ t('profile.balance') }}</small>
        </div>
        <div class="stat-item">
          <strong>{{ user.currentUser.level || 0 }}</strong>
          <small>{{ t('profile.level') }}</small>
        </div>
      </div>
    </div>

    <div class="profile-menu">
      <div class="menu-item" @click="router.push('/orders')">
        <span class="menu-icon">📋</span>
        <span>{{ t('profile.myOrders') }}</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="router.push('/favorites')">
        <span class="menu-icon">♡</span>
        <span>{{ t('profile.myFavorites') }}</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="router.push('/support')">
        <span class="menu-icon">💬</span>
        <span>{{ t('profile.contactSupport') }}</span>
        <span class="arrow">›</span>
      </div>
      <div v-if="user.isLoggedIn" class="menu-item" @click="showEditProfile = true">
        <span class="menu-icon">✎</span>
        <span>{{ t('profile.editProfile') }}</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="showSettings = true">
        <span class="menu-icon">⚙</span>
        <span>{{ t('profile.settings') }}</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="showAbout = true">
        <span class="menu-icon">ℹ</span>
        <span>{{ t('profile.about') }}</span>
        <span class="arrow">›</span>
      </div>
      <div v-if="user.isLoggedIn" class="menu-item logout-item" @click="handleLogout">
        <span class="menu-icon">⏻</span>
        <span>{{ t('profile.logout') }}</span>
        <span class="arrow">›</span>
      </div>
    </div>

    <!-- 快捷操作 -->
    <section class="profile-section">
      <h3>{{ t('profile.quickEntry') }}</h3>
      <div class="quick-grid">
        <div class="quick-item" @click="router.push('/explore')">
          <span>⌕</span><small>{{ t('nav.explore') }}</small>
        </div>
        <div class="quick-item" @click="router.push('/explore?destination=Desert')">
          <span>🏜️</span><small>{{ t('profile.desert') }}</small>
        </div>
        <div class="quick-item" @click="router.push('/explore?destination=Marina')">
          <span>⛵</span><small>{{ t('profile.marina') }}</small>
        </div>
        <div class="quick-item" @click="router.push('/explore?destination=Culture')">
          <span>🎭</span><small>{{ t('profile.culture') }}</small>
        </div>
      </div>
    </section>

    <!-- 编辑资料弹窗 -->
    <div v-if="showEditProfile" class="modal-overlay" @click.self="showEditProfile = false">
      <div class="modal">
        <h3>{{ t('profile.editProfile') }}</h3>
        <label>{{ t('profile.nickname') }}
          <input v-model="editForm.nickname" :placeholder="t('profile.nicknamePh')"/>
        </label>
        <label>{{ t('profile.email') }}
          <input v-model="editForm.email" type="email" placeholder="your@email.com"/>
        </label>
        <label>{{ t('profile.mobile') }}
          <input v-model="editForm.mobile" type="tel" :placeholder="t('profile.mobilePh')"/>
        </label>
        <label>{{ t('profile.bio') }}
          <input v-model="editForm.bio" :placeholder="t('profile.bioPh')"/>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showEditProfile = false">{{ t('common.cancel') }}</button>
          <button class="btn-primary" @click="saveProfile" :disabled="savingProfile">
            {{ savingProfile ? t('common.saving') : t('common.save') }}
          </button>
        </div>
        <div v-if="profileError" class="form-error">{{ profileError }}</div>
        <div v-if="profileSuccess" class="form-success">{{ profileSuccess }}</div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal">
        <h3>{{ t('profile.settings') }}</h3>
        <label>{{ t('profile.tenantId') }}
          <input v-model="tenantId" placeholder="1"/>
        </label>
        <label>{{ t('profile.merchantId') }}
          <input v-model="merchantId" placeholder="1"/>
        </label>
        <p class="muted">{{ t('profile.settingsHint') }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showSettings = false">{{ t('common.close') }}</button>
          <button class="btn-primary" @click="saveSettings">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- 关于弹窗 -->
    <div v-if="showAbout" class="modal-overlay" @click.self="showAbout = false">
      <div class="modal">
        <h3>{{ t('profile.aboutTitle') }}</h3>
        <p>{{ t('profile.aboutDesc') }}</p>
        <p class="muted">{{ t('profile.version') }}</p>
        <p class="muted">{{ t('profile.aboutFeatures') }}</p>
        <div class="modal-actions">
          <button class="btn-primary" @click="showAbout = false">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTenantId, getMerchantId, setTenantId, setMerchantId, updateProfile } from '../api.js'
import { useUser } from '../composables/user.js'
import { useLocale } from '../composables/useLocale.js'

const router = useRouter()
const user = useUser()
const { t } = useLocale()

const showSettings = ref(false)
const showAbout = ref(false)
const showEditProfile = ref(false)
const tenantId = ref(getTenantId())
const merchantId = ref(getMerchantId())

// Edit profile form
const editForm = reactive({
  nickname: '',
  email: '',
  mobile: '',
  bio: '',
})
const savingProfile = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

function saveSettings() {
  setTenantId(tenantId.value || '1')
  setMerchantId(merchantId.value || '1')
  showSettings.value = false
}

function formatMoney(v) {
  if (v == null) return '0.00'
  return Number(v).toFixed(2)
}

function handleLogout() {
  user.logout()
  router.replace('/')
}

// Populate edit form when opening
function openEditProfile() {
  if (user.currentUser.value) {
    editForm.nickname = user.currentUser.value.nickname || ''
    editForm.email = user.currentUser.value.email || ''
    editForm.mobile = user.currentUser.value.mobile || ''
    editForm.bio = user.currentUser.value.bio || ''
  }
  showEditProfile.value = true
}

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  savingProfile.value = true
  try {
    await updateProfile({
      nickname: editForm.nickname,
      email: editForm.email,
      mobile: editForm.mobile,
      bio: editForm.bio,
    })
    profileSuccess.value = t('profile.profileUpdated')
    await user.fetchProfile()
    setTimeout(() => { showEditProfile.value = false }, 800)
  } catch (e) {
    profileError.value = e.message || t('profile.updateFailed')
  } finally {
    savingProfile.value = false
  }
}

// Auto-fetch profile on mount if logged in
onMounted(async () => {
  if (user.isLoggedIn.value) {
    try { await user.fetchProfile() } catch (e) {
      // Ignore errors, keep showing cached user info
      console.warn('Failed to fetch profile:', e)
    }
  }
})
</script>

<style scoped>
.auth-actions {
  margin-top: 16px;
}
.auth-actions .btn-primary {
  padding: 12px 32px;
}
.user-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 12px;
}
.stat-item {
  text-align: center;
}
.stat-item strong {
  display: block;
  font-size: 18px;
}
.stat-item small {
  font-size: 12px;
  color: #94a3b8;
}
.logout-item {
  color: #dc2626 !important;
}
.form-error {
  color: #dc2626;
  font-size: 13px;
  margin-top: 8px;
}
.form-success {
  color: #059669;
  font-size: 13px;
  margin-top: 8px;
}
</style>
