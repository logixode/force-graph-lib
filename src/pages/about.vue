<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
</script>

<template>
  <div class="about">
    <h2>About Force Graph Library</h2>

    <div class="content bg-card">
      <p>
        This is a demonstration of the Force Graph Library integrated with Vue.js and
        unplugin-vue-router. The library provides a powerful way to visualize network data using
        force-directed graph layouts.
      </p>

      <h3>Features</h3>
      <ul>
        <li>Force-directed and circle pack layouts</li>
        <li>Customizable node appearance</li>
        <li>Interactive zooming and panning</li>
        <li>Node selection and highlighting</li>
        <li>Data management with pagination support</li>
      </ul>

      <h3>Implementation</h3>
      <p>
        The library is built on top of D3.js and force-graph, providing a simple API for creating
        interactive network visualizations. It's designed to be easy to use while offering powerful
        customization options.
      </p>

      <Button>
        <router-link to="/">Back to Demo</router-link>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.about {
  max-width: 800px;
  margin: 0 auto;
}

.content {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 20px;
  color: #333;
}

ul {
  margin-left: 20px;
}

li {
  margin-bottom: 8px;
}
</style>
