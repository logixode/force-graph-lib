import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import type { Plugin } from 'vite'
import VueRouter from 'unplugin-vue-router/vite'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'

const vuePlugin = vue as unknown as () => Plugin

const isLibBuild = process.env.VITE_BUILD_TARGET === 'lib'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Conditionally add Vue plugins
    ...(!isLibBuild
      ? [
          VueRouter({
            dts: true,
          }),
          vuePlugin(),
          vueDevTools(),
          tailwindcss(),
        ]
      : []),
    // Conditionally add dts plugin for library build
    ...(isLibBuild
      ? [
          dts({
            insertTypesEntry: true,
            rollupTypes: true,
            tsconfigPath: './tsconfig.lib.json',
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: isLibBuild
    ? {
        minify: 'esbuild',
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'ForceGraphLib',
          formats: ['es', 'umd'],
          fileName: (format) => `force-graph-lib.${format}.js`,
        },
        rollupOptions: {
          // Make sure to externalize dependencies that shouldn't be bundled
          external: ['vue', 'force-graph', 'd3'],
          output: {
            // Provide global variables to use in the UMD build
            // for externalized deps
            globals: {
              'force-graph': 'ForceGraph',
              d3: 'd3',
              vue: 'Vue',
            },
          },
        },
      }
    : undefined, // Use default app build when not building lib
})