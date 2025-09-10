// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import Demo from '@docs/components/Demo.vue'
import About from '@docs/components/About.vue'
import Curves from '@docs/components/Curves.vue'

import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import './style.css'
import './main.css'
import Layout from './Layout.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    // Create QueryClient for Vue Query
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          retry: 3,
          refetchOnWindowFocus: false,
        },
      },
    })
    app.use(VueQueryPlugin, { queryClient })
    app.use(autoAnimatePlugin)

    // Register global components
    app.component('Demo', Demo)
    app.component('About', About)
    app.component('Curves', Curves)
  },
} satisfies Theme
