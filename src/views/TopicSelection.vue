<script setup>
/**
 * TopicSelection Component
 * Formula: TopicSelection = TopicFilters + TopicGrid + DifficultySelector + StartButton
 * Responsibility: 主題選擇界面，支持主題和難度篩選
 * Updated: 使用 ALL_TOPICS 常量替代硬編碼主題列表
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionBankStore } from '../stores/questionBank'
import TopicCard from '../components/TopicCard.vue'

const router = useRouter()
const store = useQuestionBankStore()

/**
 * State
 */
const selectedSubject = ref(null) // INC-011: 新增科目選擇狀態 (null | 'L21' | 'L23')
const selectedTopic = ref(null)
const selectedDifficulty = ref(null)
const searchQuery = ref('')

/**
 * Topic List - 從 store.topicList 取得完整的 21 個主題
 * Formula: topicList = store.topicList (ALL_TOPICS from constants)
 * 包含: L21 (9個主題) + L23 (12個主題) = 21個主題
 */
const topicList = computed(() => store.topicList)

/**
 * Computed
 */
const filteredTopics = computed(() => {
  let topics = topicList.value

  // INC-011: 按科目過濾
  if (selectedSubject.value) {
    topics = topics.filter(t => t.subjectId === selectedSubject.value)
  }

  // 按搜尋過濾
  return topics.filter(topic => {
    const matchesSearch = searchQuery.value === '' ||
      topic.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (topic.description && topic.description.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      topic.fullName.toLowerCase().includes(searchQuery.value.toLowerCase())

    return matchesSearch
  })
})

const canStartPractice = computed(() => {
  return selectedTopic.value !== null
})

/**
 * Topic Statistics
 * 更新為使用正確的主題匹配邏輯
 * 支援兩種格式：fullName (L21101-自然語言處理技術與應用) 和 topicId (L21101)
 */
const getTopicStats = (topicId) => {
  // 找出符合該主題的題目
  const topicQuestions = store.questions.filter(q => {
    // 直接使用 topic 欄位進行匹配（支援完整名稱）
    return q.topic && q.topic.includes(topicId)
  })

  return {
    total: topicQuestions.length,
    difficulties: {
      simple: topicQuestions.filter(q => q.difficulty === 'simple').length,
      medium: topicQuestions.filter(q => q.difficulty === 'medium').length,
      hard: topicQuestions.filter(q => q.difficulty === 'hard').length
    }
  }
}

/**
 * Actions
 */
// INC-011: 新增科目選擇函數
const selectSubject = (subjectId) => {
  selectedSubject.value = subjectId
  searchQuery.value = '' // 清除搜尋
}

const selectTopic = (topicId) => {
  selectedTopic.value = topicId === selectedTopic.value ? null : topicId
}

const selectDifficulty = (difficulty) => {
  selectedDifficulty.value = difficulty === selectedDifficulty.value ? null : difficulty
}

const startPractice = () => {
  if (!canStartPractice.value) return

  // Apply filters
  store.filterByTopic(selectedTopic.value)
  if (selectedDifficulty.value) {
    store.filterByDifficulty(selectedDifficulty.value)
  }

  // INC-011: Navigate to quiz with topicId params
  router.push({
    path: '/quiz',
    params: { topicId: selectedTopic.value }
  })
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <button
            @click="goBack"
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            返回主頁
          </button>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">主題選擇</h1>
          <p class="text-gray-600">選擇一個主題開始練習</p>
        </div>
      </div>

      <!-- INC-011: 階段 1 - 科目選擇 -->
      <div v-if="!selectedSubject" class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div
          @click="selectSubject('L21')"
          class="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all"
        >
          <h2 class="text-3xl font-bold text-primary-700 mb-4">科目一</h2>
          <p class="text-xl text-gray-700 mb-4">人工智慧技術應用與規劃</p>
          <div class="text-sm text-gray-600">
            <span class="font-semibold">9 個主題</span>
          </div>
        </div>
        <div
          @click="selectSubject('L23')"
          class="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all"
        >
          <h2 class="text-3xl font-bold text-secondary-700 mb-4">科目三</h2>
          <p class="text-xl text-gray-700 mb-4">機器學習技術與應用</p>
          <div class="text-sm text-gray-600">
            <span class="font-semibold">12 個主題</span>
          </div>
        </div>
      </div>

      <!-- INC-011: 階段 2 - 主題選擇 (原有內容) -->
      <div v-else>
        <!-- 返回科目選擇按鈕 -->
        <button
          @click="selectedSubject = null"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回科目選擇
        </button>

      <!-- Search & Filters -->
      <div class="bg-white rounded-xl shadow-lg p-7 md:p-8 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Search -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">搜尋主題</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋主題名稱或描述..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
            />
          </div>

          <!-- Difficulty Filter -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">難度篩選</label>
            <div class="flex gap-3 md:gap-4">
              <button
                @click="selectDifficulty('simple')"
                :class="[
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all',
                  selectedDifficulty === 'simple'
                    ? 'bg-accent-600 text-white shadow-lg'
                    : 'bg-accent-100 text-accent-800 hover:bg-accent-200'
                ]"
              >
                簡單
              </button>
              <button
                @click="selectDifficulty('medium')"
                :class="[
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all',
                  selectedDifficulty === 'medium'
                    ? 'bg-warning-600 text-white shadow-lg'
                    : 'bg-warning-100 text-warning-800 hover:bg-warning-200'
                ]"
              >
                中等
              </button>
              <button
                @click="selectDifficulty('hard')"
                :class="[
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all',
                  selectedDifficulty === 'hard'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                ]"
              >
                困難
              </button>
            </div>
          </div>
        </div>

        <!-- Selected Info -->
        <div v-if="selectedTopic" class="mt-6 p-5 md:p-6 bg-primary-50 border border-primary-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-semibold text-primary-900">已選擇主題:</span>
              <span class="ml-2 text-primary-700">
                {{ topicList.find(t => t.id === selectedTopic)?.name }}
              </span>
              <span v-if="selectedDifficulty" class="ml-2 text-primary-600">
                ({{ selectedDifficulty === 'simple' ? '簡單' : selectedDifficulty === 'medium' ? '中等' : '困難' }})
              </span>
            </div>
            <button
              @click="selectTopic(null)"
              class="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              清除選擇
            </button>
          </div>
        </div>
      </div>

      <!-- Topic Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
        <TopicCard
          v-for="topic in filteredTopics"
          :key="topic.id"
          :topic="topic"
          :stats="getTopicStats(topic.id)"
          :is-selected="selectedTopic === topic.id"
          @select="selectTopic(topic.id)"
        />
      </div>

      <!-- Empty State -->
      <div v-if="filteredTopics.length === 0" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p class="text-gray-600 text-lg">找不到符合條件的主題</p>
        <button
          @click="searchQuery = ''"
          class="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          清除搜尋
        </button>
      </div>

      <!-- Start Practice Button -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl p-5 md:p-7">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="text-sm text-gray-600">
            <span v-if="selectedTopic">已選擇 1 個主題</span>
            <span v-else>請選擇一個主題</span>
          </div>
          <button
            @click="startPractice"
            :disabled="!canStartPractice"
            :class="[
              'px-8 py-3 rounded-lg font-bold text-lg transition-all shadow-lg',
              canStartPractice
                ? 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            開始練習
            <svg class="inline-block w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- INC-011: 關閉科目選擇的 v-else div -->
      </div>

      <!-- Bottom Spacer -->
      <div class="h-24"></div>
    </div>
  </div>
</template>

<style scoped>
/* Fixed bottom bar on mobile */
@media (max-width: 768px) {
  .fixed {
    padding: 1rem;
  }
}
</style>
