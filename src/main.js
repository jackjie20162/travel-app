import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import i18n from './locales/index.js'
import { loadCurrencyData } from './utils/currencyLoader.js'
import './style.css'

const app = createApp(App)
app.use(i18n)
app.use(router)
app.mount('#app')

// 启动时拉取币种字典与汇率（失败时使用内置静态回退，不阻塞渲染）
loadCurrencyData()
