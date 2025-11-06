<script setup>
/**
 * QuizForge AI - Main Application
 * Formula: App = RouterView + ErrorBoundary + GlobalStore
 * Responsibility: 應用根組件，提供路由容器和全局狀態
 */
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useQuestionBankStore } from './stores/questionBank'
import ErrorBoundary from './components/ErrorBoundary.vue'

const store = useQuestionBankStore()

/**
 * State
 */
const hasError = ref(false)
const errorMessage = ref(null)

/**
 * Error Handling
 */
onErrorCaptured((error, instance, info) => {
  console.error('App.vue caught an error:', error, info)
  hasError.value = true
  errorMessage.value = error.message
  return false
})

/**
 * Lifecycle
 */
onMounted(async () => {
  console.log('🚀 QuizForge AI - Loading...')

  try {
    // Pre-load question bank for better UX
    await store.loadQuestions()
    console.log('✅ QuizForge AI - Ready!')
    console.log(`📚 Loaded ${store.questions.length} questions`)
  } catch (error) {
    console.error('❌ Application initialization failed:', error)
    hasError.value = true
    errorMessage.value = error.message
  }
})

/**
 * Error Recovery
 */
const handleAppRetry = () => {
  hasError.value = false
  errorMessage.value = null
  location.reload()
}
</script>

<template>
  <ErrorBoundary
    :show-details="true"
    :show-retry="true"
    :show-report="true"
    @retry="handleAppRetry"
  >
    <RouterView />
  </ErrorBoundary>
</template>

<style>
/* Global Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
