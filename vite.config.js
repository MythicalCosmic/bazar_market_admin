import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/admin-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      // Optional GPU backend (peer dep of @imgly/background-removal) is not
      // installed; externalize so the worker bundle builds. The library
      // falls back gracefully when the backend is unavailable.
      external: [/^onnxruntime-web/],
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      external: [/^onnxruntime-web/],
      output: {
        manualChunks: {
          vue:        ['vue', 'vue-router', 'pinia'],
          vuetify:    ['vuetify'],
          charts:     ['apexcharts', 'vue3-apexcharts'],
          maps:       ['leaflet', 'leaflet-draw'],
        },
      },
    },
  },
})
