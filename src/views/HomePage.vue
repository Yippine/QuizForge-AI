<script setup>
/**
 * HomePage Component
 * Formula: HomePage = HeroSection + ModeSelection + QuickStats + NavigationCards
 * Responsibility: 主頁入口，提供練習模式選擇和快速統計
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionBankStore } from '../stores/questionBank'
import { useAnswerTracking } from '../composables/useAnswerTracking'

const router = useRouter()
const store = useQuestionBankStore()
const { getStatistics, wrongQuestionsCount } = useAnswerTracking()

/**
 * State
 */
const loading = ref(true)
const stats = ref({
  total: 0,
  correct: 0,
  accuracy: 0
})

/**
 * Computed
 */
const questionBankSize = computed(() => store.questions.length)

/**
 * Actions
 */
const startTopicSelection = () => {
  router.push('/topics')
}

const startRandomPractice = () => {
  store.resetFilters()
  router.push('/quiz')
}

const viewWrongQuestions = () => {
  router.push('/wrong-questions')
}

const viewStatistics = () => {
  router.push('/statistics')
}

/**
 * Lifecycle
 */
onMounted(async () => {
  try {
    // Load question bank
    await store.loadQuestions()

    // Load statistics
    const userStats = getStatistics()
    stats.value = {
      total: userStats.totalAnswered || 0,
      correct: userStats.totalCorrect || 0,
      accuracy: userStats.totalAnswered > 0
        ? Math.round((userStats.totalCorrect / userStats.totalAnswered) * 100)
        : 0
    }

    loading.value = false
  } catch (error) {
    console.error('Failed to load data:', error)
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
        <p class="text-gray-600 text-lg">載入中...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-6xl mx-auto">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">
          QuizForge AI
        </h1>
        <p class="text-xl text-gray-600 mb-2">iPAS AI應用規劃師 - 智能題庫系統</p>
        <p class="text-base text-gray-500">
          開始你的學習之旅，掌握 AI 應用規劃核心知識
        </p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6 mb-12">
        <div class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal">
          <div class="text-3xl font-bold text-primary-600">{{ questionBankSize }}</div>
          <div class="text-sm text-gray-600 mt-3">題庫總題數</div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal">
          <div class="text-3xl font-bold text-accent-600">{{ stats.total }}</div>
          <div class="text-sm text-gray-600 mt-3">已答題數</div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal">
          <div class="text-3xl font-bold text-secondary-600">{{ stats.accuracy }}%</div>
          <div class="text-sm text-gray-600 mt-3">正確率</div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal relative">
          <div class="text-3xl font-bold text-warning-600">{{ wrongQuestionsCount }}</div>
          <div class="text-sm text-gray-600 mt-3">錯題數量</div>
          <span v-if="wrongQuestionsCount > 0" class="absolute top-2 right-2 bg-warning-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            !
          </span>
        </div>
      </div>

      <!-- Mode Selection Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Topic Selection Mode -->
        <div
          @click="startTopicSelection"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-normal border-2 border-transparent hover:border-primary-600"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">主題練習</h2>
              <p class="text-sm text-gray-500">Topic Practice</p>
            </div>
          </div>
          <p class="text-gray-600 mb-4">
            選擇特定主題進行針對性練習，涵蓋 L21101-L21203 全部 23 個考試主題
          </p>
          <div class="flex items-center justify-between">
            <span class="text-sm text-primary-600 font-semibold">23 個主題可選</span>
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        <!-- Random Practice Mode -->
        <div
          @click="startRandomPractice"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-normal border-2 border-transparent hover:border-accent-600"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-accent-100 rounded-xl flex items-center justify-center">
              <svg class="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">隨機練習</h2>
              <p class="text-sm text-gray-500">Random Practice</p>
            </div>
          </div>
          <p class="text-gray-600 mb-4">
            隨機抽取題目進行全面練習，快速開始，全面覆蓋所有知識點
          </p>
          <div class="flex items-center justify-between">
            <span class="text-sm text-accent-600 font-semibold">立即開始</span>
            <svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Additional Features -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Wrong Questions -->
        <button
          v-if="wrongQuestionsCount > 0"
          @click="viewWrongQuestions"
          class="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-normal border-2 border-transparent hover:border-warning-500"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">錯題本</h3>
                <p class="text-sm text-gray-600">重點複習錯題</p>
              </div>
            </div>
            <span class="bg-warning-500 text-white rounded-full px-4 py-2 text-sm font-bold">
              {{ wrongQuestionsCount }} 題
            </span>
          </div>
        </button>

        <!-- Statistics -->
        <button
          @click="viewStatistics"
          class="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-normal border-2 border-transparent hover:border-secondary-500"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">學習統計</h3>
                <p class="text-sm text-gray-600">查看詳細分析</p>
              </div>
            </div>
            <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      <!-- Footer Info -->
      <div class="mt-12 text-center text-sm text-gray-500">
        <p>Formula-Contract Methodology | Generated with Claude Code</p>
        <p class="mt-1">INC-006: UI/UX Comprehensive Redesign & Bug Fixes</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth animations */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-normal {
  transition-duration: 300ms;
}

/* Hover effects */
.transform:hover {
  transform: translateY(-4px);
}
</style>
