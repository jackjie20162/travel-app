/**
 * 语言 + 货币统一 composable
 *
 * 组件只需 import { useLocale } from '../composables/useLocale.js'
 * 即可获得：t（翻译）、locale/setLocale（语言切换）、
 * formatPrice（基准币→展示币种换算格式化）、formatAmount（已锁定金额格式化）、
 * currency/setCurrency/currencyList（币种切换）。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale as applyLocale, SUPPORTED_LOCALES, LOCALE_LABELS, currentIntlLocale, isRtl } from '../locales/index.js'
import {
  selectedCurrency,
  currencies,
  setSelectedCurrency,
  convert,
  formatPrice as formatPriceUtil,
  formatAmount as formatAmountUtil,
} from '../utils/currency.js'

export function useLocale() {
  const { t, te, locale } = useI18n()

  const rtl = computed(() => isRtl(locale.value))

  function setLocale(next) {
    applyLocale(next)
  }

  /** 基准币(AED)金额 → 当前展示币种格式化（含换算）。 */
  function formatPrice(amountBase, currency) {
    return formatPriceUtil(amountBase, {
      currency: currency || selectedCurrency.value,
      locale: currentIntlLocale(),
    })
  }

  /** 已确定的展示金额（订单锁汇后）→ 格式化，不再换算。 */
  function formatAmount(amount, currency) {
    return formatAmountUtil(amount, currency || selectedCurrency.value, currentIntlLocale())
  }

  return {
    t,
    te,
    locale,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
    localeLabels: LOCALE_LABELS,
    rtl,
    // currency
    currency: selectedCurrency,
    currencyList: currencies,
    setCurrency: setSelectedCurrency,
    convert,
    formatPrice,
    formatAmount,
  }
}
