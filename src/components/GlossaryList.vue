<script setup>
/**
 * GlossaryList Component
 * Formula: GlossaryList = (DataFetch -> StateManagement) x (SearchFilter & SortLogic) x ListRendering
 * Responsibility: Display glossary terms with search and sort functionality
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  subjectId: {
    type: String,
    required: true
  }
})

const router = useRouter()
const route = useRoute()

// State Management
const terms = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const sortOrder = ref('zh') // 'zh' for Chinese pinyin, 'en' for English

// Computed: Route params for navigation
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)

/**
 * SearchFilter
 * Formula: SearchFilter(query) = terms.filter(t => t.term.includes(query) | t.english.includes(query) | t.definition.includes(query))
 */
const filteredTerms = computed(() => {
  if (!searchQuery.value.trim()) {
    return sortedTerms.value
  }

  const query = searchQuery.value.toLowerCase()
  return sortedTerms.value.filter(term =>
    term.term.toLowerCase().includes(query) ||
    term.english.toLowerCase().includes(query) ||
    term.definition.toLowerCase().includes(query)
  )
})

/**
 * SortLogic
 * Formula: SortLogic = (sortOrder = 'zh') -> sortByPinyin(terms) | (sortOrder = 'en') -> sortByEnglish(terms)
 */
const sortedTerms = computed(() => {
  const termsCopy = [...terms.value]

  if (sortOrder.value === 'zh') {
    return termsCopy.sort((a, b) =>
      a.term.localeCompare(b.term, 'zh-Hant-TW')
    )
  } else {
    return termsCopy.sort((a, b) =>
      a.english.localeCompare(b.english, 'en-US')
    )
  }
})

/**
 * Highlight search text in result
 */
const highlightText = (text, maxLength = 100) => {
  if (!searchQuery.value.trim()) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return truncatedText.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>')
}

/**
 * DataFetch
 * Formula: fetch(glossary.json) -> terms[]
 */
const loadGlossaryData = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await fetch('/knowledge-base/ipas/ai-planning/intermediate/glossary.json')

    if (!response.ok) {
      throw new Error(`Failed to load glossary data: ${response.status}`)
    }

    const data = await response.json()
    terms.value = data.terms || []
  } catch (err) {
    console.error('Error loading glossary:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

/**
 * Navigation Actions
 */
const goToTermDetail = (termId) => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${props.subjectId}/materials/glossary/${termId}`)
}

const _goBack = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${props.subjectId}/materials`)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'zh' ? 'en' : 'zh'
}

/**
 * Category color mapping
 */
const getCategoryColor = (category) => {
  const colors = {
    '基礎概念': 'blue',
    '演算法': 'green',
    '應用領域': 'purple',
    '評估指標': 'orange'
  }
  return colors[category] || 'gray'
}

/**
 * Lifecycle
 */
onMounted(() => {
  loadGlossaryData()
})
</script>

<template>
  <div class="glossary-list">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-16"
    >
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mb-4"></div>
        <p class="text-gray-600">
          載入術語表...
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
    >
      <svg
        class="w-12 h-12 text-red-500 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 class="text-xl font-bold text-red-900 mb-2">
        載入失敗
      </h3>
      <p class="text-red-700 mb-4">
        {{ error }}
      </p>
      <button
        class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        @click="loadGlossaryData"
      >
        重新載入
      </button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Search and Sort Controls -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search Box -->
          <div class="relative flex-grow">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋術語、英文名稱或定義..."
              class="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            />
            <svg
              class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
            <button
              v-if="searchQuery"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              @click="clearSearch"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Sort Toggle -->
          <button
            class="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
            @click="toggleSortOrder"
          >
            <svg
              class="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            <span class="text-gray-700">{{ sortOrder === 'zh' ? '中文拼音' : '英文字母' }}</span>
          </button>
        </div>

        <!-- Results Count -->
        <div class="mt-3 text-sm text-gray-500">
          <span v-if="searchQuery">
            找到 <span class="font-semibold text-teal-600">{{ filteredTerms.length }}</span> 個符合的術語
          </span>
          <span v-else>
            共 <span class="font-semibold text-teal-600">{{ terms.length }}</span> 個術語
          </span>
        </div>
      </div>

      <!-- Empty Search Result -->
      <div
        v-if="filteredTerms.length === 0"
        class="text-center py-12"
      >
        <svg
          class="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-gray-600 mb-2">
          找不到相符的術語
        </h3>
        <p class="text-gray-500">
          請嘗試其他關鍵詞
        </p>
        <button
          class="mt-4 text-teal-600 hover:text-teal-700 font-medium"
          @click="clearSearch"
        >
          清除搜尋
        </button>
      </div>

      <!-- Terms Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="term in filteredTerms"
          :key="term.id"
          class="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-gray-100"
          @click="goToTermDetail(term.id)"
        >
          <!-- Term Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-grow">
              <h3
                class="text-lg font-bold text-gray-900"
                v-html="highlightText(term.term, 50)"
              ></h3>
              <p
                class="text-sm text-gray-500"
                v-html="highlightText(term.english, 50)"
              ></p>
            </div>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2"
              :class="{
                'bg-blue-100 text-blue-700': getCategoryColor(term.category) === 'blue',
                'bg-green-100 text-green-700': getCategoryColor(term.category) === 'green',
                'bg-purple-100 text-purple-700': getCategoryColor(term.category) === 'purple',
                'bg-orange-100 text-orange-700': getCategoryColor(term.category) === 'orange',
                'bg-gray-100 text-gray-700': getCategoryColor(term.category) === 'gray'
              }"
            >
              {{ term.category }}
            </span>
          </div>

          <!-- Definition Preview -->
          <p
            class="text-sm text-gray-600 mb-3 line-clamp-3"
            v-html="highlightText(term.definition, 100)"
          ></p>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-3 border-t border-gray-100">
            <div class="flex items-center gap-1 text-xs text-gray-400">
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>{{ term.related.length }} 個相關</span>
            </div>
            <svg
              class="w-5 h-5 text-teal-600"
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glossary-list {
  width: 100%;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-300 {
  transition-duration: 300ms;
}
</style>
