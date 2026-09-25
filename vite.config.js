import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 1421,
    strictPort: true,
    allowedHosts: ['travel.code688.com'],
    proxy: {
      // 本地存储模式的媒体文件（/uploads/...）代理到 merchant-upload-api
      '/uploads': {
        target: 'http://localhost:9208',
        changeOrigin: true,
      },
      // 将 /api/travel/* 请求代理到 travel-api 网关，解决跨域问题
      '/api/travel': {
        target: 'http://localhost:9206',
        changeOrigin: true,
      },
      // IM 网关（imGateway）：同源 WebSocket 长连接 + HTTP 接口（与生产 nginx /ws、/im 代理对齐）
      '/ws': {
        target: 'http://localhost:9281',
        ws: true,
        changeOrigin: true,
      },
      '/im': {
        target: 'http://localhost:9281',
        changeOrigin: true,
      },
    },
  },
})
