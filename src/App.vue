<script setup>
import { RouterView } from 'vue-router'
import AppNavbar from '@/shared/components/AppNavbar.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="app">
    <AppNavbar v-if="auth.isLoggedIn" />
    <main class="main-content" :class="{ 'with-navbar': auth.isLoggedIn }">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* ── Global Reset ─────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
  background: #f8fafc;
  color: #1e293b;
}

h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em; line-height: 1.2; }
p   { margin: 0 0 1em; }
ul, ol { margin: 0; padding: 0; list-style: none; }
button { font-family: inherit; cursor: pointer; }
input, textarea, select { font-family: inherit; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>

<style scoped>
.app { min-height: 100dvh; display: flex; flex-direction: column; }
.main-content { flex: 1; }
.main-content.with-navbar { padding-top: 56px; }
</style>
