<script setup>
import { computed } from 'vue'

/**
 * QuizForge AI - Loading Spinner Component
 * Formula: LoadingSpinner = VisualFeedback × ResponsiveDesign × Accessibility
 */

const props = defineProps({
  // 大小選項
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'xl'].includes(value)
  },

  // 顏色主題
  color: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'error'].includes(value)
  },

  // 顯示文字
  text: {
    type: String,
    default: ''
  },

  // 是否全屏覆蓋
  fullscreen: {
    type: Boolean,
    default: false
  },

  // 背景透明度
  overlayOpacity: {
    type: String,
    default: 'rgba(255, 255, 255, 0.9)'
  },

  // 自定義樣式
  customClass: {
    type: String,
    default: ''
  }
})

/**
 * 大小映射
 */
const sizeClasses = {
  small: 'w-4 h-4',
  medium: 'w-8 h-8',
  large: 'w-12 h-12',
  xl: 'w-16 h-16'
}

/**
 * 顏色映射
 */
const colorClasses = {
  primary: 'border-blue-600',
  secondary: 'border-gray-600',
  success: 'border-green-600',
  warning: 'border-orange-600',
  error: 'border-red-600'
}

/**
 * 文字大小映射
 */
const textSizeClasses = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
  xl: 'text-xl'
}

/**
 * 計算屬性
 */
const spinnerSize = computed(() => sizeClasses[props.size])
const spinnerColor = computed(() => colorClasses[props.color])
const textSize = computed(() => textSizeClasses[props.size])
const containerClass = computed(() => {
  const baseClass = props.fullscreen
    ? 'fixed inset-0 flex items-center justify-center z-50'
    : 'flex items-center justify-center'

  return `${baseClass} ${props.customClass}`.trim()
})
</script>

<template>
  <div
    :class="containerClass"
    :style="fullscreen ? { backgroundColor: overlayOpacity } : {}"
    role="status"
    aria-label="載入中"
  >
    <div class="flex flex-col items-center space-y-3">
      <!-- 主要 spinner -->
      <div
        class="animate-spin rounded-full border-2 border-t-transparent"
        :class="[spinnerSize, spinnerColor]"
      ></div>

      <!-- 顯示文字 -->
      <p
        v-if="text"
        :class="[textSize, 'text-gray-600 font-medium animate-pulse']"
      >
        {{ text }}
      </p>

      <!-- 裝飾性小點 -->
      <div class="flex space-x-1">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 確保在低動畫設備上仍有視覺回饋 */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: spin 3s linear infinite;
  }

  .animate-pulse {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-bounce {
    animation: bounce 2s infinite;
  }
}

/* 全屏覆蓋的模糊效果 */
.fixed {
  backdrop-filter: blur(2px);
}
</style>