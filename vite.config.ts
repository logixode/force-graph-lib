import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import type { Plugin } from 'vite'
import VueRouter from 'unplugin-vue-router/vite'
import tailwindcss from '@tailwindcss/vite'

const vuePlugin = vue as unknown as () => Plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    VueRouter({
      // Router plugin options
      dts: true, // generate TypeScript declaration for routes
    }),
    vuePlugin(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
