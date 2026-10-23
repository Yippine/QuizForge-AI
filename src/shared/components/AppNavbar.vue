<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const menuOpen = ref(false)

const navLinks = [
  { name: 'Home',      label: '刷題',  icon: '🎯', path: '/quiz'      },
  { name: 'Analytics', label: '統計',  icon: '📊', path: '/analytics' },
]

const adminLinks = [
  { name: 'Bank', label: '題庫', icon: '📚', path: '/bank' }
]

function isActive(path) {
  return route.path.startsWith(path)
}

async function handleSignOut() {
  menuOpen.value = false
  try {
    await auth.signOut()
  } catch (e) {
    console.warn('[Navbar] signOut error:', e?.message)
  }
  router.push('/login')
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-inner">
      <!-- Logo -->
      <RouterLink to="/quiz" class="nav-logo">
        <span>🎯</span>
        <span class="nav-logo-text">QuizForge</span>
      </RouterLink>

      <!-- Desktop Links -->
      <div class="nav-links">
        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="link.path"
          class="nav-link"
          :class="{ active: isActive(link.path) }"
        >
          <span class="link-icon">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </RouterLink>

        <RouterLink
          v-if="auth.isAdmin"
          v-for="link in adminLinks"
          :key="link.name"
          :to="link.path"
          class="nav-link"
          :class="{ active: isActive(link.path) }"
        >
          <span class="link-icon">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </RouterLink>
      </div>

      <!-- User Menu -->
      <div class="nav-user">
        <button class="avatar-btn" @click="menuOpen = !menuOpen">
          <img
            v-if="auth.avatarUrl"
            :src="auth.avatarUrl"
            :alt="auth.displayName"
            class="avatar-img"
          />
          <span v-else class="avatar-fallback">
            {{ auth.displayName?.charAt(0)?.toUpperCase() ?? 'U' }}
          </span>
        </button>

        <!-- Dropdown -->
        <div v-if="menuOpen" class="dropdown" @click.outside="menuOpen = false">
          <div class="dropdown-header">
            <span class="dropdown-name">{{ auth.displayName }}</span>
            <span class="dropdown-role">{{ auth.isAdmin ? '管理員' : '學員' }}</span>
          </div>
          <hr class="dropdown-divider" />
          <button class="dropdown-item danger" @click="handleSignOut">
            <span>登出</span>
          </button>
        </div>

        <!-- Backdrop -->
        <div v-if="menuOpen" class="backdrop" @click="menuOpen = false" />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  z-index: 100;
}

.nav-inner {
  max-width: 960px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0 1rem;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  font-weight: 700;
  font-size: 1rem;
  color: #1e293b;
  flex-shrink: 0;
}
.nav-logo-text { display: none; }
@media (min-width: 480px) { .nav-logo-text { display: inline; } }

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s;
  min-height: 36px;
}
.nav-link:hover { background: #f1f5f9; color: #1e293b; }
.nav-link.active { background: #eef2ff; color: #4f46e5; }
.link-icon { font-size: 1rem; }

.nav-user { position: relative; margin-left: auto; }

.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  padding: 0;
  overflow: hidden;
  background: #f1f5f9;
  transition: border-color 0.15s;
  min-height: 36px;
}
.avatar-btn:hover { border-color: #6366f1; }

.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4f46e5;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  min-width: 180px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 200;
  overflow: hidden;
}

.dropdown-header { padding: 0.75rem 1rem; }
.dropdown-name { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.dropdown-role { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

.dropdown-divider { margin: 0; border: none; border-top: 1px solid #f1f5f9; }

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 1rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  color: #374151;
  text-align: left;
  transition: background 0.1s;
  min-height: 40px;
}
.dropdown-item:hover { background: #f8fafc; }
.dropdown-item.danger { color: #dc2626; }
.dropdown-item.danger:hover { background: #fef2f2; }

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
}
</style>
