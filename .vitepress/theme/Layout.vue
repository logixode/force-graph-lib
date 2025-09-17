<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { Toaster } from '@docs/components/ui/sonner/index.ts'
import ThemeToggle from '@docs/components/ThemeToggle.vue'
// import ApiSetting from '@docs/components/ApiSetting.vue'
import 'vue-sonner/style.css' // vue-sonner v2 requires this import
import { buttonVariants } from '@docs/components/ui/button'
import { Github } from 'lucide-vue-next'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <div class="flex items-center gap-px order-3">
        <!-- <ApiSetting /> -->

        <ThemeToggle />
        <a
          href="https://github.com/logixode/force-graph-lib"
          target="_blank"
          :class="buttonVariants({ variant: 'ghost' })"
        >
          <Github />
        </a>
      </div>
    </template>
    <template #layout-bottom>
      <Toaster />
    </template>
  </Layout>
</template>
