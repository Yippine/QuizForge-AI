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
    path: '/lectures',
    name: 'lectures',
    component: () => import('../views/LectureSubjects.vue'),
    meta: {
      title: 'QuizForge AI - 講義科目',
      requiresAuth: false
    }
  },
  {
    path: '/lectures/:subjectId',
    name: 'subject-lectures',
    component: () => import('../views/SubjectLectures.vue'),
    meta: {
      title: 'QuizForge AI - 講義列表',
      requiresAuth: false
    }
  },
  {
    path: '/lectures/:subjectId/:lectureId',
    name: 'lecture-detail',
    component: () => import('../views/LectureDetail.vue'),
    meta: {
      title: 'QuizForge AI - 講義詳情',
      requiresAuth: false
    }
  },
  {
    path: '/exam-settings',
    name: 'exam-settings',
    component: () => import('../views/ExamSettings.vue'),
    meta: {
      title: 'QuizForge AI - 模擬考試設定',
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
    path: '/results',
    name: 'results',
    component: () => import('../views/ResultsPage.vue'),
    meta: {
      title: 'QuizForge AI - 答題結果',
      requiresAuth: false
    }
  },
  // iPAS Learning Resources - Hierarchical Navigation (INC-029+030)
  {
    path: '/resources/ipas',
    name: 'ipas-overview',
    component: () => import('../views/IpasOverview.vue'),
    meta: {
      title: 'QuizForge AI - iPAS 能力鑑定',
      breadcrumbs: [{ name: 'iPAS', path: '/resources/ipas' }]
    }
  },
  {
    path: '/resources/ipas/:certificationId',
    name: 'certification-view',
    component: () => import('../views/CertificationView.vue'),
    meta: {
      title: 'QuizForge AI - 認證詳情',
      breadcrumbs: 'dynamic' // Will be computed in component
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId',
    name: 'level-view',
    component: () => import('../views/LevelView.vue'),
    meta: {
      title: 'QuizForge AI - 等級詳情',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId',
    name: 'subject-hub',
    component: () => import('../views/SubjectHub.vue'),
    meta: {
      title: 'QuizForge AI - 科目總覽',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/materials',
    name: 'subject-materials',
    component: () => import('../views/ResourceTypes.vue'),
    meta: {
      title: 'QuizForge AI - 學習資源',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/materials/:resourceType',
    name: 'subject-resource-list',
    component: () => import('../views/ResourceList.vue'),
    meta: {
      title: 'QuizForge AI - 資源列表',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/materials/:resourceType/:resourceId',
    name: 'subject-resource-detail',
    component: () => import('../views/ResourceDetail.vue'),
    meta: {
      title: 'QuizForge AI - 資源詳情',
      breadcrumbs: 'dynamic'
    }
  },
  // Glossary Routes (INC-035)
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/materials/glossary',
    name: 'glossary-list',
    component: () => import('../views/GlossaryListView.vue'),
    meta: {
      title: 'QuizForge AI - 專業術語表',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/materials/glossary/:termId',
    name: 'glossary-detail',
    component: () => import('../views/GlossaryDetail.vue'),
    meta: {
      title: 'QuizForge AI - 術語詳情',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/practice',
    name: 'practice-hub',
    component: () => import('../views/PracticeHub.vue'),
    meta: {
      title: 'QuizForge AI - 題目區',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/practice/topics',
    name: 'practice-topics',
    component: () => import('../views/TopicSelection.vue'),
    meta: {
      title: 'QuizForge AI - 主題練習',
      breadcrumbs: 'dynamic'
    }
  },
  {
    path: '/resources/ipas/:certificationId/:levelId/:subjectId/practice/exam',
    name: 'practice-exam',
    component: () => import('../views/ExamSettings.vue'),
    meta: {
      title: 'QuizForge AI - 模擬考試',
      breadcrumbs: 'dynamic'
    }
  },
  // Legacy URL Redirects (INC-036)
  // Redirect old paths to new hierarchical structure for backward compatibility
  {
    path: '/resources',
    redirect: '/resources/ipas'
  },
  {
    path: '/resources/intermediate/:subjectId',
    redirect: to => `/resources/ipas/ai-planning/intermediate/${to.params.subjectId}`
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
