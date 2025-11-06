<script setup>
/**
 * OptionButton Component
 * Formula: OptionButton = ButtonBase × StateStyle × (ClickEvent | KeyboardEvent)
 * Responsibility: 單一選項按鈕，處理選擇與反饋視覺
 */
import { computed } from 'vue'

const props = defineProps({
  // 選項標籤 (A, B, C, D)
  label: {
    type: String,
    required: true,
    validator: (value) => ['A', 'B', 'C', 'D'].includes(value)
  },
  // 選項內容
  option: {
    type: String,
    required: true
  },
  // 是否被選中
  isSelected: {
    type: Boolean,
    default: false
  },
  // 是否為正確答案
  isCorrect: {
    type: Boolean,
    default: false
  },
  // 是否禁用
  isDisabled: {
    type: Boolean,
    default: false
  },
  // 答題狀態 ('unanswered' | 'correct' | 'incorrect')
  answerState: {
    type: String,
    default: 'unanswered',
    validator: (value) => ['unanswered', 'correct', 'incorrect'].includes(value)
  }
})

const emit = defineEmits(['option-selected'])

/**
 * 計算按鈕樣式類別
 * Formula: StateStyle = (answerState × isSelected × isCorrect) -> CSSClasses
 */
const buttonClasses = computed(() => {
  const baseClasses = 'w-full p-4 md:p-5 text-left rounded-lg border-2 transition-all duration-200 flex items-center gap-3 md:gap-4 min-h-touch active:scale-95'

  // 已答題狀態 - 顯示正確/錯誤
  if (props.answerState !== 'unanswered') {
    if (props.isCorrect) {
      // 正確答案 - 綠色
      return `${baseClasses} border-green-500 bg-green-100 text-green-900`
    } else if (props.isSelected && !props.isCorrect) {
      // 錯誤選擇 - 紅色
      return `${baseClasses} border-red-500 bg-red-100 text-red-900`
    } else {
      // 未選中的其他選項 - 灰色
      return `${baseClasses} border-gray-300 bg-gray-50 text-gray-600`
    }
  }

  // 未答題狀態
  if (props.isSelected) {
    // 已選中 - 藍色
    return `${baseClasses} border-blue-500 bg-blue-100 text-blue-900 cursor-pointer`
  }

  // 預設狀態 - 可懸停
  return `${baseClasses} border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer`
})

/**
 * 標籤樣式
 * Formula: LabelStyle = (isSelected × isCorrect) -> LabelClasses
 */
const labelClasses = computed(() => {
  const baseClasses = 'flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-xs md:text-sm'

  if (props.answerState !== 'unanswered') {
    if (props.isCorrect) {
      return `${baseClasses} bg-green-500 text-white`
    } else if (props.isSelected) {
      return `${baseClasses} bg-red-500 text-white`
    }
    return `${baseClasses} bg-gray-300 text-gray-600`
  }

  if (props.isSelected) {
    return `${baseClasses} bg-blue-500 text-white`
  }

  return `${baseClasses} bg-gray-200 text-gray-700`
})

/**
 * 處理選項點擊
 * Formula: handleClick() -> emit('option-selected', label)
 */
const handleClick = () => {
  if (!props.isDisabled && props.answerState === 'unanswered') {
    emit('option-selected', props.label)
  }
}
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="isDisabled || answerState !== 'unanswered'"
    @click="handleClick"
    :aria-label="`選項 ${label}: ${option}`"
  >
    <!-- 選項標籤 (A/B/C/D) -->
    <div :class="labelClasses">
      {{ label }}
    </div>

    <!-- 選項內容 -->
    <div class="flex-1 text-sm md:text-base leading-relaxed">
      {{ option }}
    </div>

    <!-- 正確答案標記 -->
    <div v-if="answerState !== 'unanswered' && isCorrect" class="flex-shrink-0 text-green-600">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <!-- 錯誤選擇標記 -->
    <div v-if="answerState !== 'unanswered' && isSelected && !isCorrect" class="flex-shrink-0 text-red-600">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  </button>
</template>
