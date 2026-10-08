// https://vitepress.dev/guide/custom-theme
import { defineClientComponent, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

// import Demo from
// import About from '@docs/components/About.vue'
// import Curves from '@docs/components/Curves.vue'

import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import './style.css'
import './main.css'
import Layout from './Layout.vue'

const Demo = defineClientComponent(() => import('@docs/components/Demo.vue'))
const DemoGrouping = defineClientComponent(() => import('@docs/components/DemoGrouping.vue'))
const Curves = defineClientComponent(() => import('@docs/components/Curves.vue'))
const DagTree = defineClientComponent(() => import('@docs/components/DagTree.vue'))
const DemoNodeChar = defineClientComponent(() => import('@docs/components/DemoNodeChar.vue'))

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
    app.component('DemoGrouping', DemoGrouping)
    app.component('Curves', Curves)
    app.component('DagTree', DagTree)
    app.component('DemoNodeChar', DemoNodeChar)
  },
} satisfies Theme
