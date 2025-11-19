<script setup>
/**
 * CertificationView Component (Level 2)
 * Formula: CertificationView = Breadcrumbs + CertificationIntro + LevelCards
 * Responsibility: 認證詳情頁面，展示等級選項
 */
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'

const router = useRouter()
const route = useRoute()
const { loading, error, loadResourcesMap, getCategoryById, getCertificationByPath } = useResourcesMap()

/**
 * Computed
 */
const certificationId = computed(() => route.params.certificationId)
const ipasCategory = computed(() => getCategoryById('ipas'))
const certification = computed(() => getCertificationByPath('ipas', certificationId.value))

/**
 * Actions
 */
const selectLevel = (levelId) => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId}`)
}

const goBack = () => {
  router.push('/resources/ipas')
}

/**
 * Lifecycle
 */
onMounted(async () => {
  await loadResourcesMap()
  if (!loading.value && !error.value && !certification.value) {
    // Invalid certification ID, redirect back
    router.push('/resources/ipas')
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
          載入認證資料...
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
          返回 iPAS 總覽
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else-if="certification && ipasCategory"
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
          返回 iPAS 總覽
        </button>

        <div class="text-center">
          <!-- Breadcrumb -->
          <div class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
            <span
              class="hover:text-primary-600 cursor-pointer"
              @click="goBack"
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
            <span class="font-semibold text-gray-900">{{ certification.name }}</span>
          </div>

          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            {{ certification.name }}
          </h1>
          <p class="text-lg text-gray-600">
            {{ certification.description }}
          </p>
        </div>
      </div>

      <!-- Level Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div
          v-for="level in certification.levels"
          :key="level.id"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-secondary-600"
          @click="selectLevel(level.id)"
        >
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center">
              <svg
                class="w-8 h-8 text-secondary-600"
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
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ level.name }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ level.description }}
              </p>
            </div>
          </div>

          <p class="text-gray-600 mb-6">
            涵蓋 {{ level.subjects.length }} 個核心科目，提供完整的學習資源與練習題庫
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="px-4 py-2 bg-secondary-50 text-secondary-700 rounded-lg">
                <span class="text-2xl font-bold">{{ level.subjects.length }}</span>
                <span class="text-sm ml-1">科目</span>
              </div>
              <div class="px-4 py-2 bg-accent-50 text-accent-700 rounded-lg">
                <span class="text-2xl font-bold">{{ level.subjects.reduce((sum, subject) => sum + subject.resources.reduce((rSum, r) => rSum + r.items.length, 0), 0) }}</span>
                <span class="text-sm ml-1">資源</span>
              </div>
            </div>
            <svg
              class="w-6 h-6 text-secondary-600"
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
