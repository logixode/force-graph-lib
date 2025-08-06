import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import App from './App.vue'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// This will update routes at runtime without reloading the page
if (import.meta.hot) {
  handleHotUpdate(router)
}

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

// Create and mount the Vue application
const app = createApp(App)
app.use(router)
app.use(autoAnimatePlugin)
app.use(VueQueryPlugin, { queryClient })
app.mount('#app')

// For backward compatibility, still import demo
// Comment this out if you want to use only the Vue app
// import './demo'
