<script setup>
/**
 * QuizPage - Quiz Practice View
 * Formula: QuizPage = QuestionCard + Navigation + Stats + Controls + MobileOptimization
 * Responsibility: 答題練習頁面，整合題目卡片、導航和統計
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionBankStore } from '../stores/questionBank'
import { useQuizResultsStore } from '../stores/quizResults'
import { useAnswerTracking } from '../composables/useAnswerTracking'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useTimer } from '../composables/useTimer'
import { useCountdownTimer } from '../composables/useCountdownTimer'
import { useSwipe } from '@vueuse/core'
import QuestionCard from '../components/QuestionCard.vue'
import MobileNavigation from '../components/MobileNavigation.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()
const store = useQuestionBankStore()
const resultsStore = useQuizResultsStore()
const { getWrongQuestions, wrongQuestionsCount, saveAnswer } = useAnswerTracking()
const { registerDefaultHandlers, showHelp, toggleHelp, shortcutsHelp } = useKeyboardShortcuts()
const { start: startTimer, stop: stopTimer, getTimeData } = useTimer()
const { start: startCountdown, stop: stopCountdown, formattedTime: countdownTime, isWarning, isTimeUp } = useCountdownTimer()

/**
 * State
 */
const currentQuestionIndex = ref(0)
const answerHistory = ref([])
const practiceMode = ref('normal') // 'normal' | 'wrong-practice'
const wrongPracticeQuestions = ref([])
const swipeTarget = ref(null)
// INC-016: Mode state for practice/exam mode
const mode = ref('practice') // 'practice' | 'exam'
// INC-016: Answer states memory - 存儲每道題目的答題狀態
const answerStates = ref(new Map()) // key: question_id, value: { selectedAnswer, answerState }
// INC-018: Question count limit and time limit
const questionCountLimit = ref(null)
const timeLimitMinutes = ref(null)
// INC-019: Shuffle configuration for questions and options
const shouldShuffleOptions = ref(false)
// INC-019: Session seed for options shuffling (ensures different shuffle on retry)
const sessionSeed = ref(Date.now())

/**
 * Computed
 */
const currentQuestion = computed(() => {
  let questions = store.currentQuestions

  if (practiceMode.value === 'wrong-practice' && wrongPracticeQuestions.value.length > 0) {
    questions = questions.filter(q => wrongPracticeQuestions.value.includes(q.question_id))
  }

  // INC-018: Apply question count limit
  if (questionCountLimit.value && questionCountLimit.value > 0) {
    questions = questions.slice(0, questionCountLimit.value)
  }

  if (questions.length === 0) return null
  return questions[currentQuestionIndex.value]
})

const totalQuestions = computed(() => {
  if (practiceMode.value === 'wrong-practice' && wrongPracticeQuestions.value.length > 0) {
    return store.currentQuestions.filter(q => wrongPracticeQuestions.value.includes(q.question_id)).length
  }

  // INC-018: Apply question count limit
  if (questionCountLimit.value && questionCountLimit.value > 0) {
    return Math.min(questionCountLimit.value, store.currentQuestions.length)
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

// INC-016: 獲取當前題目的初始答題狀態
const currentQuestionState = computed(() => {
  if (!currentQuestion.value) return null
  return answerStates.value.get(currentQuestion.value.question_id) || null
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

  // INC-016: 保存答題狀態到記憶中
  if (currentQuestion.value) {
    answerStates.value.set(currentQuestion.value.question_id, {
      selectedAnswer: answerData.userAnswer,
      answerState: answerData.isCorrect ? 'correct' : 'incorrect'
    })
  }
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
  // INC-016-ENHANCE: Clear answer states on reset
  answerStates.value.clear()
}

/**
 * INC-019: 生成 keyMapping（與 QuestionCard 相同邏輯）
 * @param {string} questionId - 題目 ID
 * @param {Object} options - 選項物件
 * @returns {Object} - 新 key -> 原始 key 的映射
 */
const generateKeyMapping = (questionId, options) => {
  if (!shouldShuffleOptions.value || !options) {
    return { A: 'A', B: 'B', C: 'C', D: 'D' }
  }

  // 使用相同的 question_id + sessionSeed 組合種子
  const combinedSeed = questionId + '_' + sessionSeed.value
  let hash = 0
  for (let i = 0; i < combinedSeed.length; i++) {
    hash = ((hash << 5) - hash) + combinedSeed.charCodeAt(i)
    hash = hash & hash
  }

  let randomSeed = Math.abs(hash)
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  const optionsArray = Object.entries(options)
  const shuffled = [...optionsArray]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const newLabels = ['A', 'B', 'C', 'D']
  const mapping = {}
  shuffled.forEach((item, index) => {
    mapping[newLabels[index]] = item[0]
  })

  return mapping
}

/**
 * INC-017: 準備並跳轉到結果頁面
 * Formula: prepareResults() -> saveResults -> navigate(/results)
 * INC-019: 考慮選項隨機化的答案驗證
 */
const goToResults = () => {
  // INC-018: 停止計時（包括倒數計時）
  stopTimer()
  if (timeLimitMinutes.value) {
    stopCountdown()
  }
  const timeData = getTimeData()

  // INC-020-HOTFIX: 應用題數限制，確保只處理用戶選擇的題數
  let questionsToProcess = store.currentQuestions

  // 應用錯題練習過濾
  if (practiceMode.value === 'wrong-practice' && wrongPracticeQuestions.value.length > 0) {
    questionsToProcess = questionsToProcess.filter(q => wrongPracticeQuestions.value.includes(q.question_id))
  }

  // 應用題數限制
  if (questionCountLimit.value && questionCountLimit.value > 0) {
    questionsToProcess = questionsToProcess.slice(0, questionCountLimit.value)
  }

  // 計算結果統計（根據模式不同處理）
  let questionResults = []

  if (mode.value === 'exam') {
    // 考試模式：從 answerStates 獲取答案並驗證
    questionResults = questionsToProcess.map(question => {
      const state = answerStates.value.get(question.question_id)
      const userAnswer = state?.selectedAnswer || null

      // INC-019: 如果有選項隨機化，需要將 userAnswer 映射回原始 key
      let isCorrect = false
      if (userAnswer !== null) {
        const keyMapping = generateKeyMapping(question.question_id, question.options)
        const originalKey = keyMapping[userAnswer]
        isCorrect = originalKey === question.answer
      }

      return {
        question,
        userAnswer,
        correctAnswer: question.answer,
        isCorrect
      }
    })
  } else {
    // 練習模式：從 answerHistory 獲取答案（已經驗證過）
    questionResults = questionsToProcess.map(question => {
      const answerRecord = answerHistory.value.find(a => a.questionId === question.question_id)
      return {
        question,
        userAnswer: answerRecord?.userAnswer || null,
        correctAnswer: question.answer,
        isCorrect: answerRecord?.isCorrect || false
      }
    })
  }

  // 計算統計（只統計已作答題目）
  const answeredResults = questionResults.filter(item => item.userAnswer !== null)
  const total = answeredResults.length
  const correctCount = answeredResults.filter(item => item.isCorrect).length
  const incorrectCount = total - correctCount
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0

  // 準備錯題列表（只包含已作答且答錯的題目）
  const wrongQuestions = questionResults.filter(item => !item.isCorrect && item.userAnswer !== null)

  // 準備答題配置（用於重新練習）
  const route = router.currentRoute.value
  const quizConfig = {
    topicId: route.params.topicId || route.query.topic || null,
    mode: mode.value,
    // INC-020-HOTFIX: 使用過濾後的題目列表，確保題數一致
    questionIds: questionsToProcess.map(q => q.question_id),
    questionCount: questionCountLimit.value,
    timeLimit: timeLimitMinutes.value,
    // INC-019-HOTFIX: 保存選項隨機配置，用於結果頁面重現相同順序
    sessionSeed: sessionSeed.value,
    shouldShuffleOptions: shouldShuffleOptions.value
  }

  // 保存結果到 store
  resultsStore.saveResults({
    totalQuestions: total,
    correctCount,
    incorrectCount,
    accuracy,
    elapsedTime: timeData.elapsedMs,
    formattedTime: timeData.formattedTime,
    questionResults,
    wrongQuestions,
    quizConfig
  })

  // 跳轉到結果頁面
  router.push('/results')
  console.log('🎯 Navigating to results page:', {
    totalQuestions: total,
    correctCount,
    accuracy: `${accuracy}%`,
    formattedTime: timeData.formattedTime
  })
}

/**
 * INC-017: 處理考試模式提交考券事件
 * Formula: handleSubmitExam() -> goToResults()
 */
const handleSubmitExam = () => {
  goToResults()
}

/**
 * INC-016-ENHANCE: Handle exam mode auto-save from QuestionCard
 * Formula: examAutoSave(event) -> answerStates.set(questionId, {selectedAnswer, answerState: 'unanswered'})
 */
const handleSelectedAnswerUpdate = (event) => {
  if (mode.value === 'exam' && event.questionId && event.selectedAnswer) {
    const existingState = answerStates.value.get(event.questionId)
    if (!existingState || existingState.selectedAnswer !== event.selectedAnswer) {
      answerStates.value.set(event.questionId, {
        selectedAnswer: event.selectedAnswer,
        answerState: 'unanswered' // 考試模式不驗證對錯
      })
      console.log(`📝 [Exam Mode] Auto-saved answer for question ${event.questionId}: ${event.selectedAnswer}`)
    }
  }
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
      // INC-016-ENHANCE: Disable submit in exam mode
      if (mode.value === 'practice') {
        const event = new CustomEvent('submit-answer')
        window.dispatchEvent(event)
      }
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
  const routeMode = route.query.mode
  const topicId = route.params.topicId || route.query.topic

  // INC-016: 設定練習/考試模式 (practice | exam)
  if (routeMode === 'exam' || routeMode === 'practice') {
    mode.value = routeMode
    console.log(`🎯 Mode set to: ${mode.value}`)
  }

  // INC-018: 取得題數和時間限制
  if (route.query.questionCount) {
    questionCountLimit.value = parseInt(route.query.questionCount)
    console.log(`📝 Question count limit: ${questionCountLimit.value}`)
  }
  if (route.query.timeLimit) {
    timeLimitMinutes.value = parseInt(route.query.timeLimit)
    console.log(`⏱️ Time limit: ${timeLimitMinutes.value} minutes`)
  }

  // INC-021: Extract range parameter from route query
  const range = route.query.range
  if (range) {
    console.log(`🎯 Range filter: ${range}`)
  }

  // INC-019: Shuffle configuration - [shouldShuffleQuestions, shouldShuffleOptions]
  const shuffleConfig = {
    'topic-practice': [false, true],   // 主題學習+練習：題目不隨機，選項隨機
    'topic-exam': [true, true],        // 主題學習+考試：題目隨機，選項隨機
    'mock-practice': [true, true],     // 模擬考試+練習：題目隨機，選項隨機
    'mock-exam': [true, true]          // 模擬考試+考試：題目隨機，選項隨機
  }

  // INC-012: Wrong questions mode 初始化
  if (routeMode === 'wrong-questions') {
    practiceMode.value = 'wrong-practice'
    const ids = route.query.ids
    if (ids) {
      wrongPracticeQuestions.value = ids.split(',')
      console.log(`📝 Wrong questions mode: ${wrongPracticeQuestions.value.length} questions loaded`)
    } else {
      console.warn('⚠️ Wrong questions mode activated but no question IDs provided')
    }
  } else {
    // INC-021: Apply range filter before topic filter
    if (range === 'all') {
      // 選擇「全部主題」時，不套用任何範圍過濾（但仍會套用後續的 topic filter）
      // 如果之前有設定範圍過濾，這裡不會重置，因為可能是主題學習模式
      console.log(`🔍 Range filter: All questions selected`)
    } else if (range === 'official') {
      store.filterByTopic('OFFICIAL')
      console.log(`🔍 Range filter applied: Official questions, filtered: ${store.filteredQuestions.length}`)
    } else if (range === 'L21' || range === 'L23') {
      store.filterBySubject(range)
      console.log(`🔍 Range filter applied: Subject ${range}, filtered: ${store.filteredQuestions.length}`)
    }

    // INC-011: Topic filter mode (after range filter)
    if (topicId) {
      store.filterByTopic(topicId)
      console.log(`🔍 Topic filter applied: ${topicId}, filtered questions: ${store.filteredQuestions.length}`)
    }
  }

  // INC-019: Apply shuffle configuration based on mode
  // 使用 store.currentFilters.topic 判斷是否為主題學習模式（更可靠）
  const isMockExam = !store.currentFilters.topic
  const modeType = isMockExam ? 'mock' : 'topic'
  const configKey = `${modeType}-${routeMode}`
  const [shouldShuffleQuestions, shouldShuffleOptionsValue] = shuffleConfig[configKey] || [false, false]

  console.log(`📋 Mode detection: topicFilter=${store.currentFilters.topic}, isMockExam=${isMockExam}, configKey=${configKey}`)

  // Set options shuffle flag
  shouldShuffleOptions.value = shouldShuffleOptionsValue

  // INC-019: Generate new session seed for this quiz session
  sessionSeed.value = Date.now()
  console.log(`🎲 Session seed generated: ${sessionSeed.value}`)

  // Shuffle questions if needed
  if (shouldShuffleQuestions) {
    const source = store.hasActiveFilters ? store.filteredQuestions : store.questions
    // 使用 Fisher-Yates 洗牌算法，確保真正的隨機性
    const shuffled = [...source]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    store.setShuffledQuestions(shuffled)
    console.log(`🔀 Questions shuffled for ${configKey} mode: ${shuffled.length} questions`)
  } else {
    // 清除之前的打亂狀態
    store.clearShuffledQuestions()
  }

  console.log(`🎲 Shuffle config for ${configKey}: questions=${shouldShuffleQuestions}, options=${shouldShuffleOptionsValue}`)

  initializeKeyboardShortcuts()

  // INC-017: 開始計時
  startTimer()

  // INC-018: 如果有時間限制，開始倒數計時
  if (timeLimitMinutes.value && timeLimitMinutes.value > 0) {
    startCountdown(timeLimitMinutes.value, () => {
      // 時間到自動提交
      console.log('⏰ Time is up! Auto-submitting exam...')
      goToResults()
    })
  }
})

/**
 * INC-017: 檢查是否完成所有題目
 * Formula: isAllAnswered() -> boolean
 */
const isAllAnswered = computed(() => {
  return answerHistory.value.length === totalQuestions.value && totalQuestions.value > 0
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

      <!-- INC-018: Countdown Timer (if time limit is set) -->
      <div v-if="timeLimitMinutes && countdownTime" class="mb-4">
        <div
          :class="[
            'px-4 py-3 rounded-lg text-center font-bold text-lg md:text-xl transition-colors',
            isWarning
              ? 'bg-red-100 border-2 border-red-500 text-red-700 animate-pulse'
              : 'bg-blue-100 border-2 border-blue-500 text-blue-700'
          ]"
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>剩餘時間：{{ countdownTime }}</span>
          </div>
          <p v-if="isWarning" class="text-xs md:text-sm mt-1">時間即將結束！</p>
        </div>
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
          :mode="mode"
          :initial-state="currentQuestionState"
          :is-all-answered="isAllAnswered"
          :should-shuffle-options="shouldShuffleOptions"
          :session-seed="sessionSeed"
          @answer-submitted="handleAnswerSubmitted"
          @next-question="handleNextQuestion"
          @previous-question="handlePreviousQuestion"
          @update:selected-answer="handleSelectedAnswerUpdate"
          @submit-exam="handleSubmitExam"
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
