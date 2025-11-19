<script setup>
/**
 * QuestionCard Component
 * Formula: QuestionCard = QuestionDisplay + OptionsGrid + (AnswerFeedback | Explanation) + NavigationControls + AnswerTracking
 * Responsibility: 題目卡片容器，組合所有子組件，管理答題狀態，整合答題記錄
 * INC-016-ENHANCE: Optimized button layout with circular nav buttons and mode-based display
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline'
import OptionButton from './OptionButton.vue'
import AnswerFeedback from './AnswerFeedback.vue'
import Explanation from './Explanation.vue'
import { useAnswerTracking } from '../composables/useAnswerTracking'

const props = defineProps({
  // 題目資料
  questionData: {
    type: Object,
    required: true
  },
  // 題目索引 (從 0 開始)
  questionIndex: {
    type: Number,
    required: true
  },
  // 總題數
  totalQuestions: {
    type: Number,
    required: true
  },
  // INC-016: 練習/考試模式
  mode: {
    type: String,
    default: 'practice',
    validator: (value) => ['practice', 'exam'].includes(value)
  },
  // INC-016: 初始答題狀態 (用於恢復已作答題目)
  initialState: {
    type: Object,
    default: null
  },
  // INC-017: 是否已完成所有題目
  isAllAnswered: {
    type: Boolean,
    default: false
  },
  // INC-019: 是否隨機化選項順序
  shouldShuffleOptions: {
    type: Boolean,
    default: false
  },
  // INC-019: Session seed for ensuring different shuffle on retry
  sessionSeed: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['answer-submitted', 'next-question', 'previous-question', 'update:selectedAnswer', 'submit-exam'])

// Use answer tracking composable
const { saveAnswer } = useAnswerTracking()

// INC-016-ENHANCE: State for submit exam confirmation dialog
const showSubmitExamDialog = ref(false)

/**
 * State Management
 * Formula: QuizState = CurrentQuestion × SelectedAnswer × AnswerValidation × NavigationIndex × AnswerTracking
 */
// 已選擇的答案 (A|B|C|D|null)
const selectedAnswer = ref(null)

// 答題狀態 ('unanswered' | 'correct' | 'incorrect')
const answerState = ref('unanswered')

// 是否顯示解析
const showExplanation = ref(false)

/**
 * Computed Properties
 */
// 題目編號顯示 (從 1 開始)
const questionNumber = computed(() => props.questionIndex + 1)

// INC-019: 隨機化選項順序（如果啟用）
// 同時重新映射 label 為 ABCD，並保存原始 key 的映射
// 使用 sessionSeed 確保每次重新練習時選項順序不同
const shuffledOptions = computed(() => {
  if (!props.shouldShuffleOptions || !props.questionData?.options) {
    return props.questionData?.options || {}
  }

  // 使用 question_id + sessionSeed 作為組合種子（確保每次重新練習時不同）
  const combinedSeed = props.questionData.question_id + '_' + props.sessionSeed
  let hash = 0
  for (let i = 0; i < combinedSeed.length; i++) {
    hash = ((hash << 5) - hash) + combinedSeed.charCodeAt(i)
    hash = hash & hash
  }

  // 簡單的線性同餘生成器 (LCG)
  let randomSeed = Math.abs(hash)
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  // 將物件轉為陣列
  const optionsArray = Object.entries(props.questionData.options)

  // Fisher-Yates shuffle with seeded random
  const shuffled = [...optionsArray]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 重新映射為 ABCD
  const newLabels = ['A', 'B', 'C', 'D']
  const remapped = {}
  shuffled.forEach((item, index) => {
    remapped[newLabels[index]] = item[1]  // item[1] 是選項文字
  })

  return remapped
})

// INC-019: 原始 key 的映射表（用於答案驗證）
// 必須使用相同的 sessionSeed 確保映射一致
const keyMapping = computed(() => {
  if (!props.shouldShuffleOptions || !props.questionData?.options) {
    // 不隨機時，映射是 A->A, B->B, C->C, D->D
    return { A: 'A', B: 'B', C: 'C', D: 'D' }
  }

  // 使用相同的 question_id + sessionSeed 組合種子
  const combinedSeed = props.questionData.question_id + '_' + props.sessionSeed
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

  const optionsArray = Object.entries(props.questionData.options)
  const shuffled = [...optionsArray]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 創建映射：新key -> 原始key
  const newLabels = ['A', 'B', 'C', 'D']
  const mapping = {}
  shuffled.forEach((item, index) => {
    mapping[newLabels[index]] = item[0]  // item[0] 是原始的 key (A/B/C/D)
  })

  return mapping
})

// INC-019: 新的正確答案 key（用於顯示）
const shuffledCorrectAnswer = computed(() => {
  if (!props.shouldShuffleOptions || !props.questionData?.answer) {
    return props.questionData?.answer
  }

  // 找到原始正確答案對應的新 key
  for (const [newKey, originalKey] of Object.entries(keyMapping.value)) {
    if (originalKey === props.questionData.answer) {
      return newKey
    }
  }

  return props.questionData.answer
})

// 是否可以提交答案
const canSubmit = computed(() => {
  return selectedAnswer.value !== null && answerState.value === 'unanswered'
})

// 是否可以前往上一題
const canGoPrevious = computed(() => props.questionIndex > 0)

// 是否可以前往下一題
const canGoNext = computed(() => props.questionIndex < props.totalQuestions - 1)

// 提交按鈕文字
const submitButtonText = computed(() => {
  if (answerState.value === 'unanswered') {
    return '提交答案'
  }
  return '已提交'
})

// INC-016: 查看解析按鈕文字
const explanationButtonText = computed(() => {
  return showExplanation.value ? '收起解析' : '查看解析'
})

// INC-018: 難度中文顯示
const difficultyText = computed(() => {
  const difficultyMap = {
    'simple': '簡單',
    'Simple': '簡單',
    'medium': '中等',
    'Medium': '中等',
    'hard': '困難',
    'Hard': '困難'
  }
  return difficultyMap[props.questionData.difficulty] || props.questionData.difficulty
})

/**
 * Interaction Logic
 * Formula: InteractionFlow = SelectAnswer -> ValidateAnswer -> ShowFeedback -> (ShowExplanation & EnableNavigation)
 */

/**
 * 選擇答案
 * Formula: selectAnswer(option) -> (selectedAnswer = option) & (answerState = 'unanswered')
 * INC-016-ENHANCE: 考試模式選擇即記錄
 */
const selectAnswer = (option) => {
  if (answerState.value === 'unanswered') {
    selectedAnswer.value = option

    // INC-016-ENHANCE: Exam mode auto-save - emit to parent for state management
    if (props.mode === 'exam') {
      emit('update:selectedAnswer', {
        questionId: props.questionData.question_id,
        selectedAnswer: option
      })
    }
  }
}

/**
 * 提交答案並驗證
 * Formula: submitAnswer() -> validateAnswer(selectedAnswer, correctAnswer) -> (answerState = result) & recordHistory() & saveToStorage()
 * INC-016: 考試模式自動跳到下一題
 * INC-019: 使用 keyMapping 將隨機後的 key 映射回原始 key 進行驗證
 */
const submitAnswer = () => {
  if (!canSubmit.value) return

  // INC-019: 將選擇的答案映射回原始 key
  const originalKey = keyMapping.value[selectedAnswer.value]

  // 驗證答案（使用原始 key 與正確答案比對）
  const isCorrect = originalKey === props.questionData.answer
  answerState.value = isCorrect ? 'correct' : 'incorrect'

  // 準備答題數據
  const answerData = {
    questionId: props.questionData.question_id,
    userAnswer: selectedAnswer.value,  // 保存使用者看到的 key (新的 ABCD)
    correctAnswer: props.questionData.answer,  // 保存原始正確答案
    isCorrect,
    timestamp: new Date().toISOString(),
    topic: props.questionData.topic || '',
    difficulty: props.questionData.difficulty || ''
  }

  // 保存到 LocalStorage (透過 useAnswerTracking)
  saveAnswer(answerData)

  // 發送事件給父組件
  emit('answer-submitted', answerData)
}

/**
 * INC-016: 切換解析顯示狀態
 * Formula: toggleExplanation() -> (showExplanation = !showExplanation)
 */
const toggleExplanation = () => {
  showExplanation.value = !showExplanation.value
}

/**
 * 前往下一題
 * Formula: nextQuestion() -> (currentIndex = currentIndex + 1) & resetState()
 */
const nextQuestion = () => {
  if (canGoNext.value) {
    resetState()
    emit('next-question')
  }
}

/**
 * 前往上一題
 * Formula: previousQuestion() -> (currentIndex = currentIndex - 1) & loadState()
 */
const previousQuestion = () => {
  if (canGoPrevious.value) {
    resetState()
    emit('previous-question')
  }
}

/**
 * 重置狀態
 * Formula: resetState() -> (selectedAnswer = null) & (answerState = 'unanswered') & (showExplanation = false)
 */
const resetState = () => {
  selectedAnswer.value = null
  answerState.value = 'unanswered'
  showExplanation.value = false
}

/**
 * INC-016-ENHANCE: 處理提交考券按鈕點擊
 * Formula: handleSubmitExam() -> showDialog -> (confirm -> consoleLog | cancel -> close)
 */
const handleSubmitExam = () => {
  showSubmitExamDialog.value = true
}

/**
 * INC-016-ENHANCE: 確認提交考券
 * INC-017: 發送提交考券事件給父組件
 */
const confirmSubmitExam = () => {
  console.log('📋 提交考券 - INC-017')
  showSubmitExamDialog.value = false
  // 發送提交考券事件給父組件（QuizPage），由父組件處理跳轉到結果頁面
  emit('submit-exam')
}

/**
 * INC-016-ENHANCE: 取消提交考券
 */
const cancelSubmitExam = () => {
  showSubmitExamDialog.value = false
}

/**
 * INC-017: 練習模式驗收成果（直接跳轉，不需確認對話框）
 * Formula: viewResults() -> emit('submit-exam')
 */
const viewResults = () => {
  console.log('🎯 驗收成果 - 跳轉至結果頁面')
  emit('submit-exam')
}

/**
 * Custom Event Listeners
 * Formula: CustomEvents = {select-option, submit-answer} -> ComponentActions
 * Note: Keyboard shortcuts are handled by App.vue through useKeyboardShortcuts
 */
const handleSelectOption = (event) => {
  const { optionIndex } = event.detail
  const options = ['A', 'B', 'C', 'D']
  if (optionIndex >= 0 && optionIndex < options.length) {
    selectAnswer(options[optionIndex])
  }
}

const handleSubmitAnswer = () => {
  if (canSubmit.value) {
    submitAnswer()
  }
}

/**
 * Lifecycle Hooks
 */
onMounted(() => {
  // Listen to custom events dispatched by App.vue keyboard shortcuts
  window.addEventListener('select-option', handleSelectOption)
  window.addEventListener('submit-answer', handleSubmitAnswer)
})

onUnmounted(() => {
  window.removeEventListener('select-option', handleSelectOption)
  window.removeEventListener('submit-answer', handleSubmitAnswer)
})

/**
 * Watch for question changes
 * INC-016: 切換題目時恢復答題狀態
 */
watch(() => props.questionIndex, () => {
  // INC-016: 恢復答題狀態而不是重置
  if (props.initialState) {
    selectedAnswer.value = props.initialState.selectedAnswer
    answerState.value = props.initialState.answerState
  } else {
    resetState()
  }
  // INC-016: 確保解析狀態被重置
  showExplanation.value = false
})

/**
 * Watch for initialState changes (when switching questions)
 * INC-016: 當切換到已作答題目時恢復狀態
 * 注意：不重置 showExplanation，讓解析保持展開狀態直到切換題目
 */
watch(() => props.initialState, (newState) => {
  if (newState) {
    selectedAnswer.value = newState.selectedAnswer
    answerState.value = newState.answerState
  } else {
    resetState()
  }
}, { immediate: true })
</script>

<template>
  <div class="max-w-4xl mx-auto p-5 md:p-7 lg:p-8 bg-white rounded-lg shadow-lg">
    <!-- Header: 題目編號 & 進度 -->
    <div class="flex justify-between items-center mb-4 md:mb-5 text-xs md:text-sm text-gray-600">
      <div class="font-medium">
        題目 {{ questionNumber }} / {{ totalQuestions }}
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          {{ difficultyText }}
        </span>
        <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
          {{ questionData.topic }}
        </span>
      </div>
    </div>

    <!-- Question Text -->
    <div class="mb-5 md:mb-7 lg:mb-8">
      <h2 class="text-base md:text-xl font-semibold text-gray-900 leading-relaxed">
        {{ questionData.question }}
      </h2>
    </div>

    <!-- Options Grid -->
    <div class="space-y-4 md:space-y-5 mb-6">
      <OptionButton
        v-for="(option, key) in shuffledOptions"
        :key="key"
        :label="key"
        :option="option"
        :is-selected="selectedAnswer === key"
        :is-correct="key === shuffledCorrectAnswer"
        :answer-state="answerState"
        :mode="mode"
        @option-selected="selectAnswer"
      />
    </div>

    <!-- INC-016-ENHANCE: Button Controls - Mode-based Layout -->
    <div class="mb-6 md:mb-7">
      <!-- Practice Mode: 4-button layout with navigation -->
      <template v-if="mode === 'practice'">
        <!-- Desktop/Tablet: Horizontal layout -->
        <div class="hidden md:flex md:items-center md:gap-3">
          <!-- Navigation: Previous -->
          <button
            v-if="canGoPrevious"
            :disabled="!canGoPrevious"
            :class="[
              'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
              canGoPrevious
                ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            ]"
            aria-label="上一題"
            @click="previousQuestion"
          >
            <ChevronLeftIcon class="w-6 h-6" />
          </button>

          <!-- Action: Toggle Explanation -->
          <button
            class="flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 active:scale-95
                   bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800"
            @click="toggleExplanation"
          >
            {{ explanationButtonText }}
          </button>

          <!-- Action: Submit Answer or View Results -->
          <button
            v-if="answerState === 'unanswered'"
            :disabled="!canSubmit"
            :class="[
              'flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 active:scale-95',
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
            @click="submitAnswer"
          >
            {{ submitButtonText }}
          </button>
          <!-- INC-017: View Results button when all answered -->
          <button
            v-else-if="isAllAnswered"
            class="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 active:scale-95
                   bg-green-600 hover:bg-green-700 active:bg-green-800"
            @click="viewResults"
          >
            驗收成果
          </button>

          <!-- Navigation: Next -->
          <button
            v-if="canGoNext"
            :disabled="!canGoNext"
            :class="[
              'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
              canGoNext
                ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            ]"
            aria-label="下一題"
            @click="nextQuestion"
          >
            <ChevronRightIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Mobile: Vertical stack layout -->
        <div class="flex flex-col gap-3 md:hidden">
          <!-- Submit Answer (top, most important) -->
          <button
            v-if="answerState === 'unanswered'"
            :disabled="!canSubmit"
            :class="[
              'w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 active:scale-95',
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
            @click="submitAnswer"
          >
            {{ submitButtonText }}
          </button>
          <!-- INC-017: View Results button when all answered (Mobile) -->
          <button
            v-else-if="isAllAnswered"
            class="w-full py-4 px-8 rounded-lg font-bold text-white text-lg transition-all duration-200 active:scale-95
                   bg-green-600 hover:bg-green-700 hover:shadow-lg active:bg-green-800"
            @click="viewResults"
          >
            驗收成果
          </button>

          <!-- Toggle Explanation -->
          <button
            class="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 active:scale-95
                   bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800"
            @click="toggleExplanation"
          >
            {{ explanationButtonText }}
          </button>

          <!-- Navigation Row -->
          <div class="flex gap-3">
            <button
              v-if="canGoPrevious"
              :disabled="!canGoPrevious"
              :class="[
                'flex-1 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                canGoPrevious
                  ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
              aria-label="上一題"
              @click="previousQuestion"
            >
              <ChevronLeftIcon class="w-6 h-6" />
            </button>
            <button
              v-if="canGoNext"
              :disabled="!canGoNext"
              :class="[
                'flex-1 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                canGoNext
                  ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
              aria-label="下一題"
              @click="nextQuestion"
            >
              <ChevronRightIcon class="w-6 h-6" />
            </button>
          </div>
        </div>
      </template>

      <!-- Exam Mode: 3-button layout (nav + submit exam) -->
      <template v-else-if="mode === 'exam'">
        <!-- Desktop/Tablet: Horizontal layout -->
        <div class="hidden md:flex md:items-center md:gap-6">
          <!-- Navigation: Previous -->
          <button
            v-if="canGoPrevious"
            :disabled="!canGoPrevious"
            :class="[
              'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
              canGoPrevious
                ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            ]"
            aria-label="上一題"
            @click="previousQuestion"
          >
            <ChevronLeftIcon class="w-6 h-6" />
          </button>

          <!-- Action: Submit Exam -->
          <button
            class="flex-1 py-3 px-8 rounded-lg font-bold text-white transition-all duration-200 active:scale-95
                   bg-warning-600 hover:bg-warning-700 hover:shadow-lg active:bg-warning-800
                   flex items-center justify-center gap-2"
            @click="handleSubmitExam"
          >
            <ClipboardDocumentCheckIcon class="w-5 h-5" />
            提交考券
          </button>

          <!-- Navigation: Next -->
          <button
            v-if="canGoNext"
            :disabled="!canGoNext"
            :class="[
              'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
              canGoNext
                ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            ]"
            aria-label="下一題"
            @click="nextQuestion"
          >
            <ChevronRightIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Mobile: Vertical stack layout -->
        <div class="flex flex-col gap-3 md:hidden">
          <!-- Submit Exam (top, full width, warning color) -->
          <button
            class="w-full py-4 px-8 rounded-lg font-bold text-white text-lg transition-all duration-200 active:scale-95
                   bg-warning-600 hover:bg-warning-700 hover:shadow-lg active:bg-warning-800
                   flex items-center justify-center gap-2"
            @click="handleSubmitExam"
          >
            <ClipboardDocumentCheckIcon class="w-5 h-5" />
            提交考券
          </button>

          <!-- Navigation Row -->
          <div class="flex gap-3">
            <button
              v-if="canGoPrevious"
              :disabled="!canGoPrevious"
              :class="[
                'flex-1 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                canGoPrevious
                  ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
              aria-label="上一題"
              @click="previousQuestion"
            >
              <ChevronLeftIcon class="w-6 h-6" />
            </button>
            <button
              v-if="canGoNext"
              :disabled="!canGoNext"
              :class="[
                'flex-1 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                canGoNext
                  ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
              aria-label="下一題"
              @click="nextQuestion"
            >
              <ChevronRightIcon class="w-6 h-6" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Answer Feedback (練習模式 only) -->
    <AnswerFeedback
      v-if="mode === 'practice'"
      :answer-state="answerState"
      :correct-answer="shuffledCorrectAnswer"
      :user-answer="selectedAnswer"
    />

    <!-- Explanation (練習模式 only) -->
    <Explanation
      v-if="mode === 'practice'"
      :show="showExplanation"
      :explanation="questionData.explanation"
      :keywords="questionData.keywords"
      :references="questionData.reference"
    />

    <!-- INC-016-ENHANCE: Submit Exam Confirmation Dialog -->
    <div
      v-if="showSubmitExamDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="cancelSubmitExam"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          確定要提交考券嗎？
        </h3>
        <p class="text-gray-600 mb-6">
          提交後將前往結果頁面查看成績和錯題分析。
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200
                   bg-gray-200 hover:bg-gray-300 text-gray-800"
            @click="cancelSubmitExam"
          >
            再檢查一下
          </button>
          <button
            class="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
                   bg-warning-600 hover:bg-warning-700"
            @click="confirmSubmitExam"
          >
            確定提交
          </button>
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts Hint -->
    <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div class="text-xs text-blue-800">
        <span class="font-semibold">鍵盤快捷鍵:</span>
        <span class="ml-2">A/B/C/D - 選擇答案</span>
        <span
          v-if="mode === 'practice'"
          class="mx-2"
        >|</span>
        <span v-if="mode === 'practice'">Enter/Space - 提交</span>
        <span class="mx-2">|</span>
        <span>← → - 切換題目</span>
      </div>
    </div>
  </div>
</template>
