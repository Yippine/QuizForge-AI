<script setup>
/**
 * AnswerFeedback Component
 * Formula: AnswerFeedback = (answerState) -> (CorrectFeedback | IncorrectFeedback)
 * Responsibility: 答案反饋顯示，正確/錯誤提示
 */
import { computed } from 'vue'

const props = defineProps({
  // 答題狀態 ('unanswered' | 'correct' | 'incorrect')
  answerState: {
    type: String,
    required: true,
    validator: (value) => ['unanswered', 'correct', 'incorrect'].includes(value)
  },
  // 正確答案
  correctAnswer: {
    type: String,
    required: true
  },
  // 用戶答案
  userAnswer: {
    type: String,
    default: null
  }
})

/**
 * 計算反饋容器樣式
 * Formula: ContainerStyle = (answerState === 'correct') -> GreenStyle | RedStyle
 */
const containerClasses = computed(() => {
  const baseClasses = 'p-4 rounded-lg mb-4 flex items-start gap-3'

  if (props.answerState === 'correct') {
    return `${baseClasses} bg-green-100 border-2 border-green-500`
  }

  return `${baseClasses} bg-red-100 border-2 border-red-500`
})

/**
 * 計算圖標樣式
 */
const iconClasses = computed(() => {
  return props.answerState === 'correct' ? 'text-green-600' : 'text-red-600'
})

/**
 * 計算文字樣式
 */
const textClasses = computed(() => {
  return props.answerState === 'correct' ? 'text-green-800' : 'text-red-800'
})

/**
 * 反饋標題
 */
const feedbackTitle = computed(() => {
  return props.answerState === 'correct' ? '回答正確！' : '回答錯誤'
})

/**
 * 反饋訊息
 */
const feedbackMessage = computed(() => {
  if (props.answerState === 'correct') {
    return '恭喜您答對了！繼續保持。'
  }

  return `您選擇了選項 ${props.userAnswer}，正確答案是選項 ${props.correctAnswer}。`
})
</script>

<template>
  <div
    v-if="answerState !== 'unanswered'"
    :class="containerClasses"
  >
    <!-- 圖標 -->
    <div
      class="flex-shrink-0"
      :class="iconClasses"
    >
      <!-- 正確圖標 -->
      <svg
        v-if="answerState === 'correct'"
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      <!-- 錯誤圖標 -->
      <svg
        v-else
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>

    <!-- 反饋文字 -->
    <div
      class="flex-1"
      :class="textClasses"
    >
      <div class="font-semibold text-lg mb-1">
        {{ feedbackTitle }}
      </div>
      <div class="text-sm">
        {{ feedbackMessage }}
      </div>
    </div>
  </div>
</template>
