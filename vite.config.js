import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({ features: { customElement: false } }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  optimizeDeps: {
    esbuildOptions: { charset: 'utf8' }
  },

  build: {
    charset: 'utf8'
  },

  server: {
    host: true,
    port: 3003,
    open: true,
    allowedHosts: ['.trycloudflare.com', 'ipas.leopilot.com'],
    hmr: { protocol: 'ws', clientPort: 3003 }
  }
})
