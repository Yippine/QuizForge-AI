import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ── Public ──────────────────────────────────────────────
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/LoginPage.vue'),
    meta: { requiresAuth: false }
  },

  // ── Quiz ────────────────────────────────────────────────
  {
    path: '/',
    redirect: '/quiz'
  },
  {
    path: '/quiz',
    name: 'Home',
    component: () => import('@/features/quiz/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:subjectId',
    name: 'TopicSelect',
    component: () => import('@/features/quiz/TopicSelectPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:subjectId/practice',
    name: 'Quiz',
    component: () => import('@/features/quiz/QuizPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:subjectId/exam',
    name: 'Exam',
    component: () => import('@/features/quiz/ExamPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:subjectId/exam/result',
    name: 'ExamResult',
    component: () => import('@/features/quiz/ExamResultPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wrong-questions',
    name: 'WrongQuestions',
    component: () => import('@/features/quiz/WrongQuestionsPage.vue'),
    meta: { requiresAuth: true }
  },

  // ── Bank (admin only) ────────────────────────────────────
  {
    path: '/bank',
    name: 'Bank',
    component: () => import('@/features/bank/BankPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/bank/import',
    name: 'BankImport',
    component: () => import('@/features/bank/BankImportPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // ── Analytics ────────────────────────────────────────────
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/features/analytics/AnalyticsPage.vue'),
    meta: { requiresAuth: true }
  },

  // ── Fallback ─────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: '/quiz'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Wait for auth to initialize (first load)
  if (!auth.initialized) {
    await auth.init()
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && auth.role !== 'admin') {
    return { name: 'Home' }
  }

  if (to.name === 'Login' && auth.isLoggedIn) {
    return { name: 'Home' }
  }
})

export default router
