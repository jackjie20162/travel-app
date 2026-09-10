/**
 * 统一货币 / 价格格式化工具
 *
 * 设计要点（见多语言多货币改造方案）：
 * - 后端价格以基准币 AED 存储，单位为「元」（int64，不除 100）。
 * - 前端根据用户所选展示币种，用汇率把基准金额换算后格式化显示。
 * - 汇率来源：优先后端 /api/travel/currencies/rates；未就绪时使用内置静态汇率回退。
 * - 阿拉伯语等 locale 统一使用拉丁数字（numberingSystem: latn），保证金额可读一致。
 */
import { ref, computed } from 'vue'

export const BASE_CURRENCY = 'AED'

const STORAGE_CURRENCY = 'travel_currency'

/** 内置静态汇率回退（相对基准币 AED），后端接口就绪前的兜底。 */
const FALLBACK_RATES = {
  AED: 1,
  USD: 0.2723, // 1 AED ≈ 0.2723 USD
  CNY: 1.96,   // 1 AED ≈ 1.96 CNY
}

/** 币种元信息回退（后端 /currencies 就绪前使用）。 */
const FALLBACK_CURRENCIES = [
  { code: 'AED', symbol: 'د.إ', decimals: 2, symbolPosition: 'suffix', isBase: true },
  { code: 'USD', symbol: '$', decimals: 2, symbolPosition: 'prefix', isBase: false },
  { code: 'CNY', symbol: '¥', decimals: 2, symbolPosition: 'prefix', isBase: false },
]

// 模块级响应式单例（跨组件共享）
export const selectedCurrency = ref(localStorage.getItem(STORAGE_CURRENCY) || BASE_CURRENCY)
const rates = ref({ ...FALLBACK_RATES })          // { code: rateRelativeBase }
export const currencies = ref([...FALLBACK_CURRENCIES])   // [{ code, symbol, decimals, ... }]
const loaded = ref(false)

/** 汇率放大因子：后端以 rate_micro(×1e6) 传输时用于还原。 */
const RATE_SCALE = 1e6

export function getSelectedCurrency() {
  return selectedCurrency.value
}

export function setSelectedCurrency(code) {
  if (!code) return
  selectedCurrency.value = code
  localStorage.setItem(STORAGE_CURRENCY, code)
}

export function getCurrencyMeta(code) {
  return currencies.value.find(c => c.code === code) || { code, symbol: code, decimals: 2, symbolPosition: 'prefix' }
}

/** 用后端数据刷新币种字典与汇率（rates 支持 {code:rate} 或 [{targetCurrency,rate|rateMicro}]）。 */
export function applyCurrencyData({ currencies: list, rates: rateData } = {}) {
  if (Array.isArray(list) && list.length) {
    currencies.value = list.map(c => ({
      code: c.code,
      symbol: c.symbol || c.code,
      decimals: c.decimals != null ? c.decimals : 2,
      symbolPosition: c.symbolPosition || 'prefix',
      isBase: !!c.isBase,
    }))
  }
  if (rateData) {
    const next = { [BASE_CURRENCY]: 1 }
    if (Array.isArray(rateData)) {
      for (const r of rateData) {
        const code = r.targetCurrency || r.code
        if (!code) continue
        const raw = r.rateMicro != null ? Number(r.rateMicro) / RATE_SCALE : Number(r.rate)
        if (!Number.isNaN(raw) && raw > 0) next[code] = raw
      }
    } else if (typeof rateData === 'object') {
      for (const [code, val] of Object.entries(rateData)) {
        const raw = Number(val)
        if (!Number.isNaN(raw) && raw > 0) next[code] = raw
      }
    }
    rates.value = next
  }
  loaded.value = true
}

export function isLoaded() {
  return loaded.value
}

/** 把基准币金额换算为目标币种金额（返回 Number，保留合理精度）。 */
export function convert(amountBase, targetCode = selectedCurrency.value) {
  const amt = Number(amountBase)
  if (Number.isNaN(amt)) return 0
  const rate = rates.value[targetCode] ?? rates.value[BASE_CURRENCY] ?? 1
  const meta = getCurrencyMeta(targetCode)
  const factor = Math.pow(10, meta.decimals ?? 2)
  return Math.round(amt * rate * factor) / factor
}

/**
 * 统一价格格式化：把「基准币(AED)整数元」金额换算并按目标币种符号/小数位格式化。
 * @param {number|string} amountBase 基准币金额（元）
 * @param {object} opts { currency, locale }
 * @returns {string} 例如 "$1,234.00" / "1,234.00 د.إ" / "¥1,234.00"
 */
export function formatPrice(amountBase, opts = {}) {
  const currency = opts.currency || selectedCurrency.value
  const locale = opts.locale || 'en-US'
  if (amountBase == null || amountBase === '' || Number.isNaN(Number(amountBase))) return '--'
  const value = convert(amountBase, currency)
  if (value <= 0) return '--'
  const meta = getCurrencyMeta(currency)
  try {
    // 统一使用拉丁数字，避免阿拉伯语环境下金额数字形态不一致
    const nf = new Intl.NumberFormat(`${locale}-u-nu-latn`, {
      minimumFractionDigits: meta.decimals ?? 2,
      maximumFractionDigits: meta.decimals ?? 2,
    })
    const num = nf.format(value)
    return meta.symbolPosition === 'suffix' ? `${num} ${meta.symbol}` : `${meta.symbol}${num}`
  } catch {
    return `${meta.symbol}${value.toFixed(meta.decimals ?? 2)}`
  }
}

/**
 * 直接格式化「已确定的展示金额」（用于订单锁汇后的 displayAmount，不再换算）。
 * @param {number|string} amount 展示币种下的金额
 * @param {string} currency 展示币种
 * @param {string} locale
 */
export function formatAmount(amount, currency = selectedCurrency.value, locale = 'en-US') {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) return '--'
  const meta = getCurrencyMeta(currency)
  const value = Number(amount)
  try {
    const nf = new Intl.NumberFormat(`${locale}-u-nu-latn`, {
      minimumFractionDigits: meta.decimals ?? 2,
      maximumFractionDigits: meta.decimals ?? 2,
    })
    const num = nf.format(value)
    return meta.symbolPosition === 'suffix' ? `${num} ${meta.symbol}` : `${meta.symbol}${num}`
  } catch {
    return `${meta.symbol}${value.toFixed(meta.decimals ?? 2)}`
  }
}

/**
 * 货币 composable：供组件响应式使用。
 */
export function useCurrency() {
  const currency = computed(() => selectedCurrency.value)
  const currencyList = computed(() => currencies.value)
  return {
    currency,
    currencyList,
    selectedCurrency,
    setSelectedCurrency,
    convert,
    formatPrice,
    formatAmount,
  }
}
