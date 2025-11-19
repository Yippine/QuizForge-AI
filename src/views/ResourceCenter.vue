<script setup>
/**
 * @deprecated This component is deprecated since INC-036.
 * Use IpasOverview.vue instead. Route /resources now redirects to /resources/ipas.
 * This file is kept for reference and will be removed in a future cleanup.
 *
 * ResourceCenter Component
 * Formula: ResourceCenter = CertificationCards + NavigationLinks
 * Responsibility: 學習資源中心主頁 (L1: 認證等級選擇)
 */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'

const router = useRouter()
const { certifications, loading, error, loadResourcesMap } = useResourcesMap()

/**
 * Actions
 */
const selectCertification = (certificationId) => {
  router.push(`/resources/${certificationId}`)
}

const goBack = () => {
  router.push('/')
}

/**
 * Lifecycle
 */
onMounted(async () => {
  await loadResourcesMap()
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
          載入學習資源...
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
          返回主頁
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else
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
          返回主頁
        </button>

        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            學習資源中心
          </h1>
          <p class="text-lg text-gray-600">
            選擇認證等級，開始探索系統化的學習資源
          </p>
        </div>
      </div>

      <!-- Certification Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="cert in certifications"
          :key="cert.id"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-600"
          @click="selectCertification(cert.id)"
        >
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg
                class="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ cert.name }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ cert.id === 'intermediate' ? 'Intermediate' : 'Elementary' }}
              </p>
            </div>
          </div>

          <p class="text-gray-600 mb-6">
            {{ cert.description }}
          </p>

          <div class="space-y-3">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg
                class="w-5 h-5 text-primary-600"
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
              <span>{{ cert.subjects.length }} 個科目</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg
                class="w-5 h-5 text-secondary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              <span>多種學習資源類型</span>
            </div>
          </div>

          <div class="flex items-center justify-end mt-6">
            <svg
              class="w-6 h-6 text-primary-600"
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

      <!-- Info Section -->
      <div class="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <svg
            class="w-6 h-6 text-blue-600 flex-shrink-0 mt-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-blue-900 mb-2">
              學習資源說明
            </h3>
            <p class="text-blue-800 mb-2">
              學習資源中心提供完整的考試準備材料，包括：
            </p>
            <ul class="list-disc list-inside text-blue-800 space-y-1">
              <li>官方學習指引與教材</li>
              <li>系統化公式內容</li>
              <li>視覺化架構圖與流程圖</li>
              <li>未來將新增練習題與模擬試卷</li>
            </ul>
          </div>
        </div>
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
