<script setup>
/**
 * QuizForge AI - Main Application
 * Formula: App = QuestionBankStore × QuestionCard × NavigationState × WrongQuestionsPanel × PracticeMode
 */
import { ref, computed, onMounted, onUnmounted, onErrorCaptured } from 'vue'
import { useQuestionBankStore } from './stores/questionBank'
import { useAnswerTracking } from './composables/useAnswerTracking'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import QuestionCard from './components/QuestionCard.vue'
import WrongQuestionsPanel from './components/WrongQuestionsPanel.vue'
import StatisticsPanel from './components/StatisticsPanel.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

const store = useQuestionBankStore()
const { getWrongQuestions, wrongQuestionsCount, saveAnswer } = useAnswerTracking()
const { registerDefaultHandlers, showHelp, toggleHelp, shortcutsHelp } = useKeyboardShortcuts()

// 錯誤邊界狀態
const hasError = ref(false)
const errorMessage = ref(null)

/**
 * Application State
 */
// 當前題目索引
const currentQuestionIndex = ref(0)

// 答題記錄
const answerHistory = ref([])

// 顯示模式 ('loading' | 'quiz' | 'result' | 'wrong-questions' | 'statistics')
const viewMode = ref('loading')

// 練習模式 ('normal' | 'wrong-practice')
const practiceMode = ref('normal')

// 錯題重練的題目 ID 列表
const wrongPracticeQuestions = ref([])

/**
 * Computed Properties
 */
// 當前題目
const currentQuestion = computed(() => {
  let questions = store.currentQuestions

  // 如果是錯題重練模式，過濾出錯題
  if (practiceMode.value === 'wrong-practice' && wrongPracticeQuestions.value.length > 0) {
    questions = questions.filter(q => wrongPracticeQuestions.value.includes(q.question_id))
  }

  if (questions.length === 0) return null
  return questions[currentQuestionIndex.value]
})

// 總題數
const totalQuestions = computed(() => {
  if (practiceMode.value === 'wrong-practice' && wrongPracticeQuestions.value.length > 0) {
    return store.currentQuestions.filter(q => wrongPracticeQuestions.value.includes(q.question_id)).length
  }
  return store.currentQuestions.length
})

// 統計資訊
const stats = computed(() => {
  const total = answerHistory.value.length
  const correct = answerHistory.value.filter(h => h.isCorrect).length
  const incorrect = total - correct
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return { total, correct, incorrect, accuracy }
})

/**
 * Actions
 */

/**
 * 錯誤捕獲
 */
onErrorCaptured((error, instance, info) => {
  console.error('App.vue caught an error:', error, info)
  hasError.value = true
  errorMessage.value = error.message
  return false
})

/**
 * 載入題庫並初始化
 */
onMounted(async () => {
  console.log('🚀 QuizForge AI - Loading...')

  try {
    await store.loadQuestions()

    if (store.questions.length > 0) {
      viewMode.value = 'quiz'
      console.log('✅ QuizForge AI - Ready!')
      console.log(`📚 Loaded ${store.questions.length} questions`)

      // 初始化鍵盤快捷鍵
      initializeKeyboardShortcuts()
    } else {
      console.error('❌ Failed to load questions')
    }
  } catch (error) {
    console.error('❌ Application initialization failed:', error)
    hasError.value = true
    errorMessage.value = error.message
  }
})

/**
 * 初始化鍵盤快捷鍵
 */
const initializeKeyboardShortcuts = () => {
  const cleanup = registerDefaultHandlers({
    // 答案選擇
    onSelectOption: (optionIndex) => {
      if (viewMode.value === 'quiz' && currentQuestion.value) {
        // 通知 QuestionCard 組件選擇選項
        const event = new CustomEvent('select-option', { detail: { optionIndex } })
        window.dispatchEvent(event)
      }
    },

    // 提交答案
    onSubmit: () => {
      if (viewMode.value === 'quiz') {
        const event = new CustomEvent('submit-answer')
        window.dispatchEvent(event)
      }
    },

    // 下一題
    onNext: () => {
      if (viewMode.value === 'quiz') {
        handleNextQuestion()
      }
    },

    // 上一題
    onPrevious: () => {
      if (viewMode.value === 'quiz') {
        handlePreviousQuestion()
      }
    },

    // 顯示幫助
    onHelp: () => {
      toggleHelp()
    },

    // 統計頁面
    onStatistics: () => {
      viewMode.value = viewMode.value === 'statistics' ? 'quiz' : 'statistics'
    },

    // 重新開始
    onRestart: () => {
      startQuiz()
    },

    // 退出/關閉
    onEscape: () => {
      if (showHelp.value) {
        showHelp.value = false
      } else if (viewMode.value === 'wrong-questions') {
        viewMode.value = 'quiz'
      } else if (viewMode.value === 'statistics') {
        viewMode.value = 'quiz'
      }
    }
  })

  // 組件卸載時清理
  onUnmounted(() => {
    cleanup()
  })
}

/**
 * 處理答案提交
 */
const handleAnswerSubmitted = (answerData) => {
  // 增強答案數據
  const enhancedAnswerData = {
    ...answerData,
    timestamp: answerData.timestamp || new Date().toISOString(),
    topic: currentQuestion.value?.topic || '',
    difficulty: currentQuestion.value?.difficulty || '',
    timeSpent: answerData.timeSpent || 0
  }

  // 記錄答題歷史
  answerHistory.value.push(enhancedAnswerData)

  // 保存到 useAnswerTracking
  saveAnswer(enhancedAnswerData)

  // 更新統計快取
  store.calculateUserStatistics()

  console.log('📝 Answer submitted:', {
    question: currentQuestionIndex.value + 1,
    correct: answerData.isCorrect,
    stats: stats.value,
    topic: enhancedAnswerData.topic,
    difficulty: enhancedAnswerData.difficulty
  })
}

/**
 * 前往下一題
 */
const handleNextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++
    console.log(`➡️ Next question: ${currentQuestionIndex.value + 1}/${totalQuestions.value}`)
  }
}

/**
 * 前往上一題
 */
const handlePreviousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    console.log(`⬅️ Previous question: ${currentQuestionIndex.value + 1}/${totalQuestions.value}`)
  }
}

/**
 * 開始測驗
 */
const startQuiz = () => {
  currentQuestionIndex.value = 0
  answerHistory.value = []
  viewMode.value = 'quiz'
}

/**
 * 查看結果
 */
const viewResults = () => {
  viewMode.value = 'result'
}

/**
 * 查看統計頁面
 */
const viewStatistics = () => {
  viewMode.value = 'statistics'
  // 確保統計資料是最新的
  store.calculateUserStatistics()
}

/**
 * 篩選題目
 */
const filterQuestions = (topic = null, difficulty = null) => {
  if (topic) store.filterByTopic(topic)
  if (difficulty) store.filterByDifficulty(difficulty)
  currentQuestionIndex.value = 0
  answerHistory.value = []
}

/**
 * 重置篩選
 */
const resetFilters = () => {
  store.resetFilters()
  currentQuestionIndex.value = 0
  answerHistory.value = []
  practiceMode.value = 'normal'
  wrongPracticeQuestions.value = []
}

/**
 * 查看錯題本
 */
const viewWrongQuestions = () => {
  viewMode.value = 'wrong-questions'
}

/**
 * 關閉錯題本面板
 */
const closeWrongQuestionsPanel = () => {
  viewMode.value = 'quiz'
}

/**
 * 開始錯題重練
 */
const startWrongPractice = (wrongQuestionIds) => {
  if (!wrongQuestionIds || wrongQuestionIds.length === 0) {
    alert('沒有可用的錯題')
    return
  }

  // 設定錯題重練模式
  practiceMode.value = 'wrong-practice'
  wrongPracticeQuestions.value = wrongQuestionIds

  // 重置狀態
  currentQuestionIndex.value = 0
  answerHistory.value = []

  // 切換到測驗模式
  viewMode.value = 'quiz'

  console.log(`開始錯題重練: ${wrongQuestionIds.length} 題`)
}

/**
 * 退出錯題重練模式
 */
const exitWrongPractice = () => {
  practiceMode.value = 'normal'
  wrongPracticeQuestions.value = []
  currentQuestionIndex.value = 0
  answerHistory.value = []
  console.log('退出錯題重練模式')
}

/**
 * 應用重試處理
 */
const handleAppRetry = () => {
  hasError.value = false
  errorMessage.value = null
  location.reload()
}
</script>

<template>
  <ErrorBoundary
    :show-details="true"
    :show-retry="true"
    :show-report="true"
    @retry="handleAppRetry"
  >
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
    <!-- Header -->
    <header class="max-w-4xl mx-auto mb-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          QuizForge AI
        </h1>
        <p class="text-gray-600">iPAS AI應用規劃師 - 智能題庫系統</p>
      </div>

      <!-- Mode Indicator -->
      <div v-if="practiceMode === 'wrong-practice' && viewMode === 'quiz'" class="mt-4">
        <div class="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg text-center">
          <span class="font-semibold">錯題重練模式</span>
          <span class="mx-2">|</span>
          <span>共 {{ totalQuestions }} 題</span>
        </div>
      </div>

      <!-- Stats Bar -->
      <div v-if="viewMode === 'quiz' && answerHistory.length > 0" class="mt-6 flex justify-center gap-4">
        <div class="bg-white rounded-lg shadow px-4 py-2 text-center">
          <div class="text-xs text-gray-600">已答題</div>
          <div class="text-xl font-bold text-blue-600">{{ stats.total }}</div>
        </div>
        <div class="bg-white rounded-lg shadow px-4 py-2 text-center">
          <div class="text-xs text-gray-600">正確</div>
          <div class="text-xl font-bold text-green-600">{{ stats.correct }}</div>
        </div>
        <div class="bg-white rounded-lg shadow px-4 py-2 text-center">
          <div class="text-xs text-gray-600">錯誤</div>
          <div class="text-xl font-bold text-red-600">{{ stats.incorrect }}</div>
        </div>
        <div class="bg-white rounded-lg shadow px-4 py-2 text-center">
          <div class="text-xs text-gray-600">正確率</div>
          <div class="text-xl font-bold text-purple-600">{{ stats.accuracy }}%</div>
        </div>
      </div>

      <!-- Keyboard Shortcuts Help -->
      <div v-if="showHelp" class="mt-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-blue-900">鍵盤快捷鍵</h3>
            <button
              @click="showHelp = false"
              class="text-blue-600 hover:text-blue-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
      <!-- Loading State -->
      <div v-if="viewMode === 'loading'" class="text-center py-16">
        <LoadingSpinner
          size="xl"
          color="primary"
          text="載入題庫中..."
          :fullscreen="false"
        />
      </div>

      <!-- Quiz Mode -->
      <div v-else-if="viewMode === 'quiz' && currentQuestion">
        <QuestionCard
          :question-data="currentQuestion"
          :question-index="currentQuestionIndex"
          :total-questions="totalQuestions"
          @answer-submitted="handleAnswerSubmitted"
          @next-question="handleNextQuestion"
          @previous-question="handlePreviousQuestion"
        />

        <!-- Control Panel -->
        <div class="mt-6 p-4 bg-white rounded-lg shadow">
          <div class="flex flex-wrap gap-3 justify-center items-center">
            <!-- Exit Wrong Practice Mode -->
            <button
              v-if="practiceMode === 'wrong-practice'"
              @click="exitWrongPractice"
              class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              退出錯題重練
            </button>

            <!-- View Wrong Questions -->
            <button
              v-if="practiceMode === 'normal' && wrongQuestionsCount > 0"
              @click="viewWrongQuestions"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors relative"
            >
              錯題本
              <span class="ml-1 bg-white text-red-600 rounded-full px-2 py-0.5 text-xs font-bold">
                {{ wrongQuestionsCount }}
              </span>
            </button>

            <!-- Reset Filters -->
            <button
              v-if="store.hasActiveFilters && practiceMode === 'normal'"
              @click="resetFilters"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              重置篩選
            </button>

            <!-- View Results -->
            <button
              v-if="answerHistory.length > 0"
              @click="viewResults"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              基本統計
            </button>

            <!-- View Detailed Statistics -->
            <button
              v-if="answerHistory.length > 0"
              @click="viewStatistics"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              詳細分析
            </button>

            <!-- Keyboard Help -->
            <button
              @click="toggleHelp"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              快捷鍵
            </button>

            <!-- Restart Quiz -->
            <button
              @click="startQuiz"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              重新開始
            </button>
          </div>
        </div>
      </div>

      <!-- Wrong Questions Panel -->
      <div v-else-if="viewMode === 'wrong-questions'">
        <WrongQuestionsPanel
          mode="view"
          @start-wrong-practice="startWrongPractice"
          @close-panel="closeWrongQuestionsPanel"
        />
      </div>

      <!-- Result Mode -->
      <div v-else-if="viewMode === 'result'" class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">測驗統計</h2>

        <!-- Overall Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-3xl font-bold text-blue-600">{{ stats.total }}</div>
            <div class="text-sm text-gray-600 mt-1">已答題數</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-3xl font-bold text-green-600">{{ stats.correct }}</div>
            <div class="text-sm text-gray-600 mt-1">答對題數</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-3xl font-bold text-red-600">{{ stats.incorrect }}</div>
            <div class="text-sm text-gray-600 mt-1">答錯題數</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <div class="text-3xl font-bold text-purple-600">{{ stats.accuracy }}%</div>
            <div class="text-sm text-gray-600 mt-1">正確率</div>
          </div>
        </div>

        <!-- Answer History -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">答題記錄</h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="(answer, index) in answerHistory"
              :key="index"
              class="flex items-center justify-between p-3 rounded-lg"
              :class="answer.isCorrect ? 'bg-green-50' : 'bg-red-50'"
            >
              <div class="flex items-center gap-3">
                <div class="font-semibold" :class="answer.isCorrect ? 'text-green-600' : 'text-red-600'">
                  #{{ index + 1 }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ answer.questionId }}
                </div>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <span class="text-gray-600">你的答案: {{ answer.userAnswer }}</span>
                <span v-if="!answer.isCorrect" class="text-gray-400">|</span>
                <span v-if="!answer.isCorrect" class="text-gray-600">正確: {{ answer.correctAnswer }}</span>
                <span :class="answer.isCorrect ? 'text-green-600' : 'text-red-600'" class="font-semibold ml-2">
                  {{ answer.isCorrect ? '✓' : '✗' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-center">
          <button
            @click="viewMode = 'quiz'"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            繼續練習
          </button>
          <button
            @click="startQuiz"
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
          >
            重新開始
          </button>
        </div>
      </div>

      <!-- Statistics Mode -->
      <div v-else-if="viewMode === 'statistics'">
        <StatisticsPanel
          @start-practice="startQuiz"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16 bg-white rounded-lg shadow">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600 text-lg">沒有可用的題目</p>
        <button
          @click="store.loadQuestions()"
          class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          重新載入
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">
      <p>QuizForge AI - INC-005: Statistics & UI/UX Optimization - User Acceptance</p>
      <p class="mt-1">Formula-Contract Methodology | Generated with Claude Code</p>
    </footer>
    </div>
  </ErrorBoundary>
</template>

<style scoped>
/* Custom scrollbar for answer history */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
