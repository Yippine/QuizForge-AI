<script setup>
/**
 * WrongQuestionsPanel Component
 * Formula: WrongQuestionsPanel = StatisticsDisplay + WrongQuestionsList + ActionButtons
 *
 * Responsibility: 顯示錯題本面板，包含統計數據、錯題列表和操作按鈕
 */
import { computed } from 'vue'
import { useAnswerTracking } from '../composables/useAnswerTracking'

const props = defineProps({
  // 面板模式 ('view' | 'compact')
  mode: {
    type: String,
    default: 'view'
  }
})

const emit = defineEmits(['start-wrong-practice', 'close-panel'])

// Use answer tracking composable
const {
  getWrongQuestions,
  getAllWrongQuestions,
  clearWrongQuestions,
  removeFromWrongQuestions,
  statistics
} = useAnswerTracking()

// Get wrong questions
const wrongQuestions = computed(() => getWrongQuestions())
const allWrongQuestions = computed(() => getAllWrongQuestions())

// Computed properties
const hasWrongQuestions = computed(() => wrongQuestions.value.length > 0)
const wrongQuestionsCount = computed(() => wrongQuestions.value.length)

// Statistics with wrong questions
const extendedStats = computed(() => {
  return {
    ...statistics.value,
    wrongQuestionsCount: wrongQuestionsCount.value
  }
})

// 難度中文顯示映射
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    'simple': '簡單',
    'Simple': '簡單',
    'medium': '中等',
    'Medium': '中等',
    'hard': '困難',
    'Hard': '困難'
  }
  return difficultyMap[difficulty] || difficulty
}

/**
 * Start wrong questions practice mode
 * Formula: startWrongPractice() -> emit('start-wrong-practice', wrongQuestionIds)
 */
const startWrongPractice = () => {
  if (!hasWrongQuestions.value) {
    alert('目前沒有錯題可以練習')
    return
  }

  const wrongQuestionIds = wrongQuestions.value.map(q => q.questionId)
  emit('start-wrong-practice', wrongQuestionIds)
}

/**
 * Clear all wrong questions with confirmation
 * Formula: handleClearWrongQuestions() -> confirm() -> clearWrongQuestions()
 */
const handleClearWrongQuestions = () => {
  if (!hasWrongQuestions.value) {
    alert('目前沒有錯題記錄')
    return
  }

  const confirmed = confirm(`確定要清空所有 ${wrongQuestionsCount.value} 道錯題記錄嗎？此操作無法撤銷。`)
  if (confirmed) {
    clearWrongQuestions()
    console.log('Wrong questions cleared by user')
  }
}

/**
 * Remove specific wrong question
 * Formula: handleRemoveQuestion(questionId) -> removeFromWrongQuestions(questionId)
 */
const handleRemoveQuestion = (questionId) => {
  const confirmed = confirm(`確定要從錯題本中移除此題目嗎？`)
  if (confirmed) {
    removeFromWrongQuestions(questionId)
  }
}

/**
 * Close panel
 */
const closePanel = () => {
  emit('close-panel')
}

/**
 * Format timestamp to readable date
 */
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold mb-1">錯題本</h2>
          <p class="text-red-100 text-sm">針對性練習，強化弱項知識點</p>
        </div>
        <button
          v-if="mode === 'view'"
          @click="closePanel"
          class="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          aria-label="關閉面板"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Statistics Display -->
    <div class="p-6 border-b border-gray-200 bg-gray-50">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-white rounded-lg shadow-sm">
          <div class="text-3xl font-bold text-blue-600">{{ extendedStats.total }}</div>
          <div class="text-sm text-gray-600 mt-1">總答題數</div>
        </div>
        <div class="text-center p-4 bg-white rounded-lg shadow-sm">
          <div class="text-3xl font-bold text-green-600">{{ extendedStats.correct }}</div>
          <div class="text-sm text-gray-600 mt-1">答對題數</div>
        </div>
        <div class="text-center p-4 bg-white rounded-lg shadow-sm">
          <div class="text-3xl font-bold text-red-600">{{ extendedStats.wrongQuestionsCount }}</div>
          <div class="text-sm text-gray-600 mt-1">待改進題數</div>
        </div>
        <div class="text-center p-4 bg-white rounded-lg shadow-sm">
          <div class="text-3xl font-bold text-purple-600">{{ extendedStats.accuracy }}%</div>
          <div class="text-sm text-gray-600 mt-1">正確率</div>
        </div>
      </div>
    </div>

    <!-- Wrong Questions List -->
    <div class="p-6">
      <!-- Empty State -->
      <div v-if="!hasWrongQuestions" class="text-center py-12">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">太棒了！</h3>
        <p class="text-gray-600">目前沒有錯題記錄</p>
        <p class="text-sm text-gray-500 mt-2">繼續保持，加油！</p>
      </div>

      <!-- Questions List -->
      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            錯題列表 ({{ wrongQuestionsCount }} 題)
          </h3>
        </div>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="question in wrongQuestions"
            :key="question.questionId"
            class="p-4 border border-red-200 bg-red-50 rounded-lg hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start gap-3">
              <!-- Question Info -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-mono text-sm font-semibold text-red-600">
                    {{ question.questionId }}
                  </span>
                  <span
                    v-if="question.topic"
                    class="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    {{ question.topic }}
                  </span>
                  <span
                    v-if="question.difficulty"
                    class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    {{ getDifficultyText(question.difficulty) }}
                  </span>
                </div>

                <div class="text-sm text-gray-600 space-y-1">
                  <div>
                    <span class="font-semibold">錯誤次數:</span>
                    <span class="ml-2 text-red-600 font-bold">{{ question.wrongCount }} 次</span>
                  </div>
                  <div>
                    <span class="font-semibold">最近錯誤:</span>
                    <span class="ml-2">{{ formatDate(question.lastWrongTime) }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <button
                @click="handleRemoveQuestion(question.questionId)"
                class="text-gray-400 hover:text-red-600 transition-colors"
                title="從錯題本移除"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Attempts History (collapsed by default) -->
            <details v-if="question.attempts.length > 1" class="mt-3">
              <summary class="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                查看答題歷史 ({{ question.attempts.length }} 次)
              </summary>
              <div class="mt-2 pl-4 border-l-2 border-red-300 space-y-1">
                <div
                  v-for="(attempt, idx) in question.attempts"
                  :key="idx"
                  class="text-xs text-gray-600"
                >
                  <span :class="attempt.isCorrect ? 'text-green-600' : 'text-red-600'">
                    {{ attempt.isCorrect ? '✓' : '✗' }}
                  </span>
                  <span class="ml-2">{{ formatDate(attempt.timestamp) }}</span>
                  <span v-if="!attempt.isCorrect && attempt.userAnswer" class="ml-2 text-gray-500">
                    (答案: {{ attempt.userAnswer }})
                  </span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="p-6 bg-gray-50 border-t border-gray-200">
      <div class="flex gap-3">
        <!-- Start Wrong Practice -->
        <button
          :disabled="!hasWrongQuestions"
          :class="[
            'flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200',
            hasWrongQuestions
              ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
          @click="startWrongPractice"
        >
          <span class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            開始錯題重練
          </span>
        </button>

        <!-- Clear Wrong Questions -->
        <button
          :disabled="!hasWrongQuestions"
          :class="[
            'py-3 px-6 rounded-lg font-semibold transition-all duration-200',
            hasWrongQuestions
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-800 cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          ]"
          @click="handleClearWrongQuestions"
        >
          清空錯題
        </button>
      </div>

      <div class="mt-3 text-center text-xs text-gray-500">
        <p>提示: 錯題記錄保存在瀏覽器本地，清除瀏覽器數據會一併清除</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for questions list */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #fca5a5;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #f87171;
}

/* Details/Summary styling */
details summary {
  list-style: none;
}

details summary::-webkit-details-marker {
  display: none;
}

details[open] summary {
  margin-bottom: 0.5rem;
}
</style>
