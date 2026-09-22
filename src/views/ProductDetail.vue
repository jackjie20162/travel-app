<template>
  <div class="page-detail">
    <div v-if="loading" class="center" style="padding-top:120px">{{ t('product.loading') }}</div>
    <div v-else-if="!product" class="center empty">{{ t('product.notFound') }}</div>
    <template v-else>

      <!-- 1. 图片轮播 -->
      <div class="detail-carousel">
        <div class="carousel-main" @click="showAlbum = true">
          <img v-if="currentImage" :src="currentImage" class="carousel-img" alt=""/>
          <div v-else class="carousel-placeholder">
            <span class="cover-emoji-lg">{{ destEmoji(product.destination) }}</span>
          </div>
          <button v-if="allImages.length > 1" class="carousel-nav prev" @click.stop="prevImage">‹</button>
          <button v-if="allImages.length > 1" class="carousel-nav next" @click.stop="nextImage">›</button>
          <div v-if="allImages.length" class="carousel-counter">{{ carouselIndex + 1 }}/{{ allImages.length }}</div>
        </div>
        <div class="carousel-tabs">
          <span class="carousel-tab active">{{ t('product.tabCover') }}</span>
          <span class="carousel-tab">{{ t('product.tabScenic') }}</span>
          <span class="carousel-tab">{{ t('product.tabInterior') }}</span>
          <span class="carousel-tab">{{ t('product.tabStaff') }}</span>
          <span class="carousel-tab">{{ t('product.tabReviews') }}</span>
        </div>
        <button class="album-btn" @click="showAlbum = true">{{ t('product.album') }}</button>
        <button class="fav-btn-carousel" @click="toggle(product.id)">
          {{ isFav(product.id) ? '♥' : '♡' }}
        </button>
      </div>

      <!-- 2. 价格 + 销量 -->
      <div class="detail-price-row">
        <div class="price-main">
          <span class="price-value">{{ formatPrice(displayMinPrice) }}</span>
          <span class="price-unit">{{ t('product.from') }}</span>
          <span class="price-info-icon">ⓘ</span>
        </div>
        <div class="price-sales">{{ t('product.monthlySales', { count: monthlySales }) }}</div>
      </div>

      <!-- 3. 优惠标签 -->
      <div class="detail-promo-tags">
        <span class="promo-tag new">{{ t('product.promoNew') }}</span>
        <span class="promo-tag">{{ t('product.promoMaxOff') }}</span>
        <span class="promo-tag">{{ t('product.promoCredit') }}</span>
        <span class="promo-tag">{{ t('product.promoInstant') }}</span>
        <span class="promo-link">{{ t('product.promoCoupon') }}</span>
      </div>

      <!-- 4. 标题 -->
      <h1 class="detail-title">{{ product.title }}</h1>

      <!-- 5. 标签行 -->
      <div class="detail-tags-row">
        <span class="tag-blue">{{ t('product.tagPreferred') }}</span>
        <span class="tag-orange">{{ t('product.tagHot', { dest: product.destination || 'Dubai' }) }}</span>
        <span class="tag-normal">{{ t('product.tagWorryFree') }}</span>
        <span class="tag-normal">{{ t('product.tagPickup') }}</span>
      </div>

      <!-- 6. 评分 -->
      <div class="detail-rating-row" @click="scrollToReviews">
        <span class="rating-score">{{ avgRating ? avgRating.toFixed(1) : '--' }}</span>
        <span class="rating-text">{{ t('product.ratingPraise') }}</span>
        <span class="rating-count">{{ t('product.reviewCount', { count: reviewTotal }) }}</span>
      </div>

      <!-- 7. 产品亮点 -->
      <div class="detail-highlights-card">
        <div class="highlights-header">
          <h3>{{ t('product.highlights') }}</h3>
          <span class="highlights-emoji">👍</span>
        </div>
        <div class="highlights-list" :class="{ expanded: highlightsExpanded }">
          <p v-for="(h, i) in highlightList" :key="i" class="highlight-item">
            <span class="highlight-bullet"></span> {{ h }}
          </p>
        </div>
        <div v-if="highlightList.length > 2" class="highlights-more" @click="highlightsExpanded = !highlightsExpanded">
          {{ highlightsExpanded ? t('common.collapse') : t('common.more') }} &gt;
        </div>
      </div>

      <!-- 7.5 宣传视频 -->
      <div v-if="hasVideo" class="detail-video-card">
        <div class="video-header">
          <h3>{{ t('product.productVideo') }}</h3>
          <span class="video-emoji">🎬</span>
        </div>
        <video v-if="!videoIsHls" class="detail-video" :src="videoUrl" controls playsinline preload="metadata"></video>
        <div v-else class="video-hls-note">
          <a :href="videoUrl" target="_blank" rel="noopener">{{ t('product.productVideo') }} ▶</a>
        </div>
      </div>

      <!-- 8. 选择日期·套餐 -->
      <div class="detail-datetime-section">
        <div class="datetime-header">
          <h2>{{ t('product.selectDatePackage') }}</h2>
          <span class="datetime-refund">{{ t('product.refundBefore') }}</span>
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
            <span class="date-price" v-if="d.price !== null">{{ formatPrice(d.price) }}</span>
            <span class="date-unavailable" v-else>{{ t('product.unavailable') }}</span>
          </div>
          <div class="date-cell more-dates" @click="openCalendar">
            <span class="date-weekday">{{ t('product.moreDates') }}</span>
            <span class="date-day">{{ t('product.moreDatesSub') }}</span>
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
            <div v-if="pkg.id === activePackages[0].id" class="pkg-badge hot">{{ t('product.pkgHot') }}</div>
            <div v-if="pkg.id === activePackages[activePackages.length - 1].id && activePackages.length > 1" class="pkg-badge low">{{ t('product.pkgLow') }}</div>
            <div class="pkg-name">{{ pkg.name }}</div>
            <div class="pkg-desc">{{ pkg.code }}</div>
            <div class="pkg-price">
              <span class="pkg-price-value">{{ formatPrice(displayMinPrice) }}</span>
              <span class="pkg-price-unit">{{ t('product.from') }}</span>
            </div>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="datetime-footer">
          <span>{{ t('product.datetimeFooter') }}</span>
        </div>
        <div class="datetime-footer2">
          <span class="fav-count">{{ t('product.favCount') }}</span>
        </div>
      </div>

      <!-- 行程 -->
      <div v-if="itineraryStops.length" class="detail-itinerary-section">
        <div class="itinerary-header">
          <h2>{{ t('product.itinerary') }}</h2>
          <span class="itinerary-count">{{ t('product.itineraryCount', { count: itineraryStops.length }) }}</span>
        </div>
        <div class="itinerary-timeline">
          <div v-for="(stop, i) in itineraryStops" :key="stop.id || i" class="itinerary-item">
            <div class="itinerary-rail">
              <span class="itinerary-dot">{{ stopIcon(stop.stopType) }}</span>
              <span v-if="i < itineraryStops.length - 1" class="itinerary-line"></span>
            </div>
            <div class="itinerary-body">
              <div class="itinerary-title-row">
                <span class="itinerary-type">{{ stopTypeLabel(stop.stopType) }}</span>
                <span class="itinerary-title">{{ stopTitle(stop) }}</span>
              </div>
              <div v-if="stopMeta(stop).length" class="itinerary-meta">
                <span v-for="(m, mi) in stopMeta(stop)" :key="mi" class="itinerary-meta-item">{{ m }}</span>
              </div>
              <p v-if="stopDesc(stop)" class="itinerary-desc">{{ stopDesc(stop) }}</p>
              <div v-if="stopImages(stop).length" class="itinerary-images">
                <img v-for="(img, ii) in stopImages(stop)" :key="ii" :src="img" alt=""/>
              </div>
              <div v-if="isPickupMeeting(stop)" class="itinerary-pickup-range">
                <div class="range-label">{{ t('product.pickupRange') }}</div>
                <div class="range-tags">
                  <span class="range-tag">{{ pickupRangeModeLabel(stop.tp) }}</span>
                  <span v-for="opt in pickupRangeOptionLabels(stop.tp)" :key="opt" class="range-tag">{{ opt }}</span>
                </div>
                <PickupRangeMap v-if="pickupPolygon(stop.tp).length >= 3" :polygon="pickupPolygon(stop.tp)" />
              </div>
              <div v-if="stop.stopType === 'RETURN'" class="itinerary-return">
                <div v-if="stop.tp.dropoffService" class="return-block">
                  <div class="return-label">{{ t('product.dropoffService') }}</div>
                  <div v-for="(r, ri) in stop.tp.dropoffPoints" :key="'d'+ri" class="return-dropoff">
                    <div class="return-line">{{ r.time }} · {{ t('product.dropoffCity', { city: r.city }) }}</div>
                    <div class="range-tags">
                      <span class="range-tag">{{ pickupRangeModeLabel(r) }}</span>
                      <span v-for="opt in pickupRangeOptionLabels(r)" :key="opt" class="range-tag">{{ opt }}</span>
                    </div>
                    <PickupRangeMap v-if="pickupPolygon(r).length >= 3" :polygon="pickupPolygon(r)" />
                    <p v-if="r.note" class="return-note">{{ r.note }}</p>
                  </div>
                </div>
                <div v-if="stop.tp.dispersalService" class="return-block">
                  <div class="return-label">{{ t('product.disperseService') }}</div>
                  <div v-for="(r, ri) in stop.tp.dispersalPoints" :key="'s'+ri" class="return-line">{{ r.time }} · {{ r.city }} · {{ r.pointName }}</div>
                </div>
                <div v-if="stop.tp.freeDispersal" class="return-block">
                  <div class="return-label">{{ t('product.freeDispersal') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 9. 产品描述 -->
      <div v-if="product.description" class="detail-desc-section">
        <h2>{{ t('product.detail') }}</h2>
        <p class="detail-desc-text" :class="{ expanded: descExpanded }" @click="descExpanded = !descExpanded">
          {{ product.description }}
        </p>
        <small v-if="(product.description || '').length > 100" class="desc-toggle">
          {{ descExpanded ? t('product.collapseText') : t('product.expandMore') }}
        </small>
      </div>

      <!-- 10. 预订须知 -->
      <div v-if="product.bookingNotice" class="detail-notice-section">
        <h2>{{ t('product.bookingNotice') }}</h2>
        <div class="booking-notice">
          <p>{{ product.bookingNotice }}</p>
        </div>
      </div>

      <!-- 11. 用户评价 -->
      <div class="detail-reviews-section" ref="reviewsSection">
        <h2>{{ t('product.userReviews', { count: reviewTotal }) }}</h2>
        <div v-if="reviews.length === 0 && !loading" class="reviews-empty">{{ t('product.noReviews') }}</div>
        <div v-else class="reviews-list">
          <div v-for="r in reviews" :key="r.id" class="review-item">
            <div class="review-top">
              <span class="review-user">{{ r.userName || t('product.anonymous') }}</span>
              <div class="review-stars">
                <span v-for="n in 5" :key="n" class="mini-star" :class="{ active: r.rating >= n }">★</span>
              </div>
            </div>
            <p v-if="r.content" class="review-content">{{ r.content }}</p>
            <div v-if="r.images" class="review-images">
              <img v-for="(img, i) in r.images.split(',').filter(Boolean)" :key="i" :src="img" class="review-thumb" alt=""/>
            </div>
            <div v-if="r.replyContent" class="review-reply">
              <strong>{{ t('product.merchantReply') }}</strong>{{ r.replyContent }}
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
            <span>🏠</span><small>{{ t('product.shop') }}</small>
          </div>
          <div class="action-icon" @click="toggle(product.id)">
            <span>{{ isFav(product.id) ? '♥' : '♡' }}</span><small>{{ t('product.favorite') }}</small>
          </div>
        </div>
        <div class="action-buttons">
          <button class="btn-service" @click="goSupport">{{ t('product.askService') }}</button>
          <button class="btn-book-v2" :disabled="!canBook" @click="openBookingModal">{{ t('product.bookNow') }}</button>
        </div>
      </div>

      <!-- 日历弹窗 -->
      <div v-if="showCalendar" class="calendar-overlay" @click.self="showCalendar = false">
        <div class="calendar-modal">
          <div class="calendar-header">
            <button class="cal-close" @click="showCalendar = false">✕</button>
            <h3>{{ t('product.selectDate') }}</h3>
          </div>
          <div class="calendar-tip">
            {{ t('product.calendarTip') }}
          </div>

          <!-- 月份导航 -->
          <div class="cal-month-nav">
            <button class="cal-nav-btn" @click="calPrevMonth">‹</button>
            <span class="cal-month-title">{{ t('product.calMonthTitle', { year: calYear, month: calMonth }) }}</span>
            <button class="cal-nav-btn" @click="goNextMonth">›</button>
          </div>

          <!-- 星期标题 -->
          <div class="cal-weekdays">
            <span v-for="(w, wi) in weekdayLabels" :key="wi" class="cal-weekday" :class="{ weekend: wi === 0 || wi === 6 }">{{ w }}</span>
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
              <span class="cal-day-price" v-if="d.price !== null">{{ formatPrice(d.price) }}</span>
              <span class="cal-day-unavail" v-else-if="!d.available">{{ t('product.unavailable') }}</span>
              <span class="cal-holiday-tag" v-if="d.holiday">{{ d.holiday }}</span>
            </div>
          </div>

          <!-- 下月 -->
          <div class="cal-month-title" style="margin-top:16px;padding:0 8px">{{ t('product.calMonthTitle', { year: calNextYear, month: calNextMonth }) }}</div>
          <div class="cal-weekdays">
            <span v-for="(w, wi) in weekdayLabels" :key="wi" class="cal-weekday" :class="{ weekend: wi === 0 || wi === 6 }">{{ w }}</span>
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
              <span class="cal-day-price" v-if="d.price !== null">{{ formatPrice(d.price) }}</span>
              <span class="cal-day-unavail" v-else-if="!d.available">{{ t('product.unavailable') }}</span>
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
            <h3>{{ t('product.productAlbum') }}</h3>
          </div>
          <div class="album-grid">
            <div v-for="(img, i) in allImages" :key="i" class="album-item">
              <img :src="img" :alt="'photo ' + (i+1)"/>
            </div>
            <div v-if="!allImages.length" class="center muted">{{ t('product.noImages') }}</div>
          </div>
        </div>
      </div>

      <!-- 预订确认弹窗 -->
      <div v-if="showBookingModal" class="calendar-overlay" @click.self="showBookingModal = false">
        <div class="calendar-modal">
          <h3>{{ t('product.confirmBookingInfo') }}</h3>
          <div class="booking-confirm-info">
            <div class="confirm-row"><span>{{ t('product.labelProduct') }}</span><span>{{ product.title }}</span></div>
            <div class="confirm-row"><span>{{ t('product.labelPackage') }}</span><span>{{ selectedPkg?.name || '-' }}</span></div>
            <div class="confirm-row"><span>{{ t('product.labelDate') }}</span><span>{{ selectedDate || '-' }}</span></div>
            <div class="confirm-row"><span>{{ t('product.labelPeople') }}</span><span>{{ quantity }}</span></div>
            <div class="confirm-row total">
              <span>{{ t('product.labelTotal') }}</span>
              <strong>{{ formatPrice((selectedInventory?.unitPrice || displayMinPrice) * quantity) }}</strong>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showBookingModal = false">{{ t('product.backToEdit') }}</button>
            <button class="btn-primary" @click="goBooking">{{ t('product.confirmGoOrder') }}</button>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail, getProductPackages, checkInventory, batchInventory, getProductReviews, getProductItineraryStops } from '../api.js'
import { useFavorites } from '../composables/favorites.js'
import { useUser } from '../composables/user.js'
import { useLocale } from '../composables/useLocale.js'
import PickupRangeMap from '../components/PickupRangeMap.vue'
import { resolveMediaUrl } from '../utils/media.js'

const route = useRoute()
const router = useRouter()
const { isFav, toggle } = useFavorites()
const user = useUser()
const { t, te, formatPrice, locale } = useLocale()

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
const carouselIndex = ref(0)
const dateStripRef = ref(null)
const reviewsSection = ref(null)

// 模拟数据
const monthlySales = ref(79)

// 评价数据
const reviews = ref([])
const reviewTotal = ref(0)
const avgRating = ref(0)

// 行程节点（C 端展示）
const itineraryStops = ref([])

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
  if (product.value.coverImage) imgs.push(resolveMediaUrl(product.value.coverImage))
  parseMediaList(product.value.images).forEach(img => {
    const url = resolveMediaUrl(img)
    if (url && !imgs.includes(url)) imgs.push(url)
  })
  return imgs
})

// 当前轮播主图
const currentImage = computed(() => allImages.value[carouselIndex.value] || resolveMediaUrl(product.value?.coverImage) || '')

function prevImage() {
  const n = allImages.value.length
  if (n <= 1) return
  carouselIndex.value = (carouselIndex.value - 1 + n) % n
}

function nextImage() {
  const n = allImages.value.length
  if (n <= 1) return
  carouselIndex.value = (carouselIndex.value + 1) % n
}

// 宣传视频：mp4 直链直接播放；HLS(.m3u8) 降级为外链打开；本地相对路径补上传服务地址
const videoUrl = computed(() => resolveMediaUrl(product.value?.videoUrl || product.value?.video_url || ''))
const hasVideo = computed(() => !!videoUrl.value)
const videoIsHls = computed(() => /\.m3u8($|\?)/i.test(videoUrl.value))

// 解析媒体列表：兼容 JSON 数组字符串(["url"]/[{"text":}])、逗号分隔、原生数组
function parseMediaList(raw) {
  if (!raw) return []
  const norm = (x) => (typeof x === 'string' ? x : ((x && (x.url || x.text)) || ''))
  if (Array.isArray(raw)) return raw.map(norm).filter(Boolean)
  const s = String(raw).trim()
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s)
      if (Array.isArray(arr)) return arr.map(norm).filter(Boolean)
    } catch { /* 落回逗号解析 */ }
  }
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

const highlightList = computed(() => {
  if (!product.value?.highlights) return []
  return parseMediaList(product.value.highlights)
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

const weekdayLabels = computed(() => [
  t('product.weekday.sun'), t('product.weekday.mon'), t('product.weekday.tue'),
  t('product.weekday.wed'), t('product.weekday.thu'), t('product.weekday.fri'), t('product.weekday.sat'),
])

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
      weekday: weekdayLabels.value[d.getDay()],
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
}

function goNextMonth() {
  if (calMonth.value === 12) {
    calYear.value++
    calMonth.value = 1
  } else {
    calMonth.value++
  }
}

// 加载可订窗口（当天至当天+30天）的库存数据
async function loadInventoryWindow() {
  if (!selectedPkg.value) return
  const start = new Date()
  const end = new Date()
  end.setDate(start.getDate() + 30)
  const startDate = start.toISOString().split('T')[0]
  const endDate = end.toISOString().split('T')[0]

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
    console.error('加载可订窗口库存失败', e)
  }
}

function selectPkg(pkg) {
  selectedPkg.value = pkg
  selectedDate.value = ''
  selectedInventory.value = null
  inventoryCache.value = {}
  // 重新加载可订窗口库存
  loadInventoryWindow()
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
      // 用 scrollIntoView 居中，天然适配 LTR/RTL（dir=rtl 下 offsetLeft/scrollLeft 语义相反）
      cells[idx].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
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
      // 用 scrollIntoView 居中，天然适配 LTR/RTL（dir=rtl 下 offsetLeft/scrollLeft 语义相反）
      cells[idx].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
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
    loadInventoryWindow()
  }
}

async function loadProduct() {
  loading.value = true
  try {
    const data = await getProductDetail(route.params.id)
    product.value = data
    carouselIndex.value = 0
    const pkgResp = await getProductPackages(route.params.id)
    packages.value = pkgResp.items || []
    if (activePackages.value.length === 1) {
      selectPkg(activePackages.value[0])
    }
    // Load itinerary stops
    loadItinerary()
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

// ── 行程展示 ──
const stopTypeIcons = { MEETING: '🚩', ACTIVITY: '📍', TRANSPORT: '🚌', MEAL: '🍽️', RETURN: '🏁' }

function parseTp(raw) {
  if (!raw) return {}
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return {}
  }
}

async function loadItinerary() {
  try {
    const resp = await getProductItineraryStops(route.params.id)
    itineraryStops.value = (resp.items || []).map(s => ({ ...s, tp: parseTp(s.typeParams) }))
  } catch (e) {
    console.error('加载行程失败', e)
  }
}

function stopTypeLabel(type) {
  const key = 'product.stopType.' + type
  return te(key) ? t(key) : (type || '')
}

function stopIcon(type) {
  return stopTypeIcons[type] || '•'
}

function fmtDuration(h, m) {
  const parts = []
  if (h) parts.push(t('product.durationHour', { h }))
  if (m) parts.push(t('product.durationMinute', { m }))
  return parts.join('')
}

function stopTitle(stop) {
  const tp = stop.tp || {}
  switch (stop.stopType) {
    case 'MEETING':
      if (tp.meetingMode === 'POINT') return tp.meetingPoint || t('product.meetingPointDefault')
      return tp.pickupCity ? t('product.pickupCity', { city: tp.pickupCity }) : t('product.pickupDefault')
    case 'ACTIVITY':
      return stop.poiName || stop.title || t('product.stopType.ACTIVITY')
    case 'TRANSPORT':
      return stop.transportType ? t('product.transportGo', { type: stop.transportType }) : (stop.title || t('product.stopType.TRANSPORT'))
    case 'MEAL': {
      const mealKey = 'product.meal.' + tp.mealType
      const mealName = tp.mealType && te(mealKey) ? t(mealKey) : ''
      return mealName || stop.title || t('product.stopType.MEAL')
    }
    default:
      return stop.title || t('product.stopType.RETURN')
  }
}

function stopMeta(stop) {
  const tp = stop.tp || {}
  const meta = []
  if (stop.stopType === 'MEETING') {
    if (tp.meetingMode === 'POINT') {
      if (tp.meetingTime) meta.push(t('product.meetingAt', { time: tp.meetingTime }))
      if (tp.meetingCity) meta.push(tp.meetingCity)
    } else {
      if (tp.pickupTime) meta.push(t('product.pickupAt', { time: tp.pickupTime }))
      if (tp.pickupCity) meta.push(tp.pickupCity)
      if (tp.pickupDistrict) meta.push(tp.pickupDistrict)
    }
  } else if (stop.stopType === 'ACTIVITY') {
    meta.push(stop.isEntering === false ? t('product.notEntering') : t('product.entering'))
    const d = fmtDuration(stop.durationHours, stop.durationMinutes)
    if (d) meta.push(t('product.experience', { d }))
  } else if (stop.stopType === 'TRANSPORT') {
    const d = fmtDuration(stop.durationHours, stop.durationMinutes)
    if (d) meta.push(t('product.driveTime', { d }))
  } else if (stop.stopType === 'MEAL') {
    const d = fmtDuration(stop.durationHours, stop.durationMinutes)
    if (d) meta.push(t('product.mealTime', { d }))
  }
  return meta
}

function stopDesc(stop) {
  const tp = stop.tp || {}
  if (stop.stopType === 'MEETING') {
    return tp.meetingMode === 'POINT' ? (tp.meetingDesc || '') : (tp.pickupNote || '')
  }
  return stop.activityFeatures || ''
}

function stopImages(stop) {
  const tp = stop.tp || {}
  const raw = stop.stopType === 'MEETING' ? (tp.meetingImages || '') : ''
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

// 上门接集合节点：展示接送范围
function isPickupMeeting(stop) {
  return stop.stopType === 'MEETING' && (stop.tp || {}).meetingMode !== 'POINT'
}

function pickupPolygon(tp) {
  const t = tp || {}
  // 集合节点存 pickupPolygon，返程送回行存 polygon
  const raw = Array.isArray(t.polygon) ? t.polygon : t.pickupPolygon
  if (!Array.isArray(raw)) return []
  return raw.filter(p => Array.isArray(p) ? p.length >= 2 : (p && p.lng != null && p.lat != null))
}

function pickupRangeModeLabel(tp) {
  const p = tp || {}
  const mode = p.pickupRangeMode || p.rangeMode
  return mode === 'PARTIAL' ? t('product.rangePartial') : t('product.rangeCustom')
}

function pickupRangeOptionLabels(tp) {
  const p = tp || {}
  const opts = p.pickupRangeOptions || p.rangeOptions || {}
  const labels = []
  if (opts.drawAllAreas) labels.push(t('product.rangeAllAreas'))
  if (opts.drawAllHotels) labels.push(t('product.rangeAllHotels'))
  if (opts.drawAllStations) labels.push(t('product.rangeAllStations'))
  if (opts.extraCharge) labels.push(t('product.rangeExtraCharge'))
  return labels
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

// 问客服：携带当前商品进入客服会话，商户可直接看到咨询商品
function goSupport() {
  if (!user.isLoggedIn.value) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  router.push({ path: '/support', query: { productId: product.value.id } })
}

onMounted(loadProduct)
// 切换语言后重新拉取，获取后端按 locale 返回的翻译文案
watch(locale, () => loadProduct())
</script>

<style scoped>
.detail-itinerary-section {
  padding: 16px;
}
.itinerary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.itinerary-header h2 {
  font-size: 17px;
  margin: 0;
}
.itinerary-count {
  font-size: 12px;
  color: #999;
}
.itinerary-item {
  display: flex;
  gap: 10px;
}
.itinerary-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 26px;
  flex-shrink: 0;
}
.itinerary-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f2f6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.itinerary-line {
  flex: 1;
  width: 2px;
  background: #e5e7eb;
  margin: 4px 0;
}
.itinerary-body {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.itinerary-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.itinerary-type {
  font-size: 11px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 4px;
  padding: 2px 6px;
  flex-shrink: 0;
}
.itinerary-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.itinerary-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.itinerary-meta-item {
  font-size: 12px;
  color: #666;
  background: #f5f6f8;
  border-radius: 4px;
  padding: 2px 6px;
}
.itinerary-desc {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  margin: 6px 0 0;
}
.itinerary-images {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.itinerary-images img {
  width: 72px;
  height: 72px;
  border-radius: 6px;
  object-fit: cover;
}
.itinerary-pickup-range {
  margin-top: 8px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 10px;
}
.range-label {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 4px;
}
.range-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.range-tag {
  font-size: 11px;
  color: #475569;
  background: #eff6ff;
  border-radius: 4px;
  padding: 2px 6px;
}
.itinerary-return {
  margin-top: 8px;
}
.return-block {
  margin-bottom: 6px;
}
.return-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b21a8;
  margin-bottom: 2px;
}
.return-line {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}
.return-dropoff {
  margin-bottom: 8px;
}
.return-dropoff .range-tags {
  margin-top: 2px;
}
.return-note {
  font-size: 12px;
  color: #666;
  margin: 4px 0 0;
}
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
.carousel-main { position: relative }
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  z-index: 3;
}
.carousel-nav.prev { left: 10px }
.carousel-nav.next { right: 10px }
.detail-video-card {
  margin: 12px 16px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.video-header h3 { font-size: 16px; margin: 0 }
.video-emoji { font-size: 18px }
.detail-video {
  width: 100%;
  max-height: 420px;
  border-radius: 8px;
  background: #000;
  display: block;
}
.video-hls-note a { color: #2563eb; font-size: 14px; text-decoration: none }
</style>
