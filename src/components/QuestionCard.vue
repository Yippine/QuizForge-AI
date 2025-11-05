<script setup>
/**
 * QuestionCard Component
 * Formula: QuestionCard = QuestionDisplay + OptionsGrid + (AnswerFeedback | Explanation) + NavigationControls + AnswerTracking
 * Responsibility: 題目卡片容器，組合所有子組件，管理答題狀態，整合答題記錄
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  }
})

const emit = defineEmits(['answer-submitted', 'next-question', 'previous-question'])

// Use answer tracking composable
const { saveAnswer } = useAnswerTracking()

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

/**
 * Interaction Logic
 * Formula: InteractionFlow = SelectAnswer -> ValidateAnswer -> ShowFeedback -> (ShowExplanation & EnableNavigation)
 */

/**
 * 選擇答案
 * Formula: selectAnswer(option) -> (selectedAnswer = option) & (answerState = 'unanswered')
 */
const selectAnswer = (option) => {
  if (answerState.value === 'unanswered') {
    selectedAnswer.value = option
  }
}

/**
 * 提交答案並驗證
 * Formula: submitAnswer() -> validateAnswer(selectedAnswer, correctAnswer) -> (answerState = result) & recordHistory() & saveToStorage()
 */
const submitAnswer = () => {
  if (!canSubmit.value) return

  // 驗證答案
  const isCorrect = selectedAnswer.value === props.questionData.answer
  answerState.value = isCorrect ? 'correct' : 'incorrect'

  // 自動顯示解析
  showExplanation.value = true

  // 準備答題數據
  const answerData = {
    questionId: props.questionData.question_id,
    userAnswer: selectedAnswer.value,
    correctAnswer: props.questionData.answer,
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
 * Keyboard Shortcuts
 * Formula: KeyboardEvents = {a|b|c|d -> selectAnswer, enter|space -> submitAnswer, left|right -> navigate}
 */
const handleKeyPress = (event) => {
  // 忽略修飾鍵組合
  if (event.ctrlKey || event.altKey || event.metaKey) return

  // 忽略在 input/textarea 內的按鍵
  const tagName = event.target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea') return

  const key = event.key.toLowerCase()

  // A/B/C/D 鍵 - 選擇答案
  if (['a', 'b', 'c', 'd'].includes(key)) {
    event.preventDefault()
    selectAnswer(key.toUpperCase())
  }

  // Enter / Space 鍵 - 提交答案
  if ((key === 'enter' || key === ' ') && canSubmit.value) {
    event.preventDefault()
    submitAnswer()
  }

  // 左方向鍵 - 上一題
  if (key === 'arrowleft' && canGoPrevious.value) {
    event.preventDefault()
    previousQuestion()
  }

  // 右方向鍵 - 下一題
  if (key === 'arrowright' && canGoNext.value) {
    event.preventDefault()
    nextQuestion()
  }
}

/**
 * Lifecycle Hooks
 */
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})

/**
 * Watch for question changes
 */
watch(() => props.questionIndex, () => {
  resetState()
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
    <!-- Header: 題目編號 & 進度 -->
    <div class="flex justify-between items-center mb-4 text-sm text-gray-600">
      <div class="font-medium">
        題目 {{ questionNumber }} / {{ totalQuestions }}
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
          {{ questionData.difficulty }}
        </span>
        <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
          {{ questionData.topic }}
        </span>
      </div>
    </div>

    <!-- Question Text -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 leading-relaxed">
        {{ questionData.question }}
      </h2>
    </div>

    <!-- Options Grid -->
    <div class="space-y-3 mb-6">
      <OptionButton
        v-for="(option, key) in questionData.options"
        :key="key"
        :label="key"
        :option="option"
        :is-selected="selectedAnswer === key"
        :is-correct="key === questionData.answer"
        :answer-state="answerState"
        @option-selected="selectAnswer"
      />
    </div>

    <!-- Submit Button -->
    <div v-if="answerState === 'unanswered'" class="mb-6">
      <button
        :disabled="!canSubmit"
        :class="[
          'w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200',
          canSubmit
            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            : 'bg-gray-300 cursor-not-allowed'
        ]"
        @click="submitAnswer"
      >
        {{ submitButtonText }}
        <span v-if="canSubmit" class="text-sm ml-2">(Enter / Space)</span>
      </button>
    </div>

    <!-- Answer Feedback -->
    <AnswerFeedback
      :answer-state="answerState"
      :correct-answer="questionData.answer"
      :user-answer="selectedAnswer"
    />

    <!-- Explanation -->
    <Explanation
      :show="showExplanation"
      :explanation="questionData.explanation"
      :keywords="questionData.keywords"
      :references="questionData.reference"
    />

    <!-- Navigation Controls -->
    <div v-if="answerState !== 'unanswered'" class="flex gap-3 mt-6">
      <!-- Previous Button -->
      <button
        v-if="canGoPrevious"
        :disabled="!canGoPrevious"
        :class="[
          'flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200',
          canGoPrevious
            ? 'bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        ]"
        @click="previousQuestion"
      >
        <span class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          上一題 (←)
        </span>
      </button>

      <!-- Next Button -->
      <button
        :disabled="!canGoNext"
        :class="[
          'flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200',
          canGoNext
            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        ]"
        @click="nextQuestion"
      >
        <span class="flex items-center justify-center gap-2">
          下一題 (→)
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>

    <!-- Keyboard Shortcuts Hint -->
    <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div class="text-xs text-blue-800">
        <span class="font-semibold">鍵盤快捷鍵:</span>
        <span class="ml-2">A/B/C/D - 選擇答案</span>
        <span class="mx-2">|</span>
        <span>Enter/Space - 提交</span>
        <span class="mx-2">|</span>
        <span>← → - 切換題目</span>
      </div>
    </div>
  </div>
</template>
