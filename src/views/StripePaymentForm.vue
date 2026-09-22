<template>
  <div class="stripe-payment-form">
    <!-- Loading state while fetching intent -->
    <div v-if="loading" class="stripe-loading">
      <span class="spinner"></span>
      <span>{{ t('payment.stripeLoading') }}</span>
    </div>

    <!-- Stripe Payment Element -->
    <div v-show="ready" ref="paymentElRef" class="stripe-element"></div>

    <!-- Pay button -->
    <button
      v-if="ready"
      class="btn-primary stripe-pay-btn"
      :disabled="submitting"
      @click="handleSubmit"
    >
      {{ submitting ? t('common.processing') : t('payment.payNow', { amount: payAmountText }) }}
    </button>

    <div v-if="errorMsg" class="error-toast">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadStripe } from '@stripe/stripe-js'
import { createStripeIntent } from '../api.js'
import { useLocale } from '../composables/useLocale.js'

const props = defineProps({
  orderNo: { type: String, required: true },
  payAmountText: { type: String, default: '' },
})

const emit = defineEmits(['success', 'error'])

const route = useRoute()
const router = useRouter()
const { t } = useLocale()

const paymentElRef = ref(null)
const loading = ref(true)
const ready = ref(false)
const submitting = ref(false)
const errorMsg = ref('')

let stripe = null
let elements = null

function generateIdempotencyKey() {
  return `stripe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

onMounted(async () => {
  try {
    // 1. Create PaymentIntent via backend
    const resp = await createStripeIntent({
      orderNo: props.orderNo,
      idempotencyKey: generateIdempotencyKey(),
    })

    const { clientSecret, publishableKey } = resp

    if (!clientSecret || !publishableKey) {
      throw new Error(t('payment.stripeInitFailed'))
    }

    // 2. Initialise Stripe
    stripe = await loadStripe(publishableKey)
    if (!stripe) {
      throw new Error(t('payment.stripeInitFailed'))
    }

    // 3. Create Elements
    elements = stripe.elements({ clientSecret })
    const paymentElement = elements.create('payment', {
      layout: 'tabs',
    })
    paymentElement.mount(paymentElRef.value)
    paymentElement.on('ready', () => {
      ready.value = true
      loading.value = false
    })
    paymentElement.on('change', (e) => {
      if (e.error) {
        errorMsg.value = e.error.message
      } else {
        errorMsg.value = ''
      }
    })
  } catch (e) {
    loading.value = false
    errorMsg.value = e.message || t('payment.stripeInitFailed')
    emit('error', e)
  }
})

onBeforeUnmount(() => {
  if (elements) {
    elements.getElement('payment')?.unmount()
  }
})

async function handleSubmit() {
  if (submitting.value || !stripe || !elements) return
  submitting.value = true
  errorMsg.value = ''

  try {
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/success/${props.orderNo}`,
      },
      redirect: 'if_required',
    })

    if (result.error) {
      errorMsg.value = result.error.message || t('payment.payFailed')
      emit('error', result.error)
    } else {
      // Payment succeeded without redirect
      emit('success')
      router.push({ name: 'OrderSuccess', params: { orderNo: props.orderNo } })
    }
  } catch (e) {
    errorMsg.value = e.message || t('payment.payFailed')
    emit('error', e)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.stripe-payment-form {
  margin-top: 12px;
}

.stripe-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  justify-content: center;
  color: #666;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-top-color: #635bff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stripe-element {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
}

.stripe-pay-btn {
  width: 100%;
  background: #635bff;
  border-color: #635bff;
  color: #fff;
}

.stripe-pay-btn:hover {
  background: #5851ea;
}

.error-toast {
  margin-top: 12px;
  color: #e53e3e;
  font-size: 14px;
  text-align: center;
}
</style>
