import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

// Since vite.config.ts now exports a function, we need to call it to get the config object.
// We are simulating a 'serve' environment for vitest, so the base path is correct.
const viteConfigObject =
  typeof viteConfig === 'function' ? viteConfig({ command: 'serve', mode: 'test' }) : viteConfig

export default mergeConfig(
  viteConfigObject,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
