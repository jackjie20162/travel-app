<template>
  <div class="page-detail">
    <div v-if="loading" class="center" style="padding-top:120px">加载中…</div>
    <div v-else-if="!product" class="center empty">商品不存在或已下架</div>
    <template v-else>

      <!-- 1. 图片轮播 -->
      <div class="detail-carousel">
        <div class="carousel-main" @click="showAlbum = true">
          <img v-if="product.coverImage" :src="product.coverImage" class="carousel-img" alt=""/>
          <div v-else class="carousel-placeholder">
            <span class="cover-emoji-lg">{{ destEmoji(product.destination) }}</span>
          </div>
          <div class="carousel-counter">1/{{ allImages.length }}</div>
        </div>
        <div class="carousel-tabs">
          <span class="carousel-tab active">封面</span>
          <span class="carousel-tab">景点</span>
          <span class="carousel-tab">内部环境</span>
          <span class="carousel-tab">服务人员 2/3</span>
          <span class="carousel-tab">点评</span>
        </div>
        <button class="album-btn" @click="showAlbum = true">相册 &gt;</button>
        <button class="fav-btn-carousel" @click="toggle(product.id)">
          {{ isFav(product.id) ? '♥' : '♡' }}
        </button>
      </div>

      <!-- 2. 价格 + 销量 -->
      <div class="detail-price-row">
        <div class="price-main">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ formatPrice(displayMinPrice) }}</span>
          <span class="price-unit">起</span>
          <span class="price-info-icon">ⓘ</span>
        </div>
        <div class="price-sales">月销{{ monthlySales }}</div>
      </div>

      <!-- 3. 优惠标签 -->
      <div class="detail-promo-tags">
        <span class="promo-tag new">新客</span>
        <span class="promo-tag">最高减¥50</span>
        <span class="promo-tag">拿去花·信用购</span>
        <span class="promo-tag">立减30元</span>
        <span class="promo-link">去领券 &gt;</span>
      </div>

      <!-- 4. 标题 -->
      <h1 class="detail-title">{{ product.title }}</h1>

      <!-- 5. 标签行 -->
      <div class="detail-tags-row">
        <span class="tag-blue">携程优选</span>
        <span class="tag-orange">{{ product.destination || 'Dubai' }}热卖</span>
        <span class="tag-normal">放心游</span>
        <span class="tag-normal">上门接送等 &gt;</span>
      </div>

      <!-- 6. 评分 -->
      <div class="detail-rating-row" @click="scrollToReviews">
        <span class="rating-score">{{ avgRating ? avgRating.toFixed(1) : '--' }}</span>
        <span class="rating-text">"好评如潮"</span>
        <span class="rating-count">{{ reviewTotal }}条点评 &gt;</span>
      </div>

      <!-- 7. 产品亮点 -->
      <div class="detail-highlights-card">
        <div class="highlights-header">
          <h3>产品亮点</h3>
          <span class="highlights-emoji">👍</span>
        </div>
        <div class="highlights-list" :class="{ expanded: highlightsExpanded }">
          <p v-for="(h, i) in highlightList" :key="i" class="highlight-item">
            <span class="highlight-bullet"></span> {{ h }}
          </p>
        </div>
        <div v-if="highlightList.length > 2" class="highlights-more" @click="highlightsExpanded = !highlightsExpanded">
          {{ highlightsExpanded ? '收起' : '查看更多' }} &gt;
        </div>
      </div>

      <!-- 8. 选择日期·套餐 -->
      <div class="detail-datetime-section">
        <div class="datetime-header">
          <h2>选择日期·套餐</h2>
          <span class="datetime-refund">提前3天23:59前无损退 &gt;</span>
        </div>

        <!-- 横向日期条 -->
        <div class="date-strip" ref="dateStripRef">
          <div
            v-for="d in dateStrip"
            :key="d.dateStr"
            class="date-cell"
            :class="{ selected: selectedDate === d.dateStr, unavailable: !d.available }"
            @click="d.available && selectDate(d.dateStr)"
          >
            <span class="date-weekday">{{ d.weekday }}</span>
            <span class="date-day">{{ d.day }}</span>
            <span class="date-price" v-if="d.price !== null">¥{{ formatPrice(d.price) }}</span>
            <span class="date-unavailable" v-else>不可订</span>
          </div>
          <div class="date-cell more-dates" @click="openCalendar">
            <span class="date-weekday">更多</span>
            <span class="date-day">日期</span>
          </div>
        </div>

        <!-- 套餐卡片 -->
        <div class="package-cards" v-if="activePackages.length">
          <div
            v-for="pkg in activePackages"
            :key="pkg.id"
            class="package-card"
            :class="{ selected: selectedPkg?.id === pkg.id }"
            @click="selectPkg(pkg)"
          >
            <div v-if="pkg.id === activePackages[0].id" class="pkg-badge hot">近1月飙升</div>
            <div v-if="pkg.id === activePackages[activePackages.length - 1].id && activePackages.length > 1" class="pkg-badge low">低价</div>
            <div class="pkg-name">{{ pkg.name }}</div>
            <div class="pkg-desc">{{ pkg.code }}</div>
            <div class="pkg-price">
              <span class="pkg-price-value">¥{{ formatPrice(displayMinPrice) }}</span>
              <span class="pkg-price-unit">起</span>
            </div>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="datetime-footer">
          <span>① 最晚今日22:00（当地时间）前可订明日 | 以上价格按1份起订，计算平均每份套餐价格</span>
        </div>
        <div class="datetime-footer2">
          <span class="fav-count">400+人收藏</span>
        </div>
      </div>

      <!-- 9. 产品描述 -->
      <div v-if="product.description" class="detail-desc-section">
        <h2>详情</h2>
        <p class="detail-desc-text" :class="{ expanded: descExpanded }" @click="descExpanded = !descExpanded">
          {{ product.description }}
        </p>
        <small v-if="(product.description || '').length > 100" class="desc-toggle">
          {{ descExpanded ? '收起 ▲' : '展开更多 ▼' }}
        </small>
      </div>

      <!-- 10. 预订须知 -->
      <div v-if="product.bookingNotice" class="detail-notice-section">
        <h2>预订须知</h2>
        <div class="booking-notice">
          <p>{{ product.bookingNotice }}</p>
        </div>
      </div>

      <!-- 11. 用户评价 -->
      <div class="detail-reviews-section" ref="reviewsSection">
        <h2>用户评价 ({{ reviewTotal }})</h2>
        <div v-if="reviews.length === 0 && !loading" class="reviews-empty">暂无评价，快来成为第一个评价的人吧！</div>
        <div v-else class="reviews-list">
          <div v-for="r in reviews" :key="r.id" class="review-item">
            <div class="review-top">
              <span class="review-user">{{ r.userName || '匿名用户' }}</span>
              <div class="review-stars">
                <span v-for="n in 5" :key="n" class="mini-star" :class="{ active: r.rating >= n }">★</span>
              </div>
            </div>
            <p v-if="r.content" class="review-content">{{ r.content }}</p>
            <div v-if="r.images" class="review-images">
              <img v-for="(img, i) in r.images.split(',').filter(Boolean)" :key="i" :src="img" class="review-thumb" alt=""/>
            </div>
            <div v-if="r.replyContent" class="review-reply">
              <strong>商家回复：</strong>{{ r.replyContent }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部占位 -->
      <div style="height:80px"></div>

      <!-- 底部操作栏 -->
      <div class="detail-action-bar-v2">
        <div class="action-icons">
          <div class="action-icon" @click="router.push('/')">
            <span>🏠</span><small>店铺</small>
          </div>
          <div class="action-icon" @click="toggle(product.id)">
            <span>{{ isFav(product.id) ? '♥' : '♡' }}</span><small>收藏</small>
          </div>
        </div>
        <div class="action-buttons">
          <button class="btn-service">问客服</button>
          <button class="btn-book-v2" :disabled="!canBook" @click="openBookingModal">立即预订</button>
        </div>
      </div>

      <!-- 日历弹窗 -->
      <div v-if="showCalendar" class="calendar-overlay" @click.self="showCalendar = false">
        <div class="calendar-modal">
          <div class="calendar-header">
            <button class="cal-close" @click="showCalendar = false">✕</button>
            <h3>选择日期</h3>
          </div>
          <div class="calendar-tip">
            ① 以下价格按1份起订，计算平均每份套餐价格
          </div>

          <!-- 月份导航 -->
          <div class="cal-month-nav">
            <button class="cal-nav-btn" @click="calPrevMonth">‹</button>
            <span class="cal-month-title">{{ calYear }}年{{ calMonth }}月</span>
            <button class="cal-nav-btn" @click="goNextMonth">›</button>
          </div>

          <!-- 星期标题 -->
          <div class="cal-weekdays">
            <span v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="cal-weekday" :class="{ weekend: w === '日' || w === '六' }">{{ w }}</span>
          </div>

          <!-- 日期网格 -->
          <div class="cal-days">
            <div v-for="n in calLeadingZeros" :key="'e'+n" class="cal-day empty"></div>
            <div
              v-for="d in calDays"
              :key="d.dateStr"
              class="cal-day"
              :class="{
                selected: selectedDate === d.dateStr,
                unavailable: !d.available,
                today: d.isToday,
                weekend: d.isWeekend,
                holiday: d.holiday
              }"
              @click="d.available && selectDateFromCal(d.dateStr)"
            >
              <span class="cal-day-num">{{ d.day }}</span>
              <span class="cal-day-price" v-if="d.price !== null">¥{{ formatPrice(d.price) }}</span>
              <span class="cal-day-unavail" v-else-if="!d.available">不可订</span>
              <span class="cal-holiday-tag" v-if="d.holiday">{{ d.holiday }}</span>
            </div>
          </div>

          <!-- 下月 -->
          <div class="cal-month-title" style="margin-top:16px;padding:0 8px">{{ calNextYear }}年{{ calNextMonth }}月</div>
          <div class="cal-weekdays">
            <span v-for="w in ['日','一','二','三','四','五','六']" :key="w" class="cal-weekday" :class="{ weekend: w === '日' || w === '六' }">{{ w }}</span>
          </div>
          <div class="cal-days">
            <div v-for="n in calNextLeadingZeros" :key="'ne'+n" class="cal-day empty"></div>
            <div
              v-for="d in calNextDays"
              :key="d.dateStr"
              class="cal-day"
              :class="{
                selected: selectedDate === d.dateStr,
                unavailable: !d.available,
                today: d.isToday,
                weekend: d.isWeekend,
                holiday: d.holiday
              }"
              @click="d.available && selectDateFromCal(d.dateStr)"
            >
              <span class="cal-day-num">{{ d.day }}</span>
              <span class="cal-day-price" v-if="d.price !== null">¥{{ formatPrice(d.price) }}</span>
              <span class="cal-day-unavail" v-else-if="!d.available">不可订</span>
              <span class="cal-holiday-tag" v-if="d.holiday">{{ d.holiday }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 相册弹窗 -->
      <div v-if="showAlbum" class="calendar-overlay" @click.self="showAlbum = false">
        <div class="calendar-modal" style="max-width:500px">
          <div class="calendar-header">
            <button class="cal-close" @click="showAlbum = false">✕</button>
            <h3>产品相册</h3>
          </div>
          <div class="album-grid">
            <div v-for="(img, i) in allImages" :key="i" class="album-item">
              <img :src="img" :alt="'photo ' + (i+1)"/>
            </div>
            <div v-if="!allImages.length" class="center muted">暂无图片</div>
          </div>
        </div>
      </div>

      <!-- 预订确认弹窗 -->
      <div v-if="showBookingModal" class="calendar-overlay" @click.self="showBookingModal = false">
        <div class="calendar-modal">
          <h3>确认预订信息</h3>
          <div class="booking-confirm-info">
            <div class="confirm-row"><span>产品</span><span>{{ product.title }}</span></div>
            <div class="confirm-row"><span>套餐</span><span>{{ selectedPkg?.name || '-' }}</span></div>
            <div class="confirm-row"><span>日期</span><span>{{ selectedDate || '-' }}</span></div>
            <div class="confirm-row"><span>人数</span><span>{{ quantity }}</span></div>
            <div class="confirm-row total">
              <span>合计</span>
              <strong>¥{{ formatPrice((selectedInventory?.unitPrice || displayMinPrice) * quantity) }}</strong>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showBookingModal = false">返回修改</button>
            <button class="btn-primary" @click="goBooking">确认，去下单</button>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail, getProductPackages, checkInventory, batchInventory, getProductReviews } from '../api.js'
import { useFavorites } from '../composables/favorites.js'
import { useUser } from '../composables/user.js'

const route = useRoute()
const router = useRouter()
const { isFav, toggle } = useFavorites()
const user = useUser()

const product = ref(null)
const packages = ref([])
const loading = ref(true)
const selectedPkg = ref(null)
const selectedDate = ref('')
const quantity = ref(1)
const selectedInventory = ref(null)
const checkingInventory = ref(false)
const descExpanded = ref(false)
const highlightsExpanded = ref(false)
const showBookingModal = ref(false)
const showCalendar = ref(false)
const showAlbum = ref(false)
const dateStripRef = ref(null)
const reviewsSection = ref(null)

// 模拟数据
const monthlySales = ref(79)

// 评价数据
const reviews = ref([])
const reviewTotal = ref(0)
const avgRating = ref(0)

// 日历状态
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)

// 库存缓存: { dateStr: inventoryItem }
const inventoryCache = ref({})
// 从库存数据计算的实际最低价格（当产品 minPrice 为 0 时使用）
const computedMinPrice = ref(0)

const activePackages = computed(() =>
  packages.value.filter(p => p.status === 'ACTIVE')
)

const allImages = computed(() => {
  if (!product.value) return []
  const imgs = []
  if (product.value.coverImage) imgs.push(product.value.coverImage)
  if (product.value.images) {
    product.value.images.split(',').map(s => s.trim()).filter(Boolean).forEach(img => {
      if (!imgs.includes(img)) imgs.push(img)
    })
  }
  return imgs
})

const highlightList = computed(() => {
  if (!product.value?.highlights) return []
  return product.value.highlights.split(',').map(s => s.trim()).filter(Boolean)
})

const canBook = computed(() =>
  selectedPkg.value &&
  selectedDate.value &&
  quantity.value > 0
)

// 显示用的最低价格：优先用产品 minPrice，为 0 时用库存计算值
const displayMinPrice = computed(() => {
  if (product.value?.minPrice && product.value.minPrice > 0) return product.value.minPrice
  return computedMinPrice.value || 0
})

// 中国法定节假日
const holidays = {
  '2026-01-01': '元旦', '2026-01-02': '元旦', '2026-01-03': '元旦',
  '2026-02-14': '情人节',
  '2026-02-17': '春节', '2026-02-18': '春节', '2026-02-19': '春节',
  '2026-02-20': '春节', '2026-02-21': '春节', '2026-02-22': '春节',
  '2026-02-23': '春节',
  '2026-04-04': '清明', '2026-04-05': '清明', '2026-04-06': '清明',
  '2026-05-01': '劳动节', '2026-05-02': '劳动节', '2026-05-03': '劳动节',
  '2026-05-04': '劳动节', '2026-05-05': '劳动节',
  '2026-06-19': '端午', '2026-06-20': '端午', '2026-06-21': '端午',
  '2026-09-25': '中秋', '2026-09-26': '中秋', '2026-09-27': '中秋',
  '2026-10-01': '国庆节', '2026-10-02': '国庆节', '2026-10-03': '国庆节',
  '2026-10-04': '国庆节', '2026-10-05': '国庆节', '2026-10-06': '国庆节',
  '2026-10-07': '国庆节',
}

const weekdayNames = ['日', '一', '二', '三', '四', '五', '六']

function formatPrice(v) {
  if (v == null) return '--'
  return String(v)
}

function destEmoji(dest) {
  const map = { 'desert': '️', 'abu dhabi': '🕌', 'marina': '⛵', 'culture': '🎭' }
  return map[(dest || '').toLowerCase()] || '🏙️'
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function isPastDate(dateStr) {
  return dateStr < getTodayStr()
}

// 生成日期条数据（未来14天）
const dateStrip = computed(() => {
  const days = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const inv = inventoryCache.value[dateStr]
    const available = !isPastDate(dateStr) && (!inv || inv.isOpen !== false)
    days.push({
      dateStr,
      weekday: weekdayNames[d.getDay()],
      day: d.getDate(),
      price: inv ? inv.unitPrice : null,
      available,
    })
  }
  return days
})

// 日历数据
function buildCalDays(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const leadingZeros = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const todayStr = getTodayStr()
  const days = []

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const inv = inventoryCache.value[dateStr]
    const past = isPastDate(dateStr)
    const available = !past && (!inv || inv.isOpen !== false)
    const dayOfWeek = new Date(year, month - 1, d).getDay()

    days.push({
      dateStr,
      day: d,
      price: inv ? inv.unitPrice : null,
      available,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      holiday: holidays[dateStr] || null,
    })
  }

  return { leadingZeros, days }
}

const calDaysData = computed(() => buildCalDays(calYear.value, calMonth.value))
const calLeadingZeros = computed(() => calDaysData.value.leadingZeros)
const calDays = computed(() => calDaysData.value.days)

const calNextMonth = computed(() => calMonth.value === 12 ? 1 : calMonth.value + 1)
const calNextYear = computed(() => calMonth.value === 12 ? calYear.value + 1 : calYear.value)
const calNextDaysData = computed(() => buildCalDays(calNextYear.value, calNextMonth.value))
const calNextLeadingZeros = computed(() => calNextDaysData.value.leadingZeros)
const calNextDays = computed(() => calNextDaysData.value.days)

function calPrevMonth() {
  if (calMonth.value === 1) {
    calYear.value--
    calMonth.value = 12
  } else {
    calMonth.value--
  }
  loadMonthInventory()
}

function goNextMonth() {
  if (calMonth.value === 12) {
    calYear.value++
    calMonth.value = 1
  } else {
    calMonth.value++
  }
  loadMonthInventory()
}

// 加载某月的库存数据
async function loadMonthInventory() {
  if (!selectedPkg.value) return
  const year = calYear.value
  const month = calMonth.value
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  try {
    const resp = await batchInventory({
      packageId: selectedPkg.value.id,
      startDate,
      endDate,
    })
    const items = resp.items || []
    items.forEach(item => {
      inventoryCache.value[item.date] = item
    })
    // 从库存数据计算最低价格
    const prices = Object.values(inventoryCache.value)
      .map(i => i.unitPrice)
      .filter(p => p != null && p > 0)
    if (prices.length > 0) {
      const invMin = Math.min(...prices)
      // 只有当产品 minPrice 为 0 时才用库存最低价覆盖显示
      if (!product.value?.minPrice || product.value.minPrice <= 0) {
        computedMinPrice.value = invMin
      }
    }
  } catch (e) {
    console.error('加载月度库存失败', e)
  }
}

function selectPkg(pkg) {
  selectedPkg.value = pkg
  selectedDate.value = ''
  selectedInventory.value = null
  inventoryCache.value = {}
  // 重新加载当前月份库存
  loadMonthInventory()
  // 滚动日期条
  nextTick(() => {
    if (dateStripRef.value) {
      dateStripRef.value.scrollLeft = 0
    }
  })
}

function selectDate(dateStr) {
  selectedDate.value = dateStr
  const inv = inventoryCache.value[dateStr]
  selectedInventory.value = inv || null
  // 滚动到选中位置并居中
  nextTick(() => {
    if (!dateStripRef.value) return
    const strip = dateStripRef.value
    const cells = strip.querySelectorAll('.date-cell:not(.more-dates)')
    const idx = dateStrip.value.findIndex(d => d.dateStr === dateStr)
    if (idx >= 0 && cells[idx]) {
      const cell = cells[idx]
      const cellLeft = cell.offsetLeft
      const cellWidth = cell.offsetWidth
      const stripWidth = strip.offsetWidth
      strip.scrollTo({ left: cellLeft - stripWidth / 2 + cellWidth / 2, behavior: 'smooth' })
    }
  })
}

function selectDateFromCal(dateStr) {
  selectedDate.value = dateStr
  const inv = inventoryCache.value[dateStr]
  selectedInventory.value = inv || null
  showCalendar.value = false
  // 滚动日期条使选中日期居中
  nextTick(() => {
    if (!dateStripRef.value) return
    const strip = dateStripRef.value
    const cells = strip.querySelectorAll('.date-cell:not(.more-dates)')
    const idx = dateStrip.value.findIndex(d => d.dateStr === dateStr)
    if (idx >= 0 && cells[idx]) {
      const cell = cells[idx]
      const cellLeft = cell.offsetLeft
      const cellWidth = cell.offsetWidth
      const stripWidth = strip.offsetWidth
      strip.scrollTo({ left: cellLeft - stripWidth / 2 + cellWidth / 2, behavior: 'smooth' })
    }
  })
}

function openCalendar() {
  if (!selectedPkg.value) {
    // 自动选第一个套餐
    if (activePackages.value.length) {
      selectPkg(activePackages.value[0])
    }
  }
  showCalendar.value = true
  if (selectedPkg.value && Object.keys(inventoryCache.value).length === 0) {
    loadMonthInventory()
  }
}

async function loadProduct() {
  loading.value = true
  try {
    const data = await getProductDetail(route.params.id)
    product.value = data
    const pkgResp = await getProductPackages(route.params.id)
    packages.value = pkgResp.items || []
    if (activePackages.value.length === 1) {
      selectPkg(activePackages.value[0])
    }
    // Load reviews
    loadReviews()
  } catch (e) {
    console.error('加载商品详情失败', e)
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  try {
    const resp = await getProductReviews(route.params.id, { pageSize: 10 })
    reviews.value = resp.items || []
    reviewTotal.value = resp.total || 0
    avgRating.value = resp.avgRating || 0
  } catch (e) {
    console.error('加载评价失败', e)
  }
}

function scrollToReviews() {
  if (reviewsSection.value) {
    reviewsSection.value.scrollIntoView({ behavior: 'smooth' })
  }
}

function openBookingModal() {
  if (!canBook.value) return
  if (!user.isLoggedIn.value) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  showBookingModal.value = true
}

function goBooking() {
  if (!canBook.value) return
  showBookingModal.value = false
  const query = {
    productId: product.value.id,
    packageId: selectedPkg.value.id,
    date: selectedDate.value,
    quantity: quantity.value,
  }
  if (selectedInventory.value?.id) {
    query.inventoryId = selectedInventory.value.id
  }
  router.push({ name: 'Booking', query })
}

onMounted(loadProduct)
</script>

<style scoped>
.detail-reviews-section {
  padding: 16px;
}
.detail-reviews-section h2 {
  font-size: 17px;
  margin: 0 0 12px;
}
.reviews-empty {
  text-align: center;
  color: #999;
  padding: 24px 0;
  font-size: 14px;
}
.review-item {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.review-user {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.review-stars {
  display: flex;
  gap: 1px;
}
.mini-star {
  font-size: 14px;
  color: #ddd;
}
.mini-star.active {
  color: #ffb400;
}
.review-content {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  margin: 6px 0;
}
.review-images {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.review-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
}
.review-reply {
  background: #f7f8fa;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 8px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}
.review-reply strong {
  color: #e8a33a;
}
</style>
