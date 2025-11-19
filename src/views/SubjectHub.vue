<script setup>
/**
 * SubjectHub Component (Level 4)
 * Formula: SubjectHub = Breadcrumbs + SubjectHeader + DualEntryCards(Materials + Practice)
 * Responsibility: 科目總覽頁面，提供講義區和題目區雙入口
 */
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'

const router = useRouter()
const route = useRoute()
const { loading, error, loadResourcesMap, getCategoryById, getCertificationByPath, getLevelById } = useResourcesMap()

/**
 * Computed
 */
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)
const subjectId = computed(() => route.params.subjectId)
const ipasCategory = computed(() => getCategoryById('ipas'))
const certification = computed(() => getCertificationByPath('ipas', certificationId.value))
const level = computed(() => getLevelById('ipas', certificationId.value, levelId.value))
const subject = computed(() => level.value?.subjects.find(s => s.id === subjectId.value) || null)

/**
 * Statistics
 */
const _materialCount = computed(() => {
  if (!subject.value) return 0
  return subject.value.resources.reduce((sum, resource) => sum + resource.items.length, 0)
})

const _practiceCount = computed(() => {
  // TODO: In the future, this will fetch from practice/quiz data
  return 0
})

/**
 * Actions
 */
const goToMaterials = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials`)
}

const goToPractice = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/practice`)
}

const goBack = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}`)
}

const goToCertification = () => {
  router.push(`/resources/ipas/${certificationId.value}`)
}

const goToIpas = () => {
  router.push('/resources/ipas')
}

/**
 * Lifecycle
 */
onMounted(async () => {
  await loadResourcesMap()
  if (!loading.value && !error.value && !subject.value) {
    // Invalid subject ID, redirect back
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}`)
  }
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
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
        <p class="text-gray-600 text-lg">
          載入科目資料...
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
          @click="goBack"
        >
          返回科目選擇
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else-if="subject && level && certification && ipasCategory"
      class="max-w-6xl mx-auto"
    >
      <!-- Header -->
      <div class="mb-8">
        <button
          class="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6"
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
          返回科目選擇
        </button>

        <div class="text-center">
          <!-- Breadcrumb -->
          <div class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
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
              @click="goBack"
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
            <span class="font-semibold text-gray-900">{{ subject.code }}</span>
          </div>

          <div class="inline-block bg-accent-100 text-accent-700 px-4 py-2 rounded-lg mb-4">
            <span class="font-bold">{{ subject.code }}</span>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            {{ subject.name }}
          </h1>
          <p class="text-lg text-gray-600">
            {{ subject.description }}
          </p>
        </div>
      </div>

      <!-- Dual Entry Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Materials Entry Card -->
        <div
          class="bg-white rounded-2xl shadow-xl p-10 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-600"
          @click="goToMaterials"
        >
          <div class="text-center">
            <div class="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                class="w-10 h-10 text-blue-600"
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

            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              講義區
            </h2>
            <p class="text-gray-600 mb-6">
              瀏覽學習指引、公式化講義、架構圖等學習資源
            </p>

            <div class="flex items-center justify-center gap-6 mb-6">
              <div
                v-for="resource in subject.resources"
                :key="resource.type"
                class="text-center"
              >
                <div
                  class="text-3xl font-bold"
                  :class="{
                    'text-blue-600': resource.type === 'handouts',
                    'text-green-600': resource.type === 'formulas',
                    'text-purple-600': resource.type === 'diagrams',
                    'text-orange-600': resource.type === 'exercises'
                  }"
                >
                  {{ resource.items.length }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ resource.type === 'handouts' ? '學習指引' : resource.type === 'formulas' ? '公式講義' : resource.type === 'diagrams' ? '架構圖表' : '練習題' }}
                </div>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 text-blue-600 font-semibold">
              <span>進入講義區</span>
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Practice Entry Card -->
        <div
          class="bg-white rounded-2xl shadow-xl p-10 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-600"
          @click="goToPractice"
        >
          <div class="text-center">
            <div class="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                class="w-10 h-10 text-orange-600"
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
            </div>

            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              題目區
            </h2>
            <p class="text-gray-600 mb-6">
              練習題目、模擬測驗，檢驗學習成效
            </p>

            <div class="flex items-center justify-center mb-6">
              <div class="px-6 py-3 bg-orange-50 text-orange-700 rounded-lg">
                <span class="text-sm">即將推出</span>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 text-orange-600 font-semibold">
              <span>前往題目區</span>
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="text-center text-sm text-gray-500">
        <p>Formula-Contract Methodology | Generated with Claude Code</p>
        <p class="mt-1">
          INC-029+030: Hierarchical Navigation (Router + Core UI)
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-300 {
  transition-duration: 300ms;
}

.transform:hover {
  transform: translateY(-4px);
}
</style>
