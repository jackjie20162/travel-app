/**
 * 高德地图 JS API 2.0 动态加载工具（C 端只读展示用）
 *
 * 使用方式：
 *   import { loadAMap } from '../utils/amap'
 *   const AMap = await loadAMap()
 *
 * 安全密钥配置：
 *   在 .env 文件中设置 VITE_AMAP_SECURITY_KEY 和 VITE_AMAP_JS_API_KEY
 */

let loadPromise = null

/**
 * 动态加载高德地图 JS API 2.0
 * @returns {Promise<any>} AMap 全局对象
 */
export function loadAMap() {
  if (window.AMap) return Promise.resolve(window.AMap)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const securityKey = import.meta.env.VITE_AMAP_SECURITY_KEY || ''
    const jsApiKey = import.meta.env.VITE_AMAP_JS_API_KEY || ''

    if (!jsApiKey) {
      loadPromise = null
      reject(new Error('未配置 VITE_AMAP_JS_API_KEY'))
      return
    }

    if (securityKey) {
      window._AMapSecurityConfig = { securityJsCode: securityKey }
    }

    const params = new URLSearchParams()
    params.set('key', jsApiKey)
    params.set('v', '2.0')

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?${params.toString()}`
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        loadPromise = null
        reject(new Error('高德地图加载失败：AMap 未定义'))
      }
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('高德地图脚本加载失败，请检查网络或 API Key 配置'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
