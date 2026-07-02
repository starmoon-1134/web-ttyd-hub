import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// 从项目根 .env 读取 VITE_BASE_URL，支持自由配置子路径
const rootEnv = existsSync('../.env')
  ? Object.fromEntries(
      readFileSync('../.env', 'utf-8')
        .split('\n')
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] })
    )
  : {}

export default defineConfig({
  base: rootEnv.VITE_BASE_URL || '/',
  plugins: [vue()],
  build: {
    outDir: '../server/public',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  }
})
