<script setup>
/**
 * ExamSettings Page
 * Formula: ExamSettings = QuestionCountSelector + TimeLimitSelector + ModeButtons
 * Responsibility: 模擬考試設定頁面，用於設定題數和時間限制
 * INC-018: Exam settings interface
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import OptionSelector from '../components/OptionSelector.vue'

const router = useRouter()

/**
 * State
 */
const questionCount = ref(20) // 預設 20 題
const timeLimit = ref(null) // 預設不限時
const isQuestionCountValid = ref(true)
const isTimeLimitValid = ref(true)

/**
 * Options
 */
const questionOptions = [
  { label: '10題', value: 10 },
  { label: '20題', value: 20 },
  { label: '30題', value: 30 },
  { label: '50題', value: 50 },
  { label: '自訂', value: 'custom' }
]

const timeOptions = [
  { label: '10分鐘', value: 10 },
  { label: '20分鐘', value: 20 },
  { label: '30分鐘', value: 30 },
  { label: '不限時', value: null },
  { label: '自訂', value: 'custom' }
]

/**
 * Computed
 */
const canStartQuiz = computed(() => {
  return isQuestionCountValid.value && isTimeLimitValid.value && questionCount.value !== null
})

/**
 * Actions
 */
const handleQuestionCountUpdate = (value) => {
  questionCount.value = value
  isQuestionCountValid.value = value !== null
}

const handleTimeLimitUpdate = (value) => {
  timeLimit.value = value
  isTimeLimitValid.value = value !== 'custom' || value !== null
}

const startPractice = () => {
  if (!canStartQuiz.value) return

  router.push({
    path: '/quiz',
    query: {
      mode: 'practice',
      questionCount: questionCount.value,
      timeLimit: timeLimit.value || undefined
    }
  })
}

const startExam = () => {
  if (!canStartQuiz.value) return

  router.push({
    path: '/quiz',
    query: {
      mode: 'exam',
      questionCount: questionCount.value,
      timeLimit: timeLimit.value || undefined
    }
  })
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 md:py-12 px-4">
    <!-- Header -->
    <header class="max-w-3xl mx-auto mb-8">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm md:text-base"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回主頁
      </button>

      <!-- Title -->
      <div class="text-center mb-6">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          模擬考試設定
        </h1>
        <p class="text-sm md:text-base text-gray-600">選擇題數和時間限制，開始你的練習或考試</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8">
        <!-- Question Count Selector -->
        <OptionSelector
          :options="questionOptions"
          :default-index="1"
          :custom-range="{ min: 1, max: 354 }"
          unit="題"
          label="選擇題數"
          @update:value="handleQuestionCountUpdate"
        />

        <!-- Divider -->
        <div class="border-t border-gray-200"></div>

        <!-- Time Limit Selector -->
        <OptionSelector
          :options="timeOptions"
          :default-index="3"
          :custom-range="{ min: 1, max: 180 }"
          unit="分鐘"
          label="選擇時間限制"
          @update:value="handleTimeLimitUpdate"
        />

        <!-- Divider -->
        <div class="border-t border-gray-200"></div>

        <!-- Settings Summary -->
        <div class="bg-primary-50 rounded-lg p-4 md:p-6">
          <h3 class="text-base md:text-lg font-semibold text-gray-900 mb-3">設定摘要</h3>
          <div class="space-y-2 text-sm md:text-base text-gray-700">
            <div class="flex items-center justify-between">
              <span>題目數量：</span>
              <span class="font-semibold text-primary-600">
                {{ questionCount !== null ? `${questionCount} 題` : '未設定' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>時間限制：</span>
              <span class="font-semibold text-primary-600">
                {{ timeLimit !== null ? `${timeLimit} 分鐘` : '不限時' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Start Practice Button -->
          <button
            @click="startPractice"
            :disabled="!canStartQuiz"
            :class="[
              'py-3 rounded-lg font-semibold text-base md:text-lg transition-all shadow-md',
              canStartQuiz
                ? 'bg-accent-600 hover:bg-accent-700 text-white hover:shadow-lg transform hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            <div class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>開始練習</span>
            </div>
            <span class="block text-xs md:text-sm mt-1 opacity-90">可查看答案和解析</span>
          </button>

          <!-- Start Exam Button -->
          <button
            @click="startExam"
            :disabled="!canStartQuiz"
            :class="[
              'py-3 rounded-lg font-semibold text-base md:text-lg transition-all shadow-md',
              canStartQuiz
                ? 'bg-secondary-600 hover:bg-secondary-700 text-white hover:shadow-lg transform hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            <div class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>開始考試</span>
            </div>
            <span class="block text-xs md:text-sm mt-1 opacity-90">完成後統一批改</span>
          </button>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div class="text-sm text-blue-800">
              <p class="font-semibold mb-1">模式說明</p>
              <ul class="space-y-1 list-disc list-inside">
                <li><strong>練習模式：</strong>每題作答後立即顯示答案和解析，適合學習</li>
                <li><strong>考試模式：</strong>完成所有題目後才能查看結果，模擬真實考試</li>
                <li><strong>時間限制：</strong>選擇時間限制後，答題頁面會顯示倒數計時器</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-3xl mx-auto mt-8 text-center text-xs md:text-sm text-gray-500">
      <p>Formula-Contract Methodology | Generated with Claude Code</p>
      <p class="mt-1">INC-018: Exam Settings Interface</p>
    </footer>
  </div>
</template>

<style scoped>
/* Smooth animations */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
