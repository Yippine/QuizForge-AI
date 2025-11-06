/**
 * Vue Router Configuration
 * Formula: Router = RouteDefinitions × NavigationGuards × HistoryMode
 */
import { createRouter, createWebHistory } from 'vue-router'

/**
 * Route Definitions
 * Formula: Routes = HomePage + TopicSelection + QuizPage + StatisticsPage + WrongQuestionsPage
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomePage.vue'),
    meta: {
      title: 'QuizForge AI - 主頁',
      requiresAuth: false
    }
  },
  {
    path: '/topics',
    name: 'topics',
    component: () => import('../views/TopicSelection.vue'),
    meta: {
      title: 'QuizForge AI - 主題選擇',
      requiresAuth: false
    }
  },
  {
    path: '/quiz/:topicId?',
    name: 'quiz',
    component: () => import('../views/QuizPage.vue'),
    meta: {
      title: 'QuizForge AI - 答題',
      requiresAuth: false
    }
  },
  {
    path: '/statistics',
    name: 'statistics',
    component: () => import('../components/StatisticsPanel.vue'),
    meta: {
      title: 'QuizForge AI - 統計',
      requiresAuth: false
    }
  },
  {
    path: '/wrong-questions',
    name: 'wrong-questions',
    component: () => import('../components/WrongQuestionsPanel.vue'),
    meta: {
      title: 'QuizForge AI - 錯題本',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

/**
 * Router Instance
 * Formula: RouterInstance = createRouter(HistoryMode + Routes)
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

/**
 * Navigation Guards
 * Formula: NavigationGuard = BeforeEach × AfterEach × TitleUpdate
 */
router.beforeEach((to, from, next) => {
  // Update document title
  document.title = to.meta.title || 'QuizForge AI'

  // Future: Add authentication check if needed
  // if (to.meta.requiresAuth && !isAuthenticated()) {
  //   next('/login')
  // } else {
  //   next()
  // }

  next()
})

router.afterEach((to, from) => {
  // Analytics or tracking can be added here
  console.log(`[Router] Navigation: ${from.path} -> ${to.path}`)
})

export default router
