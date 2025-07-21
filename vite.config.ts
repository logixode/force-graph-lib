import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ForceGraphLib',
      fileName: (format) => `force-graph-lib.${format}.js`,
    },
    rollupOptions: {
      external: ['force-graph', 'web-worker'],
      output: {
        globals: {
          'force-graph': 'ForceGraph',
          'web-worker': 'WebWorker'
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2015'
  },
  server: {
    open: true
  }
});
