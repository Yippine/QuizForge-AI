<script setup>
/**
 * QuizForge AI - Error Boundary Component
 * Formula: ErrorBoundary = ErrorCapture × UserFriendlyDisplay × RecoveryOptions
 */

import { ref, computed, onErrorCaptured } from 'vue'

const props = defineProps({
  // 自定義錯誤標題
  title: {
    type: String,
    default: '發生了一些問題'
  },

  // 自定義錯誤訊息
  message: {
    type: String,
    default: '應用程式遇到了意外錯誤，請稍後再試'
  },

  // 是否顯示詳細錯誤信息
  showDetails: {
    type: Boolean,
    default: false
  },

  // 是否顯示重試按鈕
  showRetry: {
    type: Boolean,
    default: true
  },

  // 是否顯示回報按鈕
  showReport: {
    type: Boolean,
    default: true
  },

  // 自定義重試回調
  onRetry: {
    type: Function,
    default: () => window.location.reload()
  },

  // 自定義回報回調
  onReport: {
    type: Function,
    default: (error) => {
      console.error('Error reported:', error)
      alert('錯誤已記錄，感謝您的回報')
    }
  }
})

/**
 * 狀態管理
 */
const hasError = ref(false)
const error = ref(null)
const errorInfo = ref(null)
const showDetailedError = ref(false)

/**
 * 錯誤捕獲
 */
onErrorCaptured((err, instance, info) => {
  console.error('ErrorBoundary caught an error:', err, info)

  error.value = err
  errorInfo.value = info
  hasError.value = true

  // 記錄錯誤到遠端服務（可選）
  logErrorToService(err, info)

  // 阻止錯誤繼續向上傳播
  return false
})

/**
 * 計算屬性
 */
const errorMessage = computed(() => {
  if (!error.value) return props.message

  // 根據錯誤類型提供更具體的訊息
  if (error.value.name === 'ChunkLoadError') {
    return '載入資源時發生錯誤，請檢查網路連線並重新整理頁面'
  }

  if (error.value.name === 'NetworkError') {
    return '網路連線錯誤，請檢查您的網路狀態'
  }

  if (error.value.message?.includes('Unexpected token')) {
    return '資料解析錯誤，可能是資料格式不正確'
  }

  return error.value.message || props.message
})

const errorCode = computed(() => {
  if (!error.value) return 'UNKNOWN'

  // 根據錯誤類型分類
  if (error.value.name === 'ChunkLoadError') return 'CHUNK_LOAD_ERROR'
  if (error.value.name === 'NetworkError') return 'NETWORK_ERROR'
  if (error.value.message?.includes('404')) return 'NOT_FOUND'
  if (error.value.message?.includes('500')) return 'SERVER_ERROR'
  if (error.value.message?.includes('403')) return 'PERMISSION_DENIED'

  return 'APPLICATION_ERROR'
})

/**
 * 方法
 */
const retry = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = null

  // 調用自定義重試回調
  if (props.onRetry) {
    props.onRetry()
  }
}

const reportError = () => {
  if (!error.value) return

  const errorReport = {
    message: error.value.message,
    stack: error.value.stack,
    info: errorInfo.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    code: errorCode.value
  }

  // 調用自定義回報回調
  if (props.onReport) {
    props.onReport(errorReport)
  }
}

const toggleDetails = () => {
  showDetailedError.value = !showDetailedError.value
}

const copyErrorDetails = async () => {
  if (!error.value) return

  const details = `
錯誤代碼: ${errorCode.value}
錯誤訊息: ${error.value.message}
錯誤堆疊: ${error.value.stack}
Vue 組件信息: ${errorInfo.value}
用戶代理: ${navigator.userAgent}
頁面 URL: ${window.location.href}
時間戳記: ${new Date().toISOString()}
  `.trim()

  try {
    await navigator.clipboard.writeText(details)
    alert('錯誤詳情已複製到剪貼簿')
  } catch (err) {
    console.error('Failed to copy error details:', err)
    alert('複製失敗，請手動選擇文字複製')
  }
}

const logErrorToService = (_err, _info) => {
  // 這裡可以添加遠端錯誤記錄服務
  // 例如：Sentry, LogRocket, 或自定義 API
  try {
    // console.log('Logging error to service:', { err, info })
  } catch (serviceError) {
    console.warn('Failed to log error to service:', serviceError)
  }
}

/**
 * 重置錯誤狀態（供外部調用）
 */
const reset = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = null
  showDetailedError.value = false
}

// 暴露方法給父組件
defineExpose({
  reset,
  hasError,
  error
})
</script>

<template>
  <div
    v-if="hasError"
    class="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-8 px-4"
  >
    <div class="max-w-4xl mx-auto">
      <!-- Error Card -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Error Header -->
        <div class="bg-red-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <!-- Error Icon -->
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h1 class="text-xl font-bold text-white">
                  {{ title }}
                </h1>
                <p class="text-red-100 text-sm">
                  錯誤代碼: {{ errorCode }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Content -->
        <div class="p-6">
          <!-- Error Message -->
          <div class="mb-6">
            <p class="text-gray-700 text-lg leading-relaxed">
              {{ errorMessage }}
            </p>
          </div>

          <!-- Error Actions -->
          <div class="flex flex-wrap gap-3 mb-6">
            <!-- Retry Button -->
            <button
              v-if="showRetry"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              @click="retry"
            >
              <svg
                class="w-4 h-4"
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
              重試
            </button>

            <!-- Report Button -->
            <button
              v-if="showReport"
              class="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              @click="reportError"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326"
                />
              </svg>
              回報錯誤
            </button>

            <!-- Go Home Button -->
            <button
              class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              @click="$router.push('/')"
            >
              <svg
                class="w-4 h-4"
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
              返回首頁
            </button>
          </div>

          <!-- Error Details Toggle -->
          <div
            v-if="showDetails"
            class="border-t pt-6"
          >
            <button
              class="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium mb-4 transition-colors"
              @click="toggleDetails"
            >
              <svg
                class="w-4 h-4 transform transition-transform"
                :class="{ 'rotate-90': showDetailedError }"
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
              {{ showDetailedError ? '隱藏' : '顯示' }}錯誤詳情
            </button>

            <!-- Error Details -->
            <div
              v-if="showDetailedError"
              class="space-y-4"
            >
              <!-- Basic Info -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900 mb-2">
                  基本資訊
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><span class="font-medium">錯誤代碼:</span> {{ errorCode }}</div>
                  <div><span class="font-medium">發生時間:</span> {{ new Date().toLocaleString('zh-TW') }}</div>
                  <div><span class="font-medium">頁面 URL:</span> {{ window.location.href }}</div>
                  <div><span class="font-medium">用戶代理:</span> {{ navigator.userAgent }}</div>
                </div>
              </div>

              <!-- Error Stack -->
              <div
                v-if="error?.stack"
                class="bg-gray-50 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-900">
                    錯誤堆疊
                  </h3>
                  <button
                    class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    @click="copyErrorDetails"
                  >
                    複製詳情
                  </button>
                </div>
                <pre class="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto bg-white p-2 rounded border">{{ error.stack }}</pre>
              </div>

              <!-- Vue Component Info -->
              <div
                v-if="errorInfo"
                class="bg-gray-50 rounded-lg p-4"
              >
                <h3 class="font-semibold text-gray-900 mb-2">
                  Vue 組件資訊
                </h3>
                <pre class="text-xs text-gray-700 bg-white p-2 rounded border">{{ errorInfo }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Helpful Tips -->
      <div class="mt-6 bg-blue-50 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-blue-900 mb-3">
          解決建議
        </h2>
        <ul class="space-y-2 text-blue-800">
          <li class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span>檢查網路連線是否正常</span>
          </li>
          <li class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span>嘗試重新整理頁面</span>
          </li>
          <li class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span>清除瀏覽器快取後重試</span>
          </li>
          <li class="flex items-start gap-2">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span>如果問題持續存在，請聯繫技術支援</span>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Normal Content -->
  <slot v-else></slot>
</template>

<style scoped>
/* 平滑動畫 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* 自定義滾動條 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>