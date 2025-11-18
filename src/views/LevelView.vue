<script setup>
/**
 * LevelView Component (Level 3)
 * Formula: LevelView = Breadcrumbs + LevelIntro + SubjectCards
 * Responsibility: 等級詳情頁面，展示科目清單
 */
import { ref, computed, onMounted } from 'vue'
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
const ipasCategory = computed(() => getCategoryById('ipas'))
const certification = computed(() => getCertificationByPath('ipas', certificationId.value))
const level = computed(() => getLevelById('ipas', certificationId.value, levelId.value))

/**
 * Actions
 */
const selectSubject = (subjectId) => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId}`)
}

const goBack = () => {
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
  if (!loading.value && !error.value && !level.value) {
    // Invalid level ID, redirect back
    router.push(`/resources/ipas/${certificationId.value}`)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
        <p class="text-gray-600 text-lg">載入等級資料...</p>
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
        <button @click="goBack" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
          返回認證選擇
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="level && certification && ipasCategory" class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <button @click="goBack" class="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回等級選擇
        </button>

        <div class="text-center">
          <!-- Breadcrumb -->
          <div class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
            <span class="hover:text-primary-600 cursor-pointer" @click="goToIpas">{{ ipasCategory.name }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="hover:text-primary-600 cursor-pointer" @click="goBack">{{ certification.name }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="font-semibold text-gray-900">{{ level.name }}</span>
          </div>

          <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ level.name }}</h1>
          <p class="text-lg text-gray-600">{{ level.description }}</p>
        </div>
      </div>

      <!-- Subject Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div
          v-for="subject in level.subjects"
          :key="subject.id"
          @click="selectSubject(subject.id)"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-accent-600"
        >
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 bg-accent-100 rounded-xl flex items-center justify-center">
              <svg class="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-accent-600 bg-accent-50 px-2 py-1 rounded">{{ subject.code }}</span>
                <h2 class="text-xl font-bold text-gray-900">{{ subject.name }}</h2>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ subject.description }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between mt-6">
            <div class="flex items-center gap-3">
              <div
                v-for="resource in subject.resources"
                :key="resource.type"
                class="px-3 py-2 rounded-lg text-sm"
                :class="{
                  'bg-blue-50 text-blue-700': resource.type === 'handouts',
                  'bg-green-50 text-green-700': resource.type === 'formulas',
                  'bg-purple-50 text-purple-700': resource.type === 'diagrams',
                  'bg-orange-50 text-orange-700': resource.type === 'exercises'
                }"
              >
                <span class="font-bold">{{ resource.items.length }}</span>
                <span class="ml-1">{{ resource.type === 'handouts' ? '指引' : resource.type === 'formulas' ? '公式' : resource.type === 'diagrams' ? '圖表' : '練習' }}</span>
              </div>
            </div>
            <svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="text-center text-sm text-gray-500">
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
