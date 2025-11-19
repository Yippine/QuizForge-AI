<script setup>
/**
 * OptionSelector Component
 * Formula: OptionSelector = Options + Navigation + CustomInput + Validation
 * Responsibility: 題數/時間選擇器，支援箭頭切換和自訂輸入
 * INC-018: Exam settings interface with option selector
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  /**
   * 選項列表，包含標籤和值
   * 例如：[{ label: '10題', value: 10 }, { label: '自訂', value: 'custom' }]
   */
  options: {
    type: Array,
    required: true,
    validator: (val) => val.length > 0
  },
  /**
   * 預設選中的選項索引
   */
  defaultIndex: {
    type: Number,
    default: 0
  },
  /**
   * 自訂輸入的範圍限制
   */
  customRange: {
    type: Object,
    default: () => ({ min: 1, max: 200 })
  },
  /**
   * 自訂輸入的單位（例如：題、分鐘）
   */
  unit: {
    type: String,
    default: '題'
  },
  /**
   * 標籤文字
   */
  label: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:value'])

/**
 * State
 */
const currentIndex = ref(props.defaultIndex)
const customValue = ref('')
const customError = ref('')

/**
 * Computed
 */
const currentOption = computed(() => props.options[currentIndex.value])
const isCustomMode = computed(() => currentOption.value?.value === 'custom')
const canGoLeft = computed(() => currentIndex.value > 0)
const canGoRight = computed(() => currentIndex.value < props.options.length - 1)

/**
 * 獲取當前選擇的值
 */
const getCurrentValue = () => {
  if (isCustomMode.value) {
    const num = parseInt(customValue.value)
    if (!isNaN(num) && num >= props.customRange.min && num <= props.customRange.max) {
      return num
    }
    return null // 自訂模式但輸入無效
  }
  return currentOption.value.value
}

/**
 * Actions
 */
const goLeft = () => {
  if (canGoLeft.value) {
    currentIndex.value--
    emitValue()
  }
}

const goRight = () => {
  if (canGoRight.value) {
    currentIndex.value++
    emitValue()
  }
}

const validateCustomInput = () => {
  const num = parseInt(customValue.value)

  if (customValue.value === '') {
    customError.value = '請輸入數值'
    return false
  }

  if (isNaN(num)) {
    customError.value = '請輸入有效數字'
    return false
  }

  if (num < props.customRange.min || num > props.customRange.max) {
    customError.value = `請輸入 ${props.customRange.min}-${props.customRange.max} 之間的數值`
    return false
  }

  customError.value = ''
  return true
}

const emitValue = () => {
  const value = getCurrentValue()
  emit('update:value', value)
}

/**
 * Keyboard Support
 */
const handleKeydown = (e) => {
  if (isCustomMode.value) return // 自訂模式時不處理箭頭鍵

  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goLeft()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goRight()
  }
}

/**
 * Watchers
 */
watch(customValue, () => {
  if (isCustomMode.value) {
    validateCustomInput()
    emitValue()
  }
})

watch(isCustomMode, (newVal) => {
  if (!newVal) {
    customValue.value = ''
    customError.value = ''
  }
})

// 初始化發送值
emitValue()
</script>

<template>
  <div
    class="option-selector"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <!-- Label -->
    <label class="block text-sm md:text-base font-semibold text-gray-700 mb-3">
      {{ label }}
    </label>

    <!-- Selector Container -->
    <div class="flex items-center gap-3 md:gap-4">
      <!-- Left Arrow -->
      <button
        :disabled="!canGoLeft"
        :class="[
          'flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all',
          canGoLeft
            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        ]"
        aria-label="上一個選項"
        @click="goLeft"
      >
        <svg
          class="w-5 h-5 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <!-- Current Option Display -->
      <div class="flex-1 min-w-0">
        <div
          v-if="!isCustomMode"
          class="bg-white border-2 border-primary-500 rounded-lg px-4 md:px-6 py-3 md:py-4 text-center"
        >
          <div class="text-lg md:text-xl font-bold text-primary-600">
            {{ currentOption.label }}
          </div>
        </div>

        <!-- Custom Input -->
        <div
          v-else
          class="space-y-2"
        >
          <div class="relative">
            <input
              v-model="customValue"
              type="number"
              :min="customRange.min"
              :max="customRange.max"
              :placeholder="`${customRange.min}-${customRange.max}`"
              class="w-full bg-white border-2 rounded-lg px-4 md:px-6 py-3 md:py-4 text-center text-lg md:text-xl font-bold transition-colors"
              :class="customError ? 'border-red-500 text-red-600' : 'border-primary-500 text-primary-600'"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm md:text-base text-gray-500">
              {{ unit }}
            </span>
          </div>
          <div
            v-if="customError"
            class="text-xs md:text-sm text-red-600 text-center"
          >
            {{ customError }}
          </div>
        </div>
      </div>

      <!-- Right Arrow -->
      <button
        :disabled="!canGoRight"
        :class="[
          'flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all',
          canGoRight
            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        ]"
        aria-label="下一個選項"
        @click="goRight"
      >
        <svg
          class="w-5 h-5 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>

    <!-- Helper Text -->
    <div class="mt-2 text-xs md:text-sm text-gray-500 text-center">
      使用 ← → 鍵切換選項
    </div>
  </div>
</template>

<style scoped>
/* Remove number input arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Focus styles */
.option-selector:focus {
  outline: none;
}

.option-selector:focus-within {
  outline: 2px solid rgba(59, 130, 246, 0.5);
  outline-offset: 4px;
  border-radius: 8px;
}
</style>
