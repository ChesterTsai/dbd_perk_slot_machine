import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // the SCSS still uses @import; migrating to @use is a separate cleanup
        silenceDeprecations: ['import']
      }
    }
  },
  server: {
    host: true,
    port: 8080
  }
})
