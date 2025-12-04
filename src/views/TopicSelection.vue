<script setup>
/**
 * TopicSelection Component
 * Formula: TopicSelection = TopicFilters + TopicGrid + DifficultySelector + StartButton
 * Responsibility: 主題選擇界面，支持主題和難度篩選
 * Updated: 使用 ALL_TOPICS 常量替代硬編碼主題列表
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuestionBankStore } from '../stores/questionBank'
import { extractTopicID, OFFICIAL_TOPIC, OFFICIAL_TOPICS } from '../constants/ipas'
import { useResourcesMap } from '../composables/useResourcesMap'
import TopicCard from '../components/TopicCard.vue'

const router = useRouter()
const route = useRoute()
const store = useQuestionBankStore()
const { getCategoryById, getCertificationByPath, getLevelById } = useResourcesMap()

/**
 * State
 */
const selectedSubject = ref(null) // 科目選擇狀態 (null | 'L21' | 'L23' | 'OFFICIAL')
const selectedTopic = ref(null)
const selectedDifficulty = ref([]) // INC-021: 改為陣列支援複選 (string[])
const difficultyFilter = ref('all') // INC-043: 難度下拉選單狀態 ('all' | 'simple' | 'medium' | 'hard' | 'simple,medium' | 'medium,hard' | 'simple,medium,hard')
const searchQuery = ref('')
const selectedSource = ref('all') // INC-043: 來源篩選狀態 ('all' | 'official' | 'ai')

/**
 * INC-032: Route params detection for filtered mode
 * Formula: isFilteredBySubject = computed(() => !!route.params.subjectId)
 */
const isFilteredBySubject = computed(() => !!route.params.subjectId)
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)
const subjectId = computed(() => route.params.subjectId)

// Get breadcrumb data for new structure
const ipasCategory = computed(() => isFilteredBySubject.value ? getCategoryById('ipas') : null)
const certification = computed(() => isFilteredBySubject.value ? getCertificationByPath('ipas', certificationId.value) : null)
const level = computed(() => isFilteredBySubject.value ? getLevelById('ipas', certificationId.value, levelId.value) : null)
const subject = computed(() => isFilteredBySubject.value ? level.value?.subjects.find(s => s.id === subjectId.value) : null)

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
  let topics = []

  // INC-032: If filtered by route params, use subjectId from route
  if (isFilteredBySubject.value) {
    // Filtered mode: only show topics for the current subject
    topics = topicList.value.filter(t => t.subjectId === subjectId.value)
  } else {
    // Normal mode: use selectedSubject state
    if (selectedSubject.value === 'OFFICIAL') {
      // 官方題目：使用 OFFICIAL_TOPICS (9 個主題)
      topics = OFFICIAL_TOPICS
    } else if (selectedSubject.value) {
      // 一般科目：從 store.topicList 過濾
      topics = topicList.value.filter(t => t.subjectId === selectedSubject.value)
    } else {
      // 未選擇科目：顯示所有主題（排除官方題目）
      topics = topicList.value.filter(t => t.subjectId !== 'OFFICIAL')
    }
  }

  // INC-040: 來源篩選
  // INC-044: Fix - Add difficulty parameter and zero-topic check
  if (selectedSource.value !== 'all') {
    topics = topics.filter(topic => {
      const stats = getTopicStats(topic.id, selectedDifficulty.value)

      // INC-044: Zero-topic check before source filtering
      if (stats.total === 0) return false

      if (selectedSource.value === 'official') {
        return stats.official > 0
      } else if (selectedSource.value === 'ai') {
        return stats.ai > 0
      } else if (selectedSource.value === 'mixed') {
        return stats.official > 0 && stats.ai > 0
      }
      return true
    })
  }

  // INC-044: Global zero-topic filter (catch topics when selectedSource === 'all')
  topics = topics.filter(topic => {
    const stats = getTopicStats(topic.id, selectedDifficulty.value)
    return stats.total > 0
  })

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
 * 支援一般主題和官方題目主題的統計
 * INC-021: 支援難度過濾參數（selectedDifficulties）
 * INC-042: 新增來源過濾邏輯（selectedSource）
 * Formula: getTopicStats = Extract(topicQuestions) -> ApplySourceFilter(selectedSource) -> ApplyDifficultyFilter(selectedDifficulties) -> Calculate(stats)
 */
const getTopicStats = (topicId, selectedDifficulties = []) => {
  let topicQuestions = []

  if (topicId === 'OFFICIAL') {
    // 官方題目總計：所有以 OFF_ 開頭的題目
    topicQuestions = store.questions.filter(q => q.question_id.startsWith('OFF_'))
  } else if (topicId.startsWith('OFF_')) {
    // 官方題目子主題：根據 sourcePattern 過濾
    const topic = OFFICIAL_TOPICS.find(t => t.id === topicId)
    if (topic && topic.sourcePattern) {
      topicQuestions = store.questions.filter(q =>
        q.source && q.source.includes(topic.sourcePattern)
      )
    }
  } else {
    // 一般主題：使用 extractTopicID 進行精確匹配
    topicQuestions = store.questions.filter(q => {
      const questionTopicId = extractTopicID(q.topic) || q.topic
      return questionTopicId === topicId
    })
  }

  // INC-042: 來源過濾（根據 selectedSource 狀態）
  if (selectedSource.value === 'official') {
    topicQuestions = topicQuestions.filter(q => q.question_id.startsWith('OFF_'))
  } else if (selectedSource.value === 'ai') {
    topicQuestions = topicQuestions.filter(q => !q.question_id.startsWith('OFF_'))
  }
  // 'all' 不過濾來源

  // INC-021: 根據選中的難度過濾題目
  if (selectedDifficulties.length > 0) {
    topicQuestions = topicQuestions.filter(q => selectedDifficulties.includes(q.difficulty))
  }

  // INC-039: 來源統計 - 區分官方題目和 AI 題目
  const officialQuestions = topicQuestions.filter(q => q.question_id.startsWith('OFF_'))
  const aiQuestions = topicQuestions.filter(q => !q.question_id.startsWith('OFF_'))

  return {
    total: topicQuestions.length,
    official: officialQuestions.length,
    ai: aiQuestions.length,
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
// 科目選擇函數
const selectSubject = (subjectId) => {
  selectedSubject.value = subjectId
  searchQuery.value = '' // 清除搜尋
  selectedTopic.value = null // 清除已選主題
}

const selectTopic = (topicId) => {
  selectedTopic.value = topicId === selectedTopic.value ? null : topicId
}

// INC-043: 難度下拉選單處理函數
const handleDifficultyChange = () => {
  if (difficultyFilter.value === 'all') {
    selectedDifficulty.value = []
  } else {
    selectedDifficulty.value = difficultyFilter.value.split(',')
  }
}

/**
 * INC-015: Start Practice Mode
 * INC-042: 新增來源篩選
 * INC-047: 傳遞完整篩選參數到 URL，與 ExamSettings 保持一致
 * Formula: startPractice = filterByTopic -> filterBySource [NEW] -> filterByDifficulties -> navigate(with params)
 * INC-021: 使用 filterByDifficulties 支援複選
 */
const startPractice = () => {
  if (!canStartPractice.value) return

  // Apply filters
  store.filterByTopic(selectedTopic.value)

  // INC-042: 新增來源篩選
  store.filterBySource(selectedSource.value)

  // INC-021: 使用 filterByDifficulties 處理陣列
  if (selectedDifficulty.value.length > 0) {
    store.filterByDifficulties(selectedDifficulty.value)
  }

  // INC-047: Navigate to quiz with complete filter parameters
  const query = {
    mode: 'practice',
    topic: selectedTopic.value,
    source: selectedSource.value
  }

  // INC-047: Add difficulty parameter if selected
  if (selectedDifficulty.value.length > 0) {
    query.difficulties = selectedDifficulty.value.join(',')
  }

  router.push({
    path: '/quiz',
    query
  })
}

/**
 * INC-015: Start Exam Mode
 * INC-042: 新增來源篩選
 * INC-047: 傳遞完整篩選參數到 URL，與 ExamSettings 保持一致
 * Formula: startExam = filterByTopic -> filterBySource [NEW] -> filterByDifficulties -> navigate(with params)
 * INC-021: 使用 filterByDifficulties 支援複選
 */
const startExam = () => {
  if (!canStartPractice.value) return

  // Apply filters
  store.filterByTopic(selectedTopic.value)

  // INC-042: 新增來源篩選
  store.filterBySource(selectedSource.value)

  // INC-021: 使用 filterByDifficulties 處理陣列
  if (selectedDifficulty.value.length > 0) {
    store.filterByDifficulties(selectedDifficulty.value)
  }

  // INC-047: Navigate to quiz with complete filter parameters
  const query = {
    mode: 'exam',
    topic: selectedTopic.value,
    source: selectedSource.value
  }

  // INC-047: Add difficulty parameter if selected
  if (selectedDifficulty.value.length > 0) {
    query.difficulties = selectedDifficulty.value.join(',')
  }

  router.push({
    path: '/quiz',
    query
  })
}

const goBack = () => {
  // INC-032: Conditional navigation based on route structure
  if (isFilteredBySubject.value) {
    // Go back to PracticeHub
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/practice`)
  } else {
    // Go back to home
    router.push('/')
  }
}

const goToPracticeHub = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/practice`)
}

const goToSubjectHub = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}`)
}

const goToLevel = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}`)
}

const goToCertification = () => {
  router.push(`/resources/ipas/${certificationId.value}`)
}

const goToIpas = () => {
  router.push('/resources/ipas')
}

/**
 * INC-032: Auto-select subject when coming from PracticeHub
 */
onMounted(() => {
  if (isFilteredBySubject.value && subjectId.value) {
    selectedSubject.value = subjectId.value
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="w-full">
          <button
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            @click="goBack"
          >
            <svg
              class="w-5 h-5"
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
            {{ isFilteredBySubject ? '返回題目區' : '返回主頁' }}
          </button>

          <!-- INC-032: Breadcrumb for filtered mode -->
          <div
            v-if="isFilteredBySubject && ipasCategory && certification && level && subject"
            class="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap"
          >
            <span
              class="hover:text-primary-600 cursor-pointer"
              @click="goToIpas"
            >{{ ipasCategory.name }}</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span
              class="hover:text-primary-600 cursor-pointer"
              @click="goToCertification"
            >{{ certification.name }}</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span
              class="hover:text-primary-600 cursor-pointer"
              @click="goToLevel"
            >{{ level.name }}</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span
              class="hover:text-primary-600 cursor-pointer"
              @click="goToSubjectHub"
            >{{ subject.code }}</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span
              class="hover:text-primary-600 cursor-pointer"
              @click="goToPracticeHub"
            >題目區</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span class="font-semibold text-gray-900">主題練習</span>
          </div>

          <h1 class="text-4xl font-bold text-gray-900 mb-2">
            主題選擇
          </h1>
          <p class="text-gray-600">
            選擇一個主題開始練習
          </p>
        </div>
      </div>

      <!-- INC-011: 階段 1 - 科目選擇 + INC-013-HOTFIX: 官方題目卡片 -->
      <!-- INC-032: Hide subject selection when filtered by route params -->
      <div
        v-if="!selectedSubject && !isFilteredBySubject"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8"
      >
        <!-- INC-013-HOTFIX: 官方題目卡片 -->
        <div
          class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all text-white"
          @click="selectSubject('OFFICIAL')"
        >
          <div class="text-5xl mb-4">
            {{ OFFICIAL_TOPIC.icon }}
          </div>
          <h2 class="text-2xl font-bold mb-3">
            {{ OFFICIAL_TOPIC.name }}
          </h2>
          <p class="text-blue-100 mb-4">
            {{ OFFICIAL_TOPIC.description }}
          </p>
          <div class="text-sm text-blue-200">
            <span class="font-semibold">9 個主題</span>
          </div>
        </div>

        <!-- 科目一 -->
        <div
          class="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all"
          @click="selectSubject('L21')"
        >
          <div class="text-5xl mb-4">
            🤖
          </div>
          <h2 class="text-3xl font-bold text-primary-700 mb-4">
            科目一
          </h2>
          <p class="text-xl text-gray-700 mb-4">
            人工智慧技術應用與規劃
          </p>
          <div class="text-sm text-gray-600">
            <span class="font-semibold">9 個主題</span>
          </div>
        </div>

        <!-- 科目三 -->
        <div
          class="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition-all"
          @click="selectSubject('L23')"
        >
          <div class="text-5xl mb-4">
            📊
          </div>
          <h2 class="text-3xl font-bold text-secondary-700 mb-4">
            科目三
          </h2>
          <p class="text-xl text-gray-700 mb-4">
            機器學習技術與應用
          </p>
          <div class="text-sm text-gray-600">
            <span class="font-semibold">12 個主題</span>
          </div>
        </div>
      </div>

      <!-- INC-011: 階段 2 - 主題選擇 (原有內容) -->
      <!-- INC-032: Show topic selection directly when filtered, or after subject selection -->
      <div v-if="selectedSubject || isFilteredBySubject">
        <!-- 返回科目選擇按鈕 -->
        <!-- INC-032: Only show back to subject selection when not filtered by route -->
        <button
          v-if="!isFilteredBySubject"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          @click="selectedSubject = null"
        >
          <svg
            class="w-5 h-5"
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
          返回科目選擇
        </button>

        <!-- Search & Filters -->
        <div class="bg-white rounded-xl shadow-lg p-7 md:p-8 mb-8">
          <!-- Search -->
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">搜尋主題</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋主題名稱或描述..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
            />
          </div>

          <!-- INC-043: Difficulty and Source Filters in Grid Layout -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Difficulty Filter Dropdown -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">難度篩選</label>
              <select
                v-model="difficultyFilter"
                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                @change="handleDifficultyChange"
              >
                <option value="all">
                  全部難度
                </option>
                <option value="simple">
                  簡單
                </option>
                <option value="medium">
                  中等
                </option>
                <option value="hard">
                  困難
                </option>
                <option value="simple,medium">
                  簡單 + 中等
                </option>
                <option value="medium,hard">
                  中等 + 困難
                </option>
                <option value="simple,medium,hard">
                  全部（簡單 + 中等 + 困難）
                </option>
              </select>
            </div>

            <!-- Source Filter Dropdown -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-3">來源篩選</label>
              <select
                v-model="selectedSource"
                class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="all">
                  📚 全部
                </option>
                <option value="official">
                  🏛️ 官方題目
                </option>
                <option value="ai">
                  🤖 AI 題目
                </option>
              </select>
            </div>
          </div>

          <!-- Selected Info -->
          <div
            v-if="selectedTopic"
            class="mt-6 p-5 md:p-6 bg-primary-50 border border-primary-200 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-semibold text-primary-900">已選擇主題:</span>
                <span class="ml-2 text-primary-700">
                  {{ topicList.find(t => t.id === selectedTopic)?.name }}
                </span>
                <span
                  v-if="selectedDifficulty.length > 0"
                  class="ml-2 text-primary-600"
                >
                  ({{ selectedDifficulty.map(d => d === 'simple' ? '簡單' : d === 'medium' ? '中等' : '困難').join('、') }})
                </span>
              </div>
              <button
                class="text-primary-600 hover:text-primary-800 text-sm font-medium"
                @click="selectTopic(null)"
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
            :stats="getTopicStats(topic.id, selectedDifficulty)"
            :is-selected="selectedTopic === topic.id"
            @select="selectTopic(topic.id)"
          />
        </div>

        <!-- Empty State -->
        <div
          v-if="filteredTopics.length === 0"
          class="text-center py-16"
        >
          <svg
            class="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p class="text-gray-600 text-lg">
            找不到符合條件的主題
          </p>
          <button
            class="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            @click="searchQuery = ''"
          >
            清除搜尋
          </button>
        </div>

        <!-- INC-015: Start Practice/Exam Buttons -->
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl p-5 md:p-7">
          <div class="max-w-7xl mx-auto">
            <!-- Selection Status -->
            <div class="text-sm text-gray-600 mb-4 text-center">
              <span v-if="selectedTopic">已選擇 1 個主題</span>
              <span v-else>請選擇一個主題</span>
            </div>

            <!-- Dual Button Layout -->
            <div class="flex gap-4">
              <!-- Practice Button (Blue) -->
              <button
                :disabled="!canStartPractice"
                :class="[
                  'flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all shadow-lg',
                  canStartPractice
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]"
                @click="startPractice"
              >
                開始練習
                <svg
                  class="inline-block w-6 h-6 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

              <!-- Exam Button (Red) -->
              <button
                :disabled="!canStartPractice"
                :class="[
                  'flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all shadow-lg',
                  canStartPractice
                    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                ]"
                @click="startExam"
              >
                開始考試
                <svg
                  class="inline-block w-6 h-6 ml-2"
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
              </button>
            </div>
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
