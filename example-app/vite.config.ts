import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' — ОБЯЗАТЕЛЬНО для публикации в SmartNet (sth://<appId>/),
// все ассеты должны грузиться по относительным путям.
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
})
