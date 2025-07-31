import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
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

// Create and mount the Vue application
const app = createApp(App)
app.use(router)
app.use(autoAnimatePlugin)
app.mount('#app')

// For backward compatibility, still import demo
// Comment this out if you want to use only the Vue app
// import './demo'
