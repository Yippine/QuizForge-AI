<script setup>
/**
 * ResourceSubjects Component
 * Formula: ResourceSubjects = SubjectCards + BackNavigation
 * Responsibility: 科目列表頁面 (L2: 科目選擇)
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'

const router = useRouter()
const route = useRoute()
const { certifications, loading, error, loadResourcesMap, getCertificationById } = useResourcesMap()

/**
 * Computed
 */
const certificationId = computed(() => route.params.certificationId)
const certification = computed(() => getCertificationById(certificationId.value))

/**
 * Actions
 */
const selectSubject = (subjectId) => {
  router.push(`/resources/${certificationId.value}/${subjectId}`)
}

const goBack = () => {
  router.push('/resources')
}

/**
 * Lifecycle
 */
onMounted(async () => {
  await loadResourcesMap()
  if (!loading.value && !error.value && !certification.value) {
    // Invalid certification ID, redirect to resources center
    router.push('/resources')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
        <p class="text-gray-600 text-lg">載入科目資料...</p>
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
          返回資源中心
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="certification" class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <button @click="goBack" class="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          返回資源中心
        </button>

        <div class="text-center">
          <div class="inline-flex items-center gap-3 bg-primary-100 text-primary-800 px-6 py-2 rounded-full mb-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span class="font-semibold">{{ certification.name }}</span>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">選擇科目</h1>
          <p class="text-lg text-gray-600">
            {{ certification.description }}
          </p>
        </div>
      </div>

      <!-- Subject Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="subject in certification.subjects"
          :key="subject.id"
          @click="selectSubject(subject.id)"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-secondary-600"
        >
          <div class="flex items-start gap-4 mb-6">
            <div class="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg class="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div class="text-sm text-secondary-600 font-semibold mb-1">{{ subject.code }}</div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ subject.name }}</h2>
              <p class="text-sm text-gray-600">{{ subject.description }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="resource in subject.resources"
              :key="resource.type"
              class="flex items-center gap-3 text-sm"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                   :class="{
                     'bg-blue-100': resource.type === 'handouts',
                     'bg-green-100': resource.type === 'formulas',
                     'bg-purple-100': resource.type === 'diagrams',
                     'bg-orange-100': resource.type === 'exercises'
                   }">
                <svg class="w-5 h-5"
                     :class="{
                       'text-blue-600': resource.type === 'handouts',
                       'text-green-600': resource.type === 'formulas',
                       'text-purple-600': resource.type === 'diagrams',
                       'text-orange-600': resource.type === 'exercises'
                     }"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="resource.type === 'handouts'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  <path v-else-if="resource.type === 'formulas'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  <path v-else-if="resource.type === 'diagrams'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ resource.title }}</div>
                <div class="text-xs text-gray-500">{{ resource.items.length }} 個項目</div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end mt-6">
            <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
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
