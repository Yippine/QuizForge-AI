<script setup>
/**
 * QuizPage - Quiz Practice View
 * Formula: QuizPage = QuestionCard + Navigation + Stats + Controls + MobileOptimization
 * Responsibility: 答題練習頁面，整合題目卡片、導航和統計
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionBankStore } from '../stores/questionBank'
import { useAnswerTracking } from '../composables/useAnswerTracking'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useSwipe } from '@vueuse/core'
import QuestionCard from '../components/QuestionCard.vue'
import MobileNavigation from '../components/MobileNavigation.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()
const store = useQuestionBankStore()
const { getWrongQuestions, wrongQuestionsCount, saveAnswer } = useAnswerTracking()
const { registerDefaultHandlers, showHelp, toggleHelp, shortcutsHelp } = useKeyboardShortcuts()

/**
 * State
 */
const currentQuestionIndex = ref(0)
const answerHistory = ref([])
const practiceMode = ref('normal') // 'normal' | 'wrong-practice'
const wrongPracticeQuestions = ref([])
const swipeTarget = ref(null)

/**
 * Computed
 */
const currentQuestion = computed(() => {
  let questions = store.currentQuestions

  if (practiceMode.value === 'wrong-practice' && wrongPracticeQuestions.value.length > 0) {
    questions = questions.filter(q => wrongPracticeQuestions.value.includes(q.question_id))
  }

  if (questions.length === 0) return null
  return questions[currentQuestionIndex.value]
})

const totalQuestions = computed(() => {
  if (practiceMode.value === 'wrong-practice' && wrongPracticeQuestions.value.length > 0) {
    return store.currentQuestions.filter(q => wrongPracticeQuestions.value.includes(q.question_id)).length
  }
  return store.currentQuestions.length
})

const stats = computed(() => {
  const total = answerHistory.value.length
  const correct = answerHistory.value.filter(h => h.isCorrect).length
  const incorrect = total - correct
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return { total, correct, incorrect, accuracy }
})

/**
 * Swipe Gesture Support
 */
const { direction } = useSwipe(swipeTarget, {
  onSwipeEnd(e, direction) {
    if (direction === 'left') {
      handleNextQuestion()
    } else if (direction === 'right') {
      handlePreviousQuestion()
    }
  }
})

/**
 * Actions
 */
const handleAnswerSubmitted = (answerData) => {
  const enhancedAnswerData = {
    ...answerData,
    timestamp: answerData.timestamp || new Date().toISOString(),
    topic: currentQuestion.value?.topic || '',
    difficulty: currentQuestion.value?.difficulty || '',
    timeSpent: answerData.timeSpent || 0
  }

  answerHistory.value.push(enhancedAnswerData)
  saveAnswer(enhancedAnswerData)
  store.calculateUserStatistics()
}

const handleNextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++
  }
}

const handlePreviousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const goHome = () => {
  router.push('/')
}

const viewStatistics = () => {
  router.push('/statistics')
}

const viewWrongQuestions = () => {
  router.push('/wrong-questions')
}

const resetQuiz = () => {
  currentQuestionIndex.value = 0
  answerHistory.value = []
  practiceMode.value = 'normal'
  wrongPracticeQuestions.value = []
}

/**
 * Keyboard Shortcuts
 */
const initializeKeyboardShortcuts = () => {
  const cleanup = registerDefaultHandlers({
    onSelectOption: (optionIndex) => {
      if (currentQuestion.value) {
        const event = new CustomEvent('select-option', { detail: { optionIndex } })
        window.dispatchEvent(event)
      }
    },
    onSubmit: () => {
      const event = new CustomEvent('submit-answer')
      window.dispatchEvent(event)
    },
    onNext: handleNextQuestion,
    onPrevious: handlePreviousQuestion,
    onHelp: toggleHelp,
    onStatistics: viewStatistics,
    onRestart: resetQuiz,
    onEscape: () => {
      if (showHelp.value) {
        showHelp.value = false
      } else {
        goHome()
      }
    }
  })

  onUnmounted(() => {
    cleanup()
  })
}

/**
 * Lifecycle
 */
onMounted(async () => {
  if (store.questions.length === 0) {
    await store.loadQuestions()
  }

  // INC-012: 從路由取得 mode 和參數
  const route = router.currentRoute.value
  const mode = route.query.mode
  const topicId = route.params.topicId || route.query.topic

  // INC-012: Wrong questions mode 初始化
  if (mode === 'wrong-questions') {
    practiceMode.value = 'wrong-practice'
    const ids = route.query.ids
    if (ids) {
      wrongPracticeQuestions.value = ids.split(',')
      console.log(`📝 Wrong questions mode: ${wrongPracticeQuestions.value.length} questions loaded`)
    } else {
      console.warn('⚠️ Wrong questions mode activated but no question IDs provided')
    }
  } else if (topicId) {
    // INC-011: Topic filter mode
    store.filterByTopic(topicId)
    console.log(`🔍 Topic filter applied: ${topicId}, filtered questions: ${store.filteredQuestions.length}`)
  }

  initializeKeyboardShortcuts()
})
</script>

<template>
  <div ref="swipeTarget" class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-4 md:py-8 px-2 md:px-4">
    <!-- Mobile Header -->
    <header class="max-w-4xl mx-auto mb-4 md:mb-8">
      <!-- Back Button -->
      <button
        @click="goHome"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm md:text-base"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回主頁
      </button>

      <!-- Title -->
      <div class="text-center mb-4">
        <h1 class="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
          QuizForge AI
        </h1>
        <p class="text-sm md:text-base text-gray-600">答題練習</p>
      </div>

      <!-- Mode Indicator -->
      <div v-if="practiceMode === 'wrong-practice'" class="mb-4">
        <div class="bg-warning-100 border border-warning-300 text-warning-800 px-3 md:px-4 py-2 rounded-lg text-center text-sm md:text-base">
          <span class="font-semibold">錯題重練模式</span>
          <span class="mx-2">|</span>
          <span>共 {{ totalQuestions }} 題</span>
        </div>
      </div>

      <!-- Stats Bar -->
      <div v-if="answerHistory.length > 0" class="flex justify-center gap-4 md:gap-6 text-xs md:text-base mb-8">
        <div class="bg-white rounded-lg shadow px-5 md:px-6 py-4 text-center min-w-[80px] min-h-[52px] md:min-w-[100px]">
          <div class="text-xs md:text-sm text-gray-600 mb-1">已答</div>
          <div class="text-lg md:text-xl font-bold text-primary-600">{{ stats.total }}</div>
        </div>
        <div class="bg-white rounded-lg shadow px-5 md:px-6 py-4 text-center min-w-[80px] min-h-[52px] md:min-w-[100px]">
          <div class="text-xs md:text-sm text-gray-600 mb-1">正確</div>
          <div class="text-lg md:text-xl font-bold text-accent-600">{{ stats.correct }}</div>
        </div>
        <div class="bg-white rounded-lg shadow px-5 md:px-6 py-4 text-center min-w-[80px] min-h-[52px] md:min-w-[100px]">
          <div class="text-xs md:text-sm text-gray-600 mb-1">錯誤</div>
          <div class="text-lg md:text-xl font-bold text-red-600">{{ stats.incorrect }}</div>
        </div>
        <div class="bg-white rounded-lg shadow px-5 md:px-6 py-4 text-center min-w-[80px] min-h-[52px] md:min-w-[100px]">
          <div class="text-xs md:text-sm text-gray-600 mb-1">正確率</div>
          <div class="text-lg md:text-xl font-bold text-secondary-600">{{ stats.accuracy }}%</div>
        </div>
      </div>

      <!-- Keyboard Help (Desktop Only) -->
      <div v-if="showHelp" class="mt-4 hidden md:block">
        <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-primary-900">鍵盤快捷鍵</h3>
            <button @click="showHelp = false" class="text-primary-600 hover:text-primary-800">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div
              v-for="shortcut in shortcutsHelp.shortcuts"
              :key="shortcut.key"
              class="flex items-center justify-between"
            >
              <span class="text-gray-700">{{ shortcut.description }}</span>
              <kbd class="px-2 py-1 text-xs bg-white border border-gray-300 rounded">{{ shortcut.key }}</kbd>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto">
      <!-- Loading -->
      <div v-if="!currentQuestion" class="text-center py-16">
        <LoadingSpinner size="xl" color="primary" text="載入題目中..." />
      </div>

      <!-- Question Card -->
      <div v-else>
        <QuestionCard
          :question-data="currentQuestion"
          :question-index="currentQuestionIndex"
          :total-questions="totalQuestions"
          @answer-submitted="handleAnswerSubmitted"
          @next-question="handleNextQuestion"
          @previous-question="handlePreviousQuestion"
        />

        <!-- Desktop Control Panel -->
        <div class="mt-4 md:mt-6 p-3 md:p-4 bg-white rounded-lg shadow hidden md:block">
          <div class="flex flex-wrap gap-3 justify-center items-center">
            <button
              v-if="wrongQuestionsCount > 0"
              @click="viewWrongQuestions"
              class="px-4 py-2 bg-warning-600 hover:bg-warning-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              錯題本
              <span class="ml-1 bg-white text-warning-600 rounded-full px-2 py-0.5 text-xs font-bold">
                {{ wrongQuestionsCount }}
              </span>
            </button>
            <button
              @click="viewStatistics"
              class="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              統計分析
            </button>
            <button
              @click="toggleHelp"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              快捷鍵
            </button>
            <button
              @click="resetQuiz"
              class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              重新開始
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Mobile Navigation -->
    <MobileNavigation
      :wrong-questions-count="wrongQuestionsCount"
      @home="goHome"
      @statistics="viewStatistics"
      @wrong-questions="viewWrongQuestions"
      @reset="resetQuiz"
    />

    <!-- Footer -->
    <footer class="max-w-4xl mx-auto mt-8 text-center text-xs md:text-sm text-gray-500 pb-20 md:pb-0">
      <p>Formula-Contract Methodology | Generated with Claude Code</p>
    </footer>
  </div>
</template>

<style scoped>
/* Mobile optimizations */
@media (max-width: 768px) {
  /* Touch-friendly spacing */
  .gap-2 {
    gap: 0.5rem;
  }

  /* Ensure content doesn't hide behind mobile nav */
  main {
    padding-bottom: 5rem;
  }
}
</style>
