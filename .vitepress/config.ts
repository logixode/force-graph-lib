import { defineConfig } from 'vitepress'
import path from 'node:path'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/force-graph-lib/' : '/',
  srcDir: 'docs',

  lastUpdated: true,

  title: 'Force Graph Lib',
  description: 'Force-directed graph visualization library.',

  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src'),
        '@docs': path.resolve(__dirname, '../docs'),
        '@vitepress': path.resolve(__dirname, '../.vitepress'),
      },
    },
    server: {
      fs: {
        allow: ['../'],
      },
    },
  },

  appearance: false,
  themeConfig: {
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/getting-started' },
    ],

    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/introduction' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Basic Usage', link: '/basic-usage' },
          { text: 'API References', link: '/api-references' },
        ],
      },
      {
        text: 'Visualization',
        collapsed: false,
        items: [
          { text: 'Demo', link: '/demo' },
          { text: 'Curves Examples', link: '/curves' },
          { text: 'DAG Tree', link: '/dag-tree' },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/logixode/force-graph-lib/edit/main/docs/:path',
    },
  },
})
