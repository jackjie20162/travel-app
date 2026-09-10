<template>
  <div class="page-review-form">
    <div v-if="loading" class="center" style="padding-top:80px">{{ t('review.loading') }}</div>
    <div v-else-if="!order" class="center empty">{{ t('review.notFound') }}</div>
    <template v-else>
      <!-- 头部：订单信息 -->
      <div class="review-header">
        <h2>{{ t('review.title') }}</h2>
        <p class="order-info">{{ order.productName || order.productTitle || t('review.defaultProduct') }}</p>
        <p class="order-no mono">{{ order.orderNo }}</p>
      </div>

      <!-- 评分区 -->
      <div class="rating-section">
        <div class="rating-row">
          <span class="rating-label">{{ t('review.overallRating') }}</span>
          <div class="stars">
            <span v-for="n in 5" :key="'t'+n" class="star" :class="{ active: form.rating >= n }" @click="form.rating = n">★</span>
          </div>
        </div>
        <div class="rating-row">
          <span class="rating-label">{{ t('review.serviceRating') }}</span>
          <div class="stars">
            <span v-for="n in 5" :key="'s'+n" class="star" :class="{ active: form.serviceRating >= n }" @click="form.serviceRating = n">★</span>
          </div>
        </div>
        <div class="rating-row">
          <span class="rating-label">{{ t('review.valueRating') }}</span>
          <div class="stars">
            <span v-for="n in 5" :key="'v'+n" class="star" :class="{ active: form.valueRating >= n }" @click="form.valueRating = n">★</span>
          </div>
        </div>
      </div>

      <!-- 评价内容 -->
      <div class="content-section">
        <textarea v-model="form.content" :placeholder="t('review.contentPh')" rows="5" maxlength="500"></textarea>
        <div class="char-count">{{ (form.content || '').length }}/500</div>
      </div>

      <!-- 图片上传（简化版） -->
      <div class="images-section">
        <h3>{{ t('review.uploadImages') }} <small>{{ t('review.optionalMax3') }}</small></h3>
        <div class="image-upload-area">
          <div v-for="(img, i) in previewImages" :key="i" class="preview-img">
            <img :src="img" alt=""/>
            <button class="remove-img" @click="removeImage(i)">✕</button>
          </div>
          <label v-if="previewImages.length < 3" class="upload-btn">
            <input type="file" accept="image/*" multiple @change="handleImageSelect" style="display:none"/>
            <span>+</span>
          </label>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-area">
        <button class="btn-submit" :disabled="submitting || form.rating < 1" @click="submitReview">
          {{ submitting ? t('common.submitting') : t('review.submitReview') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrder, createReview, getOrderReview } from '../api.js'
import { useLocale } from '../composables/useLocale.js'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const orderNo = route.params.orderNo
const order = ref(null)
const loading = ref(true)
const submitting = ref(false)
const previewImages = ref([])
const imageFiles = ref([])

const form = reactive({
  rating: 5,
  serviceRating: 5,
  valueRating: 5,
  content: '',
})

async function loadOrder() {
  loading.value = true
  try {
    const data = await getOrder(orderNo)
    order.value = data
    // Check if already reviewed
    try {
      const existing = await getOrderReview(orderNo)
      if (existing && existing.id) {
        alert(t('review.alreadyReviewed'))
        router.replace(`/order/${orderNo}`)
      }
    } catch {
      // No existing review, OK
    }
  } catch (e) {
    console.error('加载订单失败', e)
  } finally {
    loading.value = false
  }
}

function handleImageSelect(e) {
  const files = Array.from(e.target.files || [])
  const remaining = 3 - previewImages.value.length
  const toAdd = files.slice(0, remaining)
  toAdd.forEach(file => {
    imageFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      previewImages.value.push(ev.target.result)
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

function removeImage(idx) {
  previewImages.value.splice(idx, 1)
  imageFiles.value.splice(idx, 1)
}

async function submitReview() {
  if (form.rating < 1) return
  submitting.value = true
  try {
    // Convert images to comma-separated data URLs (simplified)
    const images = previewImages.value.join(',')
    await createReview({
      orderNo,
      productId: order.value.productId || order.value.items?.[0]?.productId || 0,
      rating: form.rating,
      serviceRating: form.serviceRating,
      valueRating: form.valueRating,
      content: form.content,
      images,
    })
    alert(t('review.submitSuccess'))
    router.replace(`/order/${orderNo}`)
  } catch (e) {
    console.error('提交评价失败', e)
    alert(e.message || t('review.submitFailed'))
  } finally {
    submitting.value = false
  }
}

onMounted(loadOrder)
</script>

<style scoped>
.page-review-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 16px;
}
.review-header {
  text-align: center;
  padding: 20px 0 16px;
}
.review-header h2 {
  margin: 0;
  font-size: 20px;
}
.order-info {
  margin: 8px 0 4px;
  font-size: 15px;
  color: #333;
}
.order-no {
  font-size: 12px;
  color: #999;
}
.rating-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}
.rating-row + .rating-row {
  border-top: 1px solid #f0f0f0;
}
.rating-label {
  font-size: 15px;
  color: #333;
}
.stars {
  display: flex;
  gap: 4px;
}
.star {
  font-size: 28px;
  color: #ddd;
  cursor: pointer;
  transition: color 0.15s;
}
.star.active {
  color: #ffb400;
}
.content-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.content-section textarea {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}
.content-section textarea:focus {
  outline: none;
  border-color: #4a90d9;
}
.char-count {
  text-align: end;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.images-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.images-section h3 {
  margin: 0 0 12px;
  font-size: 15px;
}
.images-section small {
  color: #999;
}
.image-upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.preview-img {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}
.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.remove-img {
  position: absolute;
  inset-block-start: 2px;
  inset-inline-end: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-btn {
  width: 80px;
  height: 80px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 28px;
  color: #ccc;
}
.upload-btn:hover {
  border-color: #4a90d9;
  color: #4a90d9;
}
.submit-area {
  padding: 16px 0 32px;
}
.btn-submit {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4a90d9, #357abd);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.center {
  text-align: center;
  color: #999;
}
.empty {
  padding-top: 80px;
}
.mono {
  font-family: monospace;
}
</style>
