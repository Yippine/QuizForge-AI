<script setup>
/**
 * GlossaryDetail Page
 * Formula: GlossaryDetail = (RouteFetch -> TermData) x DetailDisplay x RelatedNavigation
 * Responsibility: Display detailed information for a glossary term
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// State
const currentTerm = ref(null)
const allTerms = ref([])
const loading = ref(true)
const error = ref(null)

// Computed: Route params
const termId = computed(() => route.params.termId)
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)
const subjectId = computed(() => route.params.subjectId)

/**
 * Related terms with full data
 * Formula: RelatedNavigation = related[].map(id => TermData)
 */
const relatedTermsData = computed(() => {
  if (!currentTerm.value || !allTerms.value.length) return []

  return currentTerm.value.related
    .map(id => allTerms.value.find(t => t.id === id))
    .filter(Boolean)
})

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
 * DataFetch: Load glossary data and find current term
 * Formula: fetch(glossary.json) -> terms[] -> find(termId)
 */
const loadTermData = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await fetch('/knowledge-base/ipas/ai-planning/intermediate/glossary.json')

    if (!response.ok) {
      throw new Error(`Failed to load glossary data: ${response.status}`)
    }

    const data = await response.json()
    allTerms.value = data.terms || []

    // Find current term
    currentTerm.value = allTerms.value.find(t => t.id === termId.value)

    if (!currentTerm.value) {
      throw new Error(`Term not found: ${termId.value}`)
    }
  } catch (err) {
    console.error('Error loading term:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

/**
 * Navigation Actions
 */
const goToGlossaryList = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials/glossary`)
}

const goToRelatedTerm = (relatedTermId) => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials/glossary/${relatedTermId}`)
}

const goToMaterials = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials`)
}

const goToSubjectHub = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}`)
}

/**
 * Lifecycle and Watchers
 */
onMounted(() => {
  loadTermData()
})

// Watch for route changes (when navigating between related terms)
watch(termId, () => {
  loadTermData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mb-4"></div>
        <p class="text-gray-600 text-lg">
          載入術語詳情...
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="max-w-2xl mx-auto"
    >
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
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
          @click="goToGlossaryList"
        >
          返回術語表
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else-if="currentTerm"
      class="max-w-4xl mx-auto"
    >
      <!-- Navigation Header -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-4">
          <button
            class="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
            @click="goToGlossaryList"
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
            返回術語表
          </button>
        </div>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <span
            class="hover:text-teal-600 cursor-pointer"
            @click="() => router.push('/resources/ipas')"
          >iPAS</span>
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
            class="hover:text-teal-600 cursor-pointer"
            @click="() => router.push(`/resources/ipas/${certificationId}`)"
          >{{ certificationId === 'ai-planning' ? 'AI 應用規劃師' : certificationId }}</span>
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
            class="hover:text-teal-600 cursor-pointer"
            @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}`)"
          >{{ levelId }}</span>
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
            class="hover:text-teal-600 cursor-pointer"
            @click="goToSubjectHub"
          >{{ subjectId }}</span>
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
            class="hover:text-teal-600 cursor-pointer"
            @click="goToMaterials"
          >講義區</span>
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
            class="hover:text-teal-600 cursor-pointer"
            @click="goToGlossaryList"
          >術語表</span>
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
          <span class="font-semibold text-gray-900">{{ currentTerm.term }}</span>
        </div>
      </div>

      <!-- Term Detail Card -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6">
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-3xl font-bold text-white mb-2">
                {{ currentTerm.term }}
              </h1>
              <p class="text-teal-100 text-lg">
                {{ currentTerm.english }}
              </p>
            </div>
            <span
              class="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white"
            >
              {{ currentTerm.category }}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8">
          <!-- Definition -->
          <div class="mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                class="w-6 h-6 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              定義
            </h2>
            <p class="text-gray-700 leading-relaxed text-lg">
              {{ currentTerm.definition }}
            </p>
          </div>

          <!-- Examples -->
          <div
            v-if="currentTerm.examples && currentTerm.examples.length"
            class="mb-8"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                class="w-6 h-6 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              範例
            </h2>
            <ul class="space-y-2">
              <li
                v-for="(example, index) in currentTerm.examples"
                :key="index"
                class="flex items-start gap-3"
              >
                <span class="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {{ index + 1 }}
                </span>
                <span class="text-gray-700">{{ example }}</span>
              </li>
            </ul>
          </div>

          <!-- Related Terms -->
          <div v-if="relatedTermsData.length">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                class="w-6 h-6 text-teal-600"
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
              相關術語
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="relatedTerm in relatedTermsData"
                :key="relatedTerm.id"
                class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors text-left group"
                @click="goToRelatedTerm(relatedTerm.id)"
              >
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  :class="{
                    'bg-blue-100': getCategoryColor(relatedTerm.category) === 'blue',
                    'bg-green-100': getCategoryColor(relatedTerm.category) === 'green',
                    'bg-purple-100': getCategoryColor(relatedTerm.category) === 'purple',
                    'bg-orange-100': getCategoryColor(relatedTerm.category) === 'orange',
                    'bg-gray-100': getCategoryColor(relatedTerm.category) === 'gray'
                  }"
                >
                  <svg
                    class="w-5 h-5"
                    :class="{
                      'text-blue-600': getCategoryColor(relatedTerm.category) === 'blue',
                      'text-green-600': getCategoryColor(relatedTerm.category) === 'green',
                      'text-purple-600': getCategoryColor(relatedTerm.category) === 'purple',
                      'text-orange-600': getCategoryColor(relatedTerm.category) === 'orange',
                      'text-gray-600': getCategoryColor(relatedTerm.category) === 'gray'
                    }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div class="flex-grow min-w-0">
                  <h4 class="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors truncate">
                    {{ relatedTerm.term }}
                  </h4>
                  <p class="text-sm text-gray-500 truncate">
                    {{ relatedTerm.english }}
                  </p>
                </div>
                <svg
                  class="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0"
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
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-8 py-4 flex justify-between items-center">
          <button
            class="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
            @click="goToGlossaryList"
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
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            查看所有術語
          </button>
          <span class="text-sm text-gray-400">ID: {{ currentTerm.id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
