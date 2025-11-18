<script setup>
/**
 * IpasOverview Component (Level 1)
 * Formula: IpasOverview = CategoryIntro + CertificationCards
 * Responsibility: iPAS 能力鑑定總覽頁面，展示所有認證選項
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'

const router = useRouter()
const { loading, error, loadResourcesMap, getCategoryById } = useResourcesMap()

/**
 * Computed
 */
const ipasCategory = computed(() => getCategoryById('ipas'))

/**
 * Actions
 */
const selectCertification = (certificationId) => {
  router.push(`/resources/ipas/${certificationId}`)
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
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
        <p class="text-gray-600 text-lg">載入中...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-2xl mx-auto">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-xl font-bold text-red-900 mb-2">載入失敗</h3>
        <p class="text-red-700 mb-4">{{ error }}</p>
        <button @click="() => router.push('/')" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
          返回首頁
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="ipasCategory" class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">{{ ipasCategory.name }}</h1>
        <p class="text-xl text-gray-600">{{ ipasCategory.description }}</p>
      </div>

      <!-- Certification Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="certification in ipasCategory.certifications"
          :key="certification.id"
          @click="selectCertification(certification.id)"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-600"
        >
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">{{ certification.name }}</h2>
              <p class="text-sm text-gray-500">{{ certification.description }}</p>
            </div>
          </div>

          <p class="text-gray-600 mb-6">
            提供完整的學習路徑，涵蓋多個等級與科目，助您掌握人工智慧應用規劃的核心能力
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg">
                <span class="text-2xl font-bold">{{ certification.levels.length }}</span>
                <span class="text-sm ml-1">等級</span>
              </div>
              <div class="px-4 py-2 bg-accent-50 text-accent-700 rounded-lg">
                <span class="text-2xl font-bold">{{ certification.levels.reduce((sum, level) => sum + level.subjects.length, 0) }}</span>
                <span class="text-sm ml-1">科目</span>
              </div>
            </div>
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-12 text-center text-sm text-gray-500">
        <p>Formula-Contract Methodology | Generated with Claude Code</p>
        <p class="mt-1">INC-029+030: Hierarchical Navigation (Router + Core UI)</p>
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
