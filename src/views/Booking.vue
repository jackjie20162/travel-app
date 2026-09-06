<template>
  <div class="page-booking">
    <!-- 返回链接 -->
    <div class="booking-nav">
      <button class="back-link" @click="goBackToProduct">← 返回产品</button>
    </div>

    <!-- 步骤条 -->
    <div class="booking-stepper">
      <div class="step active"><span class="step-num">1</span><small>选择</small></div>
      <div class="step-line"></div>
      <div class="step active current"><span class="step-num">2</span><small>确认</small></div>
      <div class="step-line"></div>
      <div class="step"><span class="step-num">3</span><small>支付</small></div>
    </div>

    <div v-if="loading" style="text-align:center;padding:60px 0;color:#94a3b8">加载产品信息中…</div>
    <div v-else-if="loadError" style="text-align:center;padding:60px 0;color:#ef4444">
      <p>{{ loadError }}</p>
      <button class="back-link" @click="goBackToProduct" style="margin-top:12px">← 返回</button>
    </div>
    <template v-else>
    <h2>确认预订</h2>

    <!-- 产品标题 + 退订政策 -->
    <div class="booking-product-header">
      <h3 class="booking-product-title">{{ productTitle }}</h3>
      <div v-if="cancelPolicy" class="cancel-policy-link" @click="showCancelPolicy = !showCancelPolicy">
        {{ cancelPolicy }} &gt;
      </div>
    </div>

    <!-- 退订政策详情（可展开） -->
    <div v-if="showCancelPolicy && cancelPolicyDetail" class="cancel-policy-detail">
      <p v-for="(line, i) in cancelPolicyDetail" :key="i">{{ line }}</p>
    </div>

    <!-- 人数步进器 -->
    <section class="quantity-stepper-card">
      <div class="stepper-row">
        <div class="stepper-label">
          <span class="stepper-title">人数</span>
        </div>
        <div class="stepper-control">
          <span class="stepper-price">{{ currency }} {{ formatPrice(unitPrice) }}</span>
          <button class="stepper-btn minus" :disabled="qty <= 1" @click="decreaseQty">−</button>
          <span class="stepper-value">{{ qty }}</span>
          <button class="stepper-btn plus" @click="increaseQty">+</button>
        </div>
      </div>
      <div class="stepper-hint">最多预订{{ maxQty }}份</div>
    </section>

    <!-- 游客信息 -->
    <section class="booking-section">
      <div class="section-header">
        <h3>游客信息 <span class="traveler-count">共 {{ travelers.length }} 位</span></h3>
        <div style="display:flex;gap:8px">
          <button class="btn-add-traveler" @click="openTravelersModal">从保存选择</button>
          <button class="btn-add-traveler" @click="addTraveler">+ 添加游客</button>
        </div>
      </div>

      <div
        v-for="(t, idx) in travelers"
        :key="idx"
        class="traveler-card"
      >
        <div class="traveler-card-header">
          <span class="traveler-index">游客 {{ idx + 1 }}</span>
          <button
            v-if="travelers.length > 1"
            class="btn-remove-traveler"
            @click="removeTraveler(idx)"
          >删除</button>
        </div>

        <!-- 证件类型：行内选择器 -->
        <div class="form-row" @click="cycleIdType(idx)">
          <span class="row-label">证件类型</span>
          <span class="row-value picker">
            {{ idTypeLabel(t.idType) }}
            <span class="arrow">›</span>
          </span>
        </div>

        <!-- 姓名：支持中/英/阿拉伯语切换 -->
        <div class="form-row name-row" :class="{ 'rtl': t.nameLang === 'ar' }">
          <span class="row-label">
            {{ nameLangLabel(t.nameLang) }}姓名 <em>*</em>
          </span>
          <div class="row-input-wrap">
            <input
              v-model="t.name"
              :placeholder="namePlaceholder(t.nameLang)"
              :dir="t.nameLang === 'ar' ? 'rtl' : 'ltr'"
            />
            <div class="lang-toggles">
              <button
                v-for="lang in ['zh','en','ar']"
                :key="lang"
                :class="['lang-btn', { active: t.nameLang === lang }]"
                @click.stop="t.nameLang = lang"
              >{{ langLabel(lang) }}</button>
            </div>
          </div>
        </div>

        <!-- 证件号 -->
        <div class="form-row">
          <span class="row-label">证件号</span>
          <div class="row-input-wrap">
            <input
              v-model="t.idNumber"
              :placeholder="idNumberPlaceholder(t.idType)"
              :dir="t.nameLang === 'ar' ? 'rtl' : 'ltr'"
            />
          </div>
        </div>

        <!-- 手机号 -->
        <div class="form-row">
          <span class="row-label">联系电话</span>
          <div class="row-input-wrap">
            <input
              v-model="t.phone"
              type="tel"
              placeholder="用于接收行程信息"
              :dir="t.nameLang === 'ar' ? 'rtl' : 'ltr'"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 联系人信息 -->
    <section class="booking-section">
      <div class="section-header">
        <h3>联系人信息</h3>
        <button class="btn-add-traveler" @click="openContactsModal">从保存选择</button>
      </div>
      <label>
        <span>联系人姓名 <em>*</em></span>
        <input v-model="contact.name" placeholder="请输入联系人姓名" />
      </label>
      <label>
        <span>联系邮箱 <em>*</em></span>
        <input v-model="contact.email" type="email" placeholder="your@email.com" />
      </label>
      <label>
        <span>联系手机</span>
        <input v-model="contact.phone" type="tel" placeholder="+971 ..." />
      </label>
    </section>

    <!-- 特殊需求 -->
    <section class="booking-section">
      <h3>特殊需求</h3>
      <label>
        <span>备注（选填）</span>
        <textarea v-model="remark" placeholder="如有特殊需求请在此说明…" rows="3"></textarea>
      </label>
    </section>

    <!-- 预订须知 -->
    <section class="booking-section notice">
      <h3>⚠️ 重要提示</h3>
      <ul>
        <li>提交订单后库存将自动预留（有效期 15 分钟）</li>
        <li>请在预留有效期内完成支付，逾期自动释放</li>
        <li>支付成功后将生成电子凭证</li>
        <li>价格由系统实时计算，以最终下单金额为准</li>
      </ul>
    </section>

    <!-- 提交按钮 -->
    <div class="booking-action">
      <button class="btn-primary" :disabled="submitting || !canSubmit" @click="submitOrder">
        {{ submitting ? '提交中…' : `确认下单 · ${currency} ${formatPrice(totalAmount)}` }}
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-toast">{{ error }}</div>

    <!-- 出行人管理弹窗 -->
    <div v-if="showTravelersModal" class="modal-overlay" @click.self="showTravelersModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>常用出行人</h3>
          <button class="modal-close" @click="showTravelersModal = false">✕</button>
        </div>
        <div v-if="savedTravelers.length === 0" class="modal-empty">暂无保存的出行人，请新增</div>
        <div v-else class="saved-list">
          <div v-for="st in savedTravelers" :key="st.id" class="saved-item" @click="selectSavedTraveler(st)">
            <div class="saved-item-info">
              <span class="saved-item-name">{{ st.name }}</span>
              <span class="saved-item-detail">{{ idTypeLabel(st.idType) }} {{ st.idNumber }} · {{ st.phone }}</span>
            </div>
            <div class="saved-item-actions">
              <button class="btn-saved-edit" @click.stop="startEditSavedTraveler(st)">编辑</button>
              <button class="btn-saved-del" @click.stop="deleteSavedTraveler(st.id)">删除</button>
            </div>
          </div>
        </div>
        <div class="modal-form">
          <h4>{{ editingTravelerIdx >= 0 ? '编辑出行人' : '新增出行人' }}</h4>
          <div class="modal-form-row">
            <span class="modal-form-label">姓名 *</span>
            <input v-model="travelerForm.name" placeholder="请输入姓名" />
          </div>
          <div class="modal-form-row" @click="cycleFormIdType">
            <span class="modal-form-label">证件类型</span>
            <span class="row-value picker">{{ idTypeLabel(travelerForm.idType) }} <span class="arrow">›</span></span>
          </div>
          <div class="modal-form-row">
            <span class="modal-form-label">证件号</span>
            <input v-model="travelerForm.idNumber" placeholder="请输入证件号" />
          </div>
          <div class="modal-form-row">
            <span class="modal-form-label">手机号</span>
            <input v-model="travelerForm.phone" type="tel" placeholder="请输入手机号" />
          </div>
          <button class="btn-save-traveler" @click="saveTravelerForm">保存</button>
        </div>
      </div>
    </div>

    <!-- 联系人管理弹窗 -->
    <div v-if="showContactsModal" class="modal-overlay" @click.self="showContactsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>常用联系人</h3>
          <button class="modal-close" @click="showContactsModal = false">✕</button>
        </div>
        <div v-if="savedContacts.length === 0" class="modal-empty">暂无保存的联系人，请新增</div>
        <div v-else class="saved-list">
          <div v-for="sc in savedContacts" :key="sc.id" class="saved-item" @click="selectSavedContact(sc)">
            <div class="saved-item-info">
              <span class="saved-item-name">{{ sc.name }}</span>
              <span class="saved-item-detail">{{ sc.email }} · {{ sc.phone }}</span>
            </div>
            <div class="saved-item-actions">
              <button class="btn-saved-edit" @click.stop="startEditSavedContact(sc)">编辑</button>
              <button class="btn-saved-del" @click.stop="deleteSavedContact(sc.id)">删除</button>
            </div>
          </div>
        </div>
        <div class="modal-form">
          <h4>{{ editingContactIdx >= 0 ? '编辑联系人' : '新增联系人' }}</h4>
          <div class="modal-form-row">
            <span class="modal-form-label">姓名 *</span>
            <input v-model="contactForm.name" placeholder="请输入姓名" />
          </div>
          <div class="modal-form-row">
            <span class="modal-form-label">邮箱 *</span>
            <input v-model="contactForm.email" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="modal-form-row">
            <span class="modal-form-label">手机</span>
            <input v-model="contactForm.phone" type="tel" placeholder="请输入手机号" />
          </div>
          <button class="btn-save-traveler" @click="saveContactForm">保存</button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createOrder, getProductDetail, getProductPackages, batchInventory } from '../api.js'

const route = useRoute()
const router = useRouter()

/* ── URL 仅传 ID，产品信息通过 API 获取 ── */
const productId = parseInt(route.query.productId) || 0
const packageId = parseInt(route.query.packageId) || 0
const date = route.query.date || ''
const inventoryId = parseInt(route.query.inventoryId) || 0
const qty = ref(parseInt(route.query.quantity) || 1)

/* ── 从 API 加载的产品信息 ── */
const productTitle = ref('旅游产品')
const currency = ref('AED')
const unitPrice = ref(0)
const maxQty = ref(8)
const packageName = ref('')
const loading = ref(true)
const loadError = ref('')

/** 创建空白游客对象 */
function emptyTraveler() {
  return { name: '', idType: 'passport', idNumber: '', phone: '', nameLang: 'zh' }
}

/* ── 退订政策（固定规则） ── */
const cancelPolicy = '订单确认成功后，取消需收取损失费70%起'
const cancelPolicyDetail = [
  '出行前7天以上取消，收取0%损失费',
  '出行前3-7天取消，收取30%损失费',
  '出行前1-3天取消，收取50%损失费',
  '出行当天取消，收取70%损失费',
  '出行后取消，收取100%损失费',
]

// sessionStorage key for form persistence
const STORAGE_KEY = `booking_form_${productId || 'default'}`

const showCancelPolicy = ref(false)

/** 通过 API 加载产品与套餐信息 */
async function loadProductData() {
  if (!productId || !packageId) {
    loading.value = false
    loadError.value = '缺少产品参数，请从产品详情页进入'
    return
  }
  try {
    const [product, pkgResp] = await Promise.all([
      getProductDetail(productId),
      getProductPackages(productId),
    ])
    productTitle.value = product.title || '旅游产品'
    currency.value = product.currency || 'AED'

    const pkg = (pkgResp.items || []).find(p => p.id === packageId)
    if (pkg) {
      packageName.value = pkg.name || ''
    }

    // 通过批量库存接口获取当日价格与可预订上限
    if (date) {
      try {
        const resp = await batchInventory({ packageId, startDate: date, endDate: date })
        const items = resp.items || []
        // 如果 URL 传了 inventoryId，精确匹配；否则取该日期第一条库存
        const inv = inventoryId
          ? items.find(i => i.id === inventoryId)
          : items[0]
        if (inv) {
          unitPrice.value = inv.unitPrice || product.minPrice || 0
          maxQty.value = (inv.capacity - (inv.reserved || 0)) > 0
            ? (inv.capacity - (inv.reserved || 0))
            : 8
        } else {
          unitPrice.value = product.minPrice || 0
          console.warn(`未找到日期 ${date} 的库存记录${inventoryId ? ` (inventoryId=${inventoryId})` : ''}`)
        }
      } catch (e) {
        console.error('获取库存价格失败', e)
        unitPrice.value = product.minPrice || 0
      }
    } else {
      unitPrice.value = product.minPrice || 0
    }
  } catch (e) {
    console.error('加载产品信息失败', e)
    loadError.value = '加载产品信息失败，请返回重试'
  } finally {
    loading.value = false
  }
}

/** 证件类型选项 */
const ID_TYPES = [
  { value: 'passport', label: '护照' },
  { value: 'id_card', label: '身份证' },
  { value: 'other_id', label: '其他证件' },
]

function idTypeLabel(val) {
  return ID_TYPES.find(t => t.value === val)?.label || '护照'
}

/** 点击循环切换证件类型 */
function cycleIdType(idx) {
  const cur = ID_TYPES.findIndex(t => t.value === travelers.value[idx].idType)
  const next = (cur + 1) % ID_TYPES.length
  travelers.value[idx].idType = ID_TYPES[next].value
}

/** 姓名语言标签 */
const LANG_MAP = { zh: '中', en: '英', ar: '阿' }
function langLabel(lang) { return LANG_MAP[lang] || lang }
function nameLangLabel(lang) {
  return { zh: '中文', en: '英文', ar: '阿拉伯文' }[lang] || '中文'
}
function namePlaceholder(lang) {
  return { zh: '请与证件姓名一致', en: 'As shown on ID', ar: 'كما في جواز السفر' }[lang] || ''
}
function idNumberPlaceholder(type) {
  return { passport: '请填写护照号', id_card: '请填写身份证号', other_id: '请填写证件号码' }[type] || '请填写证件号码'
}

/** 游客列表 — 初始根据 qty 生成对应数量，随 qty 联动 */
const travelers = ref(Array.from({ length: Math.max(1, qty.value) }, emptyTraveler))

/** qty 变化时同步 travelers 长度 */
watch(qty, (newQty) => {
  const cur = travelers.value.length
  if (newQty > cur) {
    for (let i = cur; i < newQty; i++) travelers.value.push(emptyTraveler())
  } else if (newQty < cur && newQty >= 1) {
    travelers.value.length = newQty
  }
})

/** 联系人信息 */
const contact = ref({ name: '', email: '', phone: '' })

/** 备注 */
const remark = ref('')

/** 从 sessionStorage 恢复表单数据 */
function restoreFormData() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return
    const data = JSON.parse(saved)
    if (data.qty != null) qty.value = data.qty
    if (data.travelers?.length) travelers.value = data.travelers
    if (data.contact) contact.value = { ...contact.value, ...data.contact }
    if (data.remark != null) remark.value = data.remark
  } catch (e) {
    console.warn('Failed to restore booking form:', e)
  }
}

/** 保存表单数据到 sessionStorage */
function saveFormData() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      qty: qty.value,
      travelers: travelers.value,
      contact: contact.value,
      remark: remark.value,
    }))
  } catch (e) {
    console.warn('Failed to save booking form:', e)
  }
}

// Watch form changes and auto-save
watch([qty, travelers, contact, remark], () => {
  saveFormData()
}, { deep: true })

// Restore on mount + load product data
onMounted(() => {
  restoreFormData()
  loadProductData()
  loadSavedTravelers()
  loadSavedContacts()
})

/** 下单成功后自动保存当前出行人和联系人到常用列表 */
function autoSaveTravelersAndContact() {
  // Save valid travelers
  for (const t of travelers.value) {
    if (!t.name.trim()) continue
    const exists = savedTravelers.value.some(
      s => s.name === t.name && s.idNumber === t.idNumber
    )
    if (!exists) {
      savedTravelers.value.push({ id: Date.now() + Math.random(), ...t })
    }
  }
  saveSavedTravelers()
  // Save contact
  if (contact.value.name.trim() && contact.value.email.trim()) {
    const exists = savedContacts.value.some(
      s => s.email === contact.value.email
    )
    if (!exists) {
      savedContacts.value.push({
        id: Date.now() + Math.random(),
        name: contact.value.name,
        email: contact.value.email,
        phone: contact.value.phone,
      })
    }
    saveSavedContacts()
  }
}

const submitting = ref(false)
const error = ref('')

const totalAmount = computed(() => unitPrice.value * qty.value)

/** 至少每位游客都填了姓名，且联系人姓名+邮箱不为空 */
const canSubmit = computed(() => {
  if (productId <= 0 || packageId <= 0) return false
  if (contact.value.name.trim() === '' || contact.value.email.trim() === '') return false
  return travelers.value.every(t => t.name.trim() !== '')
})

function formatPrice(v) {
  if (v == null) return '--'
  return String(v)
}

function goBackToProduct() {
  if (productId) {
    router.push({ name: 'ProductDetail', params: { id: productId } })
  } else {
    router.back()
  }
}

/** 减少人数 */
function decreaseQty() {
  if (qty.value > 1) qty.value--
}
/** 增加人数 */
function increaseQty() {
  if (qty.value < maxQty.value) qty.value++
}

/** 添加一位游客（无上限） */
function addTraveler() {
  travelers.value.push(emptyTraveler())
}

/** 删除一位游客（至少保留 1 位） */
function removeTraveler(idx) {
  if (travelers.value.length > 1) {
    travelers.value.splice(idx, 1)
  }
}

/* ── 出行人 / 联系人 管理 ── */
const SAVED_TRAVELERS_KEY = 'travel_saved_travelers'
const SAVED_CONTACTS_KEY = 'travel_saved_contacts'

const showTravelersModal = ref(false)
const showContactsModal = ref(false)
const savedTravelers = ref([])
const savedContacts = ref([])
const editingTravelerIdx = ref(-1)
const editingContactIdx = ref(-1)
const travelerForm = ref(emptyTraveler())
const contactForm = ref({ name: '', email: '', phone: '' })

function loadSavedTravelers() {
  try {
    const raw = localStorage.getItem(SAVED_TRAVELERS_KEY)
    savedTravelers.value = raw ? JSON.parse(raw) : []
  } catch { savedTravelers.value = [] }
}
function saveSavedTravelers() {
  localStorage.setItem(SAVED_TRAVELERS_KEY, JSON.stringify(savedTravelers.value))
}
function loadSavedContacts() {
  try {
    const raw = localStorage.getItem(SAVED_CONTACTS_KEY)
    savedContacts.value = raw ? JSON.parse(raw) : []
  } catch { savedContacts.value = [] }
}
function saveSavedContacts() {
  localStorage.setItem(SAVED_CONTACTS_KEY, JSON.stringify(savedContacts.value))
}

function openTravelersModal() {
  editingTravelerIdx.value = -1
  travelerForm.value = emptyTraveler()
  showTravelersModal.value = true
}
function openContactsModal() {
  editingContactIdx.value = -1
  contactForm.value = { name: '', email: '', phone: '' }
  showContactsModal.value = true
}

function selectSavedTraveler(st) {
  if (travelers.value.length === 1 && !travelers.value[0].name) {
    Object.assign(travelers.value[0], { ...st })
  } else {
    travelers.value.push({ ...st })
  }
  showTravelersModal.value = false
}
function startEditSavedTraveler(st) {
  const idx = savedTravelers.value.findIndex(s => s.id === st.id)
  if (idx >= 0) {
    editingTravelerIdx.value = idx
    travelerForm.value = { ...st }
  }
}
function deleteSavedTraveler(id) {
  savedTravelers.value = savedTravelers.value.filter(s => s.id !== id)
  saveSavedTravelers()
}
function cycleFormIdType() {
  const cur = ID_TYPES.findIndex(t => t.value === travelerForm.value.idType)
  travelerForm.value.idType = ID_TYPES[(cur + 1) % ID_TYPES.length].value
}
function saveTravelerForm() {
  if (!travelerForm.value.name.trim()) { error.value = '请输入出行人姓名'; return }
  if (editingTravelerIdx.value >= 0) {
    savedTravelers.value[editingTravelerIdx.value] = { ...travelerForm.value }
  } else {
    savedTravelers.value.push({ id: Date.now(), ...travelerForm.value })
  }
  saveSavedTravelers()
  editingTravelerIdx.value = -1
  travelerForm.value = emptyTraveler()
}

function selectSavedContact(sc) {
  contact.value = { name: sc.name, email: sc.email, phone: sc.phone }
  showContactsModal.value = false
}
function startEditSavedContact(sc) {
  const idx = savedContacts.value.findIndex(s => s.id === sc.id)
  if (idx >= 0) {
    editingContactIdx.value = idx
    contactForm.value = { ...sc }
  }
}
function deleteSavedContact(id) {
  savedContacts.value = savedContacts.value.filter(s => s.id !== id)
  saveSavedContacts()
}
function saveContactForm() {
  if (!contactForm.value.name.trim()) { error.value = '请输入联系人姓名'; return }
  if (!contactForm.value.email.trim()) { error.value = '请输入联系人邮箱'; return }
  if (editingContactIdx.value >= 0) {
    savedContacts.value[editingContactIdx.value] = { ...contactForm.value }
  } else {
    savedContacts.value.push({ id: Date.now(), ...contactForm.value })
  }
  saveSavedContacts()
  editingContactIdx.value = -1
  contactForm.value = { name: '', email: '', phone: '' }
}

function generateReservationKey() {
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function submitOrder() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const resp = await createOrder({
      productId,
      packageId,
      date,
      timeSlot: '',
      quantity: qty.value,
      customerEmail: contact.value.email,
      customerName: contact.value.name,
      customerPhone: contact.value.phone,
      travelers: travelers.value.map(t => ({
        name: t.name,
        idType: t.idType,
        idNumber: t.idNumber,
        phone: t.phone,
      })),
      remark: remark.value,
      reservationKey: generateReservationKey(),
    })
    // Clear saved form data on successful order
    sessionStorage.removeItem(STORAGE_KEY)
    // Save travelers and contact to saved lists for future use
    autoSaveTravelersAndContact()
    // 跳转到支付页
    router.push({
      name: 'Payment',
      query: {
        orderNo: resp.orderNo,
        totalAmount: resp.totalAmount,
        currency: resp.currency,
      },
    })
  } catch (e) {
    error.value = e.message || '下单失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.booking-nav {
  padding: 12px 16px 0;
}
.back-link {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
}
.booking-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 16px 8px;
  gap: 0;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0.4;
}
.step.active {
  opacity: 1;
}
.step.current {
  opacity: 1;
}
.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
}
.step.active .step-num {
  background: #1a1a2e;
  color: #fff;
}
.step small {
  font-size: 11px;
  color: #64748b;
}
.step-line {
  width: 40px;
  height: 2px;
  background: #e2e8f0;
  margin: 0 8px;
  margin-bottom: 18px;
}

/* ── 游客信息区域 ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-header h3 {
  margin: 0;
}
.traveler-count {
  font-size: 13px;
  font-weight: 400;
  color: #64748b;
  margin-left: 6px;
}
.btn-add-traveler {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.btn-add-traveler:hover {
  background: #dbeafe;
}

/* ── 游客卡片 ── */
.traveler-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 0 16px;
  margin-bottom: 12px;
  overflow: hidden;
}
.traveler-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 8px;
  border-bottom: 1px solid #f0f2f5;
}
.traveler-index {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.btn-remove-traveler {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  padding: 2px 6px;
}
.btn-remove-traveler:hover {
  text-decoration: underline;
}

/* ── 行内表单行 ── */
.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px solid #f5f6f8;
  min-height: 48px;
}
.form-row:last-child {
  border-bottom: none;
}
.row-label {
  font-size: 14px;
  color: #334155;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 72px;
}
.row-label em {
  color: #ef4444;
  font-style: normal;
}
.row-value {
  font-size: 14px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 4px;
}
.row-value.picker {
  cursor: pointer;
  user-select: none;
}
.row-value .arrow {
  font-size: 18px;
  color: #94a3b8;
  margin-left: 2px;
}

/* ── 行内输入框包裹 ── */
.row-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}
.row-input-wrap input {
  border: none;
  outline: none;
  font-size: 14px;
  text-align: right;
  background: transparent;
  color: #1e293b;
  max-width: 200px;
  font-family: inherit;
}
.row-input-wrap input::placeholder {
  color: #94a3b8;
}

/* ── 语言切换按钮 ── */
.lang-toggles {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.lang-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  font-size: 11px;
  color: #64748b;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  font-family: inherit;
  transition: all 0.15s;
}
.lang-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}
.lang-btn:hover:not(.active) {
  border-color: #2563eb;
  color: #2563eb;
}

/* ── RTL 模式（阿拉伯语） ── */
.form-row.rtl .row-input-wrap input {
  text-align: right;
  direction: rtl;
}
.form-row.rtl .row-label {
  direction: rtl;
}

/* ── 产品标题 + 退订政策 ── */
.booking-product-header {
  padding: 4px 0 12px;
}
.booking-product-title {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
  line-height: 1.4;
}
.cancel-policy-link {
  font-size: 13px;
  color: #ef4444;
  cursor: pointer;
  display: inline-block;
}
.cancel-policy-link:hover {
  text-decoration: underline;
}
.cancel-policy-detail {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.cancel-policy-detail p {
  font-size: 13px;
  color: #991b1b;
  margin: 4px 0;
  line-height: 1.5;
}

/* ── 人数步进器卡片 ── */
.quantity-stepper-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stepper-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}
.stepper-control {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stepper-price {
  font-size: 18px;
  font-weight: 700;
  color: #f97316;
  margin-right: 4px;
}
.stepper-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  font-size: 18px;
  color: #475569;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  font-family: inherit;
  transition: all 0.15s;
  line-height: 1;
}
.stepper-btn.plus {
  border-color: #2563eb;
  color: #2563eb;
}
.stepper-btn.plus:hover {
  background: #2563eb;
  color: #fff;
}
.stepper-btn.minus:hover:not(:disabled) {
  border-color: #475569;
  color: #1e293b;
}
.stepper-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.stepper-value {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  min-width: 24px;
  text-align: center;
}
.stepper-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

/* ── 弹窗 ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.modal-content {
  background: #fff;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  border-radius: 16px 16px 0 0;
  overflow-y: auto;
  padding: 0 16px 24px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;
  border-bottom: 1px solid #e8ecf1;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
}
.modal-empty {
  text-align: center;
  color: #94a3b8;
  padding: 32px 0;
  font-size: 14px;
}
.saved-list {
  padding: 8px 0;
}
.saved-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.saved-item:hover {
  background: #f8fafc;
}
.saved-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.saved-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.saved-item-detail {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.saved-item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 8px;
}
.btn-saved-edit {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
}
.btn-saved-del {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
}
.modal-form {
  border-top: 1px solid #e8ecf1;
  padding-top: 16px;
}
.modal-form h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.modal-form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f5f6f8;
}
.modal-form-row input {
  border: none;
  outline: none;
  font-size: 14px;
  text-align: right;
  background: transparent;
  color: #1e293b;
  max-width: 220px;
  font-family: inherit;
}
.modal-form-row input::placeholder {
  color: #94a3b8;
}
.modal-form-label {
  font-size: 14px;
  color: #334155;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-save-traveler {
  width: 100%;
  padding: 10px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  font-family: inherit;
}
.btn-save-traveler:hover {
  background: #1d4ed8;
}
</style>
