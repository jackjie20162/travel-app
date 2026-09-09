<template>
  <div class="page-profile">
    <!-- 未登录状态 -->
    <div v-if="!user.isLoggedIn" class="profile-header">
      <div class="avatar">👤</div>
      <h2>旅客中心</h2>
      <p class="muted">Global Dubai Travel</p>
      <div class="auth-actions">
        <button class="btn-primary" @click="router.push('/login')">登录 / 注册</button>
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
          <small>积分</small>
        </div>
        <div class="stat-item">
          <strong>{{ formatMoney(user.currentUser.money) }}</strong>
          <small>余额</small>
        </div>
        <div class="stat-item">
          <strong>{{ user.currentUser.level || 0 }}</strong>
          <small>等级</small>
        </div>
      </div>
    </div>

    <div class="profile-menu">
      <div class="menu-item" @click="router.push('/orders')">
        <span class="menu-icon">📋</span>
        <span>我的订单</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="router.push('/favorites')">
        <span class="menu-icon">♡</span>
        <span>我的收藏</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="router.push('/support')">
        <span class="menu-icon">💬</span>
        <span>联系客服</span>
        <span class="arrow">›</span>
      </div>
      <div v-if="user.isLoggedIn" class="menu-item" @click="showEditProfile = true">
        <span class="menu-icon">✎</span>
        <span>编辑资料</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="showSettings = true">
        <span class="menu-icon">⚙</span>
        <span>设置</span>
        <span class="arrow">›</span>
      </div>
      <div class="menu-item" @click="showAbout = true">
        <span class="menu-icon">ℹ</span>
        <span>关于</span>
        <span class="arrow">›</span>
      </div>
      <div v-if="user.isLoggedIn" class="menu-item logout-item" @click="handleLogout">
        <span class="menu-icon">⏻</span>
        <span>退出登录</span>
        <span class="arrow">›</span>
      </div>
    </div>

    <!-- 快捷操作 -->
    <section class="profile-section">
      <h3>快捷入口</h3>
      <div class="quick-grid">
        <div class="quick-item" @click="router.push('/explore')">
          <span>⌕</span><small>探索</small>
        </div>
        <div class="quick-item" @click="router.push('/explore?destination=Desert')">
          <span>🏜️</span><small>沙漠</small>
        </div>
        <div class="quick-item" @click="router.push('/explore?destination=Marina')">
          <span>⛵</span><small>游船</small>
        </div>
        <div class="quick-item" @click="router.push('/explore?destination=Culture')">
          <span>🎭</span><small>文化</small>
        </div>
      </div>
    </section>

    <!-- 编辑资料弹窗 -->
    <div v-if="showEditProfile" class="modal-overlay" @click.self="showEditProfile = false">
      <div class="modal">
        <h3>编辑资料</h3>
        <label>昵称
          <input v-model="editForm.nickname" placeholder="你的昵称"/>
        </label>
        <label>邮箱
          <input v-model="editForm.email" type="email" placeholder="your@email.com"/>
        </label>
        <label>手机
          <input v-model="editForm.mobile" type="tel" placeholder="手机号"/>
        </label>
        <label>简介
          <input v-model="editForm.bio" placeholder="介绍一下自己"/>
        </label>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showEditProfile = false">取消</button>
          <button class="btn-primary" @click="saveProfile" :disabled="savingProfile">
            {{ savingProfile ? '保存中…' : '保存' }}
          </button>
        </div>
        <div v-if="profileError" class="form-error">{{ profileError }}</div>
        <div v-if="profileSuccess" class="form-success">{{ profileSuccess }}</div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal">
        <h3>设置</h3>
        <label>租户 ID (Tenant)
          <input v-model="tenantId" placeholder="1"/>
        </label>
        <label>商户 ID (Merchant)
          <input v-model="merchantId" placeholder="1"/>
        </label>
        <p class="muted">请求 travel-api 时自动携带这两个上下文头。<br/>修改后下次请求立即生效。</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showSettings = false">关闭</button>
          <button class="btn-primary" @click="saveSettings">保存</button>
        </div>
      </div>
    </div>

    <!-- 关于弹窗 -->
    <div v-if="showAbout" class="modal-overlay" @click.self="showAbout = false">
      <div class="modal">
        <h3>关于 Global Dubai Travel</h3>
        <p>全球迪拜旅游平台 App 端</p>
        <p class="muted">版本 0.2.0</p>
        <p class="muted">真实库存 · 实时价格 · 在线预订 · 用户体系</p>
        <div class="modal-actions">
          <button class="btn-primary" @click="showAbout = false">确定</button>
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

const router = useRouter()
const user = useUser()

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
    profileSuccess.value = '资料已更新'
    await user.fetchProfile()
    setTimeout(() => { showEditProfile.value = false }, 800)
  } catch (e) {
    profileError.value = e.message || '更新失败'
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
