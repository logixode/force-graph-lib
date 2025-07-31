<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import Breadcrumb from './components/ui/breadcrumb/Breadcrumb.vue'
import BreadcrumbItem from './components/ui/breadcrumb/BreadcrumbItem.vue'
import BreadcrumbLink from './components/ui/breadcrumb/BreadcrumbLink.vue'
import BreadcrumbList from './components/ui/breadcrumb/BreadcrumbList.vue'
import BreadcrumbPage from './components/ui/breadcrumb/BreadcrumbPage.vue'
import BreadcrumbSeparator from './components/ui/breadcrumb/BreadcrumbSeparator.vue'
import Separator from './components/ui/separator/Separator.vue'
import SidebarInset from './components/ui/sidebar/SidebarInset.vue'
import SidebarProvider from './components/ui/sidebar/SidebarProvider.vue'
import SidebarTrigger from './components/ui/sidebar/SidebarTrigger.vue'
import ThemeToggle from './components/ThemeToggle.vue'

// For backward compatibility, still import demo
// Comment this out if you want to use only the Vue app
// onMounted(async () => {
//   await import('./demo.ts')
// })
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="#"> Building Your Application </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ThemeToggle class="ml-auto" />
      </header>

      <div class="p-4">
        <router-view />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
