<script setup>
/**
 * MobileNavigation Component
 * Formula: MobileNavigation = BottomNavBar + TouchOptimized + NavigationActions
 * Responsibility: 手機端底部導航欄，提供觸控友好的操作按鈕
 */
import { computed } from 'vue'

const props = defineProps({
  wrongQuestionsCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['home', 'statistics', 'wrong-questions', 'reset'])

/**
 * Computed
 */
const hasWrongQuestions = computed(() => props.wrongQuestionsCount > 0)

/**
 * Actions
 */
const handleHome = () => emit('home')
const handleStatistics = () => emit('statistics')
const handleWrongQuestions = () => emit('wrong-questions')
const handleReset = () => emit('reset')
</script>

<template>
  <!-- Mobile Bottom Navigation - Only visible on mobile -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50">
    <div class="grid grid-cols-4 gap-3 p-4">
      <!-- Home -->
      <button
        class="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch"
        @click="handleHome"
      >
        <svg
          class="w-6 h-6 text-gray-600 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span class="text-xs text-gray-600 font-medium">主頁</span>
      </button>

      <!-- Statistics -->
      <button
        class="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch"
        @click="handleStatistics"
      >
        <svg
          class="w-6 h-6 text-secondary-600 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span class="text-xs text-secondary-600 font-medium">統計</span>
      </button>

      <!-- Wrong Questions -->
      <button
        class="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch relative"
        @click="handleWrongQuestions"
      >
        <svg
          class="w-6 h-6 text-warning-600 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span class="text-xs text-warning-600 font-medium">錯題</span>
        <!-- Badge -->
        <span
          v-if="hasWrongQuestions"
          class="absolute top-1 right-1 bg-warning-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold px-1"
        >
          {{ wrongQuestionsCount > 99 ? '99+' : wrongQuestionsCount }}
        </span>
      </button>

      <!-- Reset -->
      <button
        class="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-touch"
        @click="handleReset"
      >
        <svg
          class="w-6 h-6 text-accent-600 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span class="text-xs text-accent-600 font-medium">重置</span>
      </button>
    </div>

    <!-- Swipe Hint -->
    <div class="text-center pb-2 px-4">
      <p class="text-[10px] text-gray-400">
        左右滑動切換題目
      </p>
    </div>
  </nav>
</template>

<style scoped>
/* Ensure touch-friendly button sizes (minimum 44px) */
.min-h-touch {
  min-height: 44px;
}

/* Active state feedback */
button:active {
  transform: scale(0.95);
}

/* Smooth transitions */
button {
  transition: all 150ms ease;
}
</style>
