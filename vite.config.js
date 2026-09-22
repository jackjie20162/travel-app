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
    },
  },
})
