<script setup>
/**
 * Explanation Component
 * Formula: Explanation = ExplanationText + Keywords + References
 * Responsibility: 詳細解析顯示，包含說明、關鍵字、參考資料
 */
import { computed } from 'vue'

const props = defineProps({
  // 解析說明
  explanation: {
    type: String,
    required: true
  },
  // 關鍵字陣列
  keywords: {
    type: Array,
    default: () => []
  },
  // 參考資料 (可選)
  references: {
    type: [String, Array],
    default: null
  },
  // 是否顯示解析
  show: {
    type: Boolean,
    default: false
  }
})

/**
 * 格式化參考資料
 * Formula: formatReferences(references) -> Array<String>
 */
const formattedReferences = computed(() => {
  if (!props.references) return []

  if (Array.isArray(props.references)) {
    return props.references
  }

  // 如果是字串，嘗試以換行符分割
  if (typeof props.references === 'string') {
    return props.references.split('\n').filter(ref => ref.trim().length > 0)
  }

  // 其他類型（如數字、物件等），回傳空陣列
  return []
})

/**
 * 檢查是否有關鍵字
 */
const hasKeywords = computed(() => {
  return props.keywords && props.keywords.length > 0
})

/**
 * 檢查是否有參考資料
 */
const hasReferences = computed(() => {
  return formattedReferences.value.length > 0
})
</script>

<template>
  <div v-if="show" class="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
    <!-- 解析標題 -->
    <div class="flex items-center gap-2 mb-4">
      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-semibold text-gray-900">詳細解析</h3>
    </div>

    <!-- 解析內容 -->
    <div class="mb-4">
      <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ explanation }}</p>
    </div>

    <!-- 關鍵字區塊 -->
    <div v-if="hasKeywords" class="mb-4">
      <h4 class="text-sm font-semibold text-gray-700 mb-2">關鍵字</h4>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(keyword, index) in keywords"
          :key="index"
          class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
        >
          {{ keyword }}
        </span>
      </div>
    </div>

    <!-- 參考資料區塊 -->
    <div v-if="hasReferences" class="border-t border-gray-200 pt-4">
      <h4 class="text-sm font-semibold text-gray-700 mb-2">參考資料</h4>
      <ul class="space-y-1">
        <li
          v-for="(reference, index) in formattedReferences"
          :key="index"
          class="text-sm text-gray-600 flex items-start gap-2"
        >
          <span class="text-blue-600 mt-1">•</span>
          <span>{{ reference }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
