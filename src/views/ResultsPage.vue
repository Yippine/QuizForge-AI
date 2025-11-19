<script setup>
/**
 * ResultsPage - Quiz Results View
 * Formula: ResultsPage = ScorePanel + WrongQuestionsList + ActionButtons
 * Responsibility: 答題結果頁面，顯示總分、錯題列表、操作按鈕
 * INC-017: Quiz completion page implementation
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizResultsStore } from '../stores/quizResults'
import { useQuestionBankStore } from '../stores/questionBank'
import Explanation from '../components/Explanation.vue'

const router = useRouter()
const resultsStore = useQuizResultsStore()
const _questionBankStore = useQuestionBankStore()

/**
 * State
 */
// 每個錯題的解析展開狀態
const expandedExplanations = ref(new Set())

/**
 * INC-019-HOTFIX: 選項隨機化輔助函數
 * 與 QuestionCard.vue 使用相同的邏輯，確保結果頁面顯示的選項順序與答題時一致
 */

/**
 * 生成隨機後的選項
 * @param {string} questionId - 題目 ID
 * @param {Object} options - 原始選項物件
 * @param {number} sessionSeed - Session seed
 * @returns {Object} - 隨機後的選項物件 {A: text, B: text, C: text, D: text}
 */
const shuffleOptions = (questionId, options, sessionSeed) => {
  if (!options) return {}

  // 使用相同的 question_id + sessionSeed 組合種子
  const combinedSeed = questionId + '_' + sessionSeed
  let hash = 0
  for (let i = 0; i < combinedSeed.length; i++) {
    hash = ((hash << 5) - hash) + combinedSeed.charCodeAt(i)
    hash = hash & hash
  }

  // 簡單的線性同餘生成器 (LCG)
  let randomSeed = Math.abs(hash)
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  // 將物件轉為陣列
  const optionsArray = Object.entries(options)

  // Fisher-Yates shuffle with seeded random
  const shuffled = [...optionsArray]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 重新映射為 ABCD
  const newLabels = ['A', 'B', 'C', 'D']
  const remapped = {}
  shuffled.forEach((item, index) => {
    remapped[newLabels[index]] = item[1]  // item[1] 是選項文字
  })

  return remapped
}

/**
 * 生成 key 映射表（新 key -> 原始 key）
 * @param {string} questionId - 題目 ID
 * @param {Object} options - 原始選項物件
 * @param {number} sessionSeed - Session seed
 * @returns {Object} - 映射表 {A: 'B', B: 'A', C: 'D', D: 'C'}
 */
const generateKeyMapping = (questionId, options, sessionSeed) => {
  if (!options) return { A: 'A', B: 'B', C: 'C', D: 'D' }

  // 使用相同的組合種子
  const combinedSeed = questionId + '_' + sessionSeed
  let hash = 0
  for (let i = 0; i < combinedSeed.length; i++) {
    hash = ((hash << 5) - hash) + combinedSeed.charCodeAt(i)
    hash = hash & hash
  }

  let randomSeed = Math.abs(hash)
  const seededRandom = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  const optionsArray = Object.entries(options)
  const shuffled = [...optionsArray]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // 創建映射：新key -> 原始key
  const newLabels = ['A', 'B', 'C', 'D']
  const mapping = {}
  shuffled.forEach((item, index) => {
    mapping[newLabels[index]] = item[0]  // item[0] 是原始的 key (A/B/C/D)
  })

  return mapping
}

/**
 * 獲取題目的顯示選項（考慮隨機化）
 * @param {Object} questionItem - 題目結果項 {question, userAnswer, correctAnswer, isCorrect}
 * @returns {Object} - 顯示用的選項物件
 */
const getDisplayOptions = (questionItem) => {
  const config = quizConfig.value

  // 如果沒有啟用選項隨機化，直接返回原始選項
  if (!config.shouldShuffleOptions || !config.sessionSeed) {
    return questionItem.question.options
  }

  // 使用相同的 sessionSeed 重現隨機順序
  return shuffleOptions(
    questionItem.question.question_id,
    questionItem.question.options,
    config.sessionSeed
  )
}

/**
 * 獲取顯示用的正確答案 key
 * @param {Object} questionItem - 題目結果項
 * @returns {string} - 隨機後的正確答案 key (A/B/C/D)
 */
const getDisplayCorrectAnswer = (questionItem) => {
  const config = quizConfig.value

  // 如果沒有啟用選項隨機化，直接返回原始答案
  if (!config.shouldShuffleOptions || !config.sessionSeed) {
    return questionItem.correctAnswer
  }

  // 使用 keyMapping 找到原始正確答案對應的新 key
  const keyMapping = generateKeyMapping(
    questionItem.question.question_id,
    questionItem.question.options,
    config.sessionSeed
  )

  // 找到原始正確答案對應的新 key
  for (const [newKey, originalKey] of Object.entries(keyMapping)) {
    if (originalKey === questionItem.correctAnswer) {
      return newKey
    }
  }

  return questionItem.correctAnswer
}

/**
 * Computed
 */
const results = computed(() => resultsStore.results)
const quizConfig = computed(() => resultsStore.quizConfig)

// 成績等級評語
const scoreGrade = computed(() => {
  const accuracy = results.value.accuracy
  if (accuracy === 100) return { text: '完美！', color: 'text-yellow-600', emoji: '🎉' }
  if (accuracy >= 90) return { text: '優秀！', color: 'text-green-600', emoji: '🌟' }
  if (accuracy >= 80) return { text: '良好！', color: 'text-blue-600', emoji: '👍' }
  if (accuracy >= 70) return { text: '加油！', color: 'text-orange-600', emoji: '💪' }
  return { text: '繼續努力！', color: 'text-red-600', emoji: '📚' }
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
 * Actions
 */

/**
 * 切換解析顯示狀態
 */
const toggleExplanation = (questionId) => {
  if (expandedExplanations.value.has(questionId)) {
    expandedExplanations.value.delete(questionId)
  } else {
    expandedExplanations.value.add(questionId)
  }
}

/**
 * 檢查解析是否展開
 */
const isExplanationExpanded = (questionId) => {
  return expandedExplanations.value.has(questionId)
}

/**
 * 重新練習 - 使用相同設定（主題、模式、題數、時間）重新抽取題目
 */
const retryQuiz = () => {
  const config = quizConfig.value

  // 清除結果數據
  resultsStore.clearResults()

  // 準備 query 參數
  const query = {
    mode: config.mode
  }

  // 添加題數限制（如果有）
  if (config.questionCount) {
    query.questionCount = config.questionCount
  }

  // 添加時間限制（如果有）
  if (config.timeLimit) {
    query.timeLimit = config.timeLimit
  }

  // 跳轉回答題頁面，使用相同的配置
  if (config.topicId) {
    router.push({
      path: `/quiz/${config.topicId}`,
      query
    })
  } else {
    router.push({
      path: '/quiz',
      query
    })
  }

  console.log('🔄 Retry quiz with config:', config)
}

/**
 * 返回首頁
 */
const goHome = () => {
  resultsStore.clearResults()
  router.push('/')
}

/**
 * Lifecycle
 */
onMounted(() => {
  // 檢查是否有結果數據
  if (!resultsStore.hasResults) {
    console.warn('⚠️ No results data found, redirecting to home...')
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-4 md:py-8 px-2 md:px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="text-center mb-6 md:mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          答題結果
        </h1>
        <p class="text-sm md:text-base text-gray-600">
          Quiz Results
        </p>
      </header>

      <!-- Score Panel -->
      <section class="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
        <div class="text-center mb-6">
          <div :class="['text-4xl md:text-5xl font-bold mb-2', scoreGrade.color]">
            {{ scoreGrade.emoji }} {{ scoreGrade.text }}
          </div>
          <div class="text-2xl md:text-3xl font-semibold text-gray-800">
            {{ results.accuracy }}%
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <!-- 正確題數 / 總題數 -->
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
            <div class="text-sm text-gray-600 mb-1">
              總分
            </div>
            <div class="text-2xl md:text-3xl font-bold text-green-600">
              {{ results.correctCount }} / {{ results.totalQuestions }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              正確 / 總題數
            </div>
          </div>

          <!-- 答對率 -->
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
            <div class="text-sm text-gray-600 mb-1">
              答對率
            </div>
            <div class="text-2xl md:text-3xl font-bold text-blue-600">
              {{ results.accuracy }}%
            </div>
            <div class="text-xs text-gray-500 mt-1">
              正確 {{ results.correctCount }} 題
            </div>
          </div>

          <!-- 總用時 -->
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
            <div class="text-sm text-gray-600 mb-1">
              總用時
            </div>
            <div class="text-2xl md:text-3xl font-bold text-purple-600">
              {{ results.formattedTime }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              答題時間
            </div>
          </div>
        </div>
      </section>

      <!-- All Questions List -->
      <section class="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-6">
        <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span class="text-blue-600">📝</span>
          題目列表
          <span class="text-sm font-normal text-gray-500">（{{ results.questionResults.length }} 題）</span>
        </h2>

        <div class="space-y-6">
          <div
            v-for="(item, index) in results.questionResults"
            :key="item.question.question_id"
            class="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow"
          >
            <!-- Question Header -->
            <div class="flex justify-between items-start mb-3">
              <div class="font-semibold text-gray-700">
                題目 {{ index + 1 }}
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {{ getDifficultyText(item.question.difficulty) }}
                </span>
                <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                  {{ item.question.topic }}
                </span>
              </div>
            </div>

            <!-- Question Text -->
            <div class="mb-4">
              <p class="text-base md:text-lg text-gray-900 leading-relaxed">
                {{ item.question.question }}
              </p>
            </div>

            <!-- Options (INC-019-HOTFIX: 使用隨機後的選項順序，並顯示用戶選擇) -->
            <div class="space-y-2 mb-4">
              <div
                v-for="(option, key) in getDisplayOptions(item)"
                :key="key"
                :class="[
                  'p-3 rounded-lg border-2 transition-all',
                  // 用戶選擇的答案
                  key === item.userAnswer && !item.isCorrect
                    ? 'border-red-500 bg-red-50'
                    : key === getDisplayCorrectAnswer(item)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                ]"
              >
                <div class="flex items-start gap-2">
                  <span
                    :class="[
                      'font-semibold min-w-[24px]',
                      key === item.userAnswer && !item.isCorrect
                        ? 'text-red-600'
                        : key === getDisplayCorrectAnswer(item)
                          ? 'text-green-600'
                          : 'text-gray-600'
                    ]"
                  >
                    {{ key }}.
                  </span>
                  <span
                    :class="[
                      'flex-1',
                      key === item.userAnswer && !item.isCorrect
                        ? 'text-red-900 font-medium'
                        : key === getDisplayCorrectAnswer(item)
                          ? 'text-green-900 font-medium'
                          : 'text-gray-700'
                    ]"
                  >
                    {{ option }}
                  </span>
                  <!-- 用戶的錯誤答案標記 -->
                  <span
                    v-if="key === item.userAnswer && !item.isCorrect"
                    class="text-red-600 font-bold text-sm"
                  >
                    ✗ 你的答案
                  </span>
                  <!-- 正確答案標記 -->
                  <span
                    v-if="key === getDisplayCorrectAnswer(item)"
                    class="text-green-600 font-bold text-sm"
                  >
                    ✓ 正確答案
                  </span>
                </div>
              </div>
            </div>

            <!-- Toggle Explanation Button -->
            <button
              class="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-medium transition-colors"
              @click="toggleExplanation(item.question.question_id)"
            >
              {{ isExplanationExpanded(item.question.question_id) ? '收起解析' : '查看解析' }}
            </button>

            <!-- Explanation (Expandable) -->
            <div
              v-if="isExplanationExpanded(item.question.question_id)"
              class="mt-4 pt-4 border-t border-gray-200"
            >
              <Explanation
                :show="true"
                :explanation="item.question.explanation"
                :keywords="item.question.keywords"
                :references="item.question.reference"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <section class="flex flex-col md:flex-row gap-4 mb-8">
        <button
          class="flex-1 py-3 md:py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-base md:text-lg transition-colors shadow-md hover:shadow-lg"
          @click="retryQuiz"
        >
          🔄 重新練習
        </button>
        <button
          class="flex-1 py-3 md:py-4 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold text-base md:text-lg transition-colors shadow-md hover:shadow-lg"
          @click="goHome"
        >
          🏠 返回首頁
        </button>
      </section>

      <!-- Footer -->
      <footer class="text-center text-xs md:text-sm text-gray-500 pb-4">
        <p>Formula-Contract Methodology | Generated with Claude Code</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .gap-4 {
    gap: 1rem;
  }
}
</style>
