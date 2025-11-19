<script setup>
/**
 * ResourceTypes Component
 * Formula: ResourceTypes = ResourceTypeCards + BackNavigation
 * Responsibility: 資源類型頁面 (L3: 資源類型選擇)
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'

const router = useRouter()
const route = useRoute()
const { loading, error, loadResourcesMap, getCertificationById, getSubjectById, getLevelById } = useResourcesMap()

/**
 * Computed
 * Support both old structure (/resources/:certId/:subjId) and new structure (/resources/ipas/:certId/:levelId/:subjId/materials)
 */
const isNewStructure = computed(() => route.name === 'subject-materials')
const categoryId = computed(() => isNewStructure.value ? 'ipas' : null)
const certificationId = computed(() => isNewStructure.value ? route.params.certificationId : route.params.certificationId)
const levelId = computed(() => isNewStructure.value ? route.params.levelId : null)
const subjectId = computed(() => route.params.subjectId)

// Get data based on structure
const level = computed(() => isNewStructure.value ? getLevelById(categoryId.value, certificationId.value, levelId.value) : null)
const subject = computed(() => {
  if (isNewStructure.value) {
    return level.value?.subjects.find(s => s.id === subjectId.value) || null
  } else {
    return getSubjectById(certificationId.value, subjectId.value)
  }
})
const certification = computed(() => {
  if (isNewStructure.value) {
    // For new structure, we don't need certification object
    return { name: certificationId.value }
  } else {
    return getCertificationById(certificationId.value)
  }
})

/**
 * Resource Type Metadata
 */
const resourceTypeMetadata = {
  handouts: {
    title: '學習指引',
    description: '官方學習指引與教材',
    icon: 'document',
    color: 'blue'
  },
  formulas: {
    title: '公式化講義',
    description: '系統化公式內容',
    icon: 'calculator',
    color: 'green'
  },
  diagrams: {
    title: '架構圖與流程圖',
    description: '視覺化學習資源',
    icon: 'chart',
    color: 'purple'
  },
  exercises: {
    title: '練習題',
    description: '主題練習與模擬試卷',
    icon: 'clipboard',
    color: 'orange'
  },
  glossary: {
    title: '專業術語表',
    description: '術語查詢與定義',
    icon: 'book',
    color: 'teal'
  }
}

/**
 * Glossary data state
 */
const glossaryTermCount = ref(0)

/**
 * Load glossary count
 */
const loadGlossaryCount = async () => {
  try {
    const response = await fetch('/knowledge-base/ipas/ai-planning/intermediate/glossary.json')
    if (response.ok) {
      const data = await response.json()
      glossaryTermCount.value = data.terms?.length || 0
    }
  } catch (err) {
    console.error('Error loading glossary count:', err)
  }
}

/**
 * Navigate to glossary
 */
const goToGlossary = () => {
  if (isNewStructure.value) {
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials/glossary`)
  }
}

/**
 * Actions
 */
const selectResourceType = (resourceType) => {
  if (isNewStructure.value) {
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials/${resourceType}`)
  } else {
    router.push(`/resources/${certificationId.value}/${subjectId.value}/${resourceType}`)
  }
}

const goToHome = () => {
  router.push('/')
}

const goToSubjectHub = () => {
  if (isNewStructure.value) {
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}`)
  } else {
    router.push(`/resources/${certificationId.value}`)
  }
}

/**
 * Lifecycle
 */
onMounted(async () => {
  await loadResourcesMap()
  if (isNewStructure.value) {
    await loadGlossaryCount()
  }
  if (!loading.value && !error.value && !subject.value) {
    // Invalid subject ID, redirect back
    if (isNewStructure.value) {
      router.push(`/resources/ipas/${certificationId.value}/${levelId.value}`)
    } else {
      router.push(`/resources/${certificationId.value}`)
    }
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
          載入資源類型...
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
          @click="goToSubjectHub"
        >
          返回科目選擇
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else-if="subject && certification"
      class="max-w-6xl mx-auto"
    >
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-6">
          <button
            v-if="isNewStructure"
            class="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            @click="goToHome"
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
            返回首頁
          </button>
          <span
            v-if="isNewStructure"
            class="text-gray-300"
          >|</span>
          <button
            class="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors text-sm"
            @click="goToSubjectHub"
          >
            <svg
              v-if="!isNewStructure"
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
            {{ isNewStructure ? '返回科目總覽' : '返回科目選擇' }}
          </button>
        </div>

        <div class="text-center">
          <!-- Breadcrumb (conditional based on structure) -->
          <div
            v-if="!isNewStructure"
            class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4"
          >
            <span>{{ certification.name }}</span>
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
            <span class="font-semibold text-gray-900">{{ subject.name }}</span>
          </div>
          <div
            v-else
            class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4 flex-wrap"
          >
            <span
              class="hover:text-primary-600 cursor-pointer"
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
              class="hover:text-primary-600 cursor-pointer"
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
              class="hover:text-primary-600 cursor-pointer"
              @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}`)"
            >{{ level?.name || levelId }}</span>
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
            <span class="font-semibold text-gray-900">講義區</span>
          </div>

          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            {{ isNewStructure ? '講義資源' : '選擇資源類型' }}
          </h1>
          <p class="text-lg text-gray-600">
            {{ subject.description }}
          </p>
        </div>
      </div>

      <!-- Resource Type Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="resource in subject.resources"
          :key="resource.type"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent"
          :class="{
            'hover:border-blue-600': resource.type === 'handouts',
            'hover:border-green-600': resource.type === 'formulas',
            'hover:border-purple-600': resource.type === 'diagrams',
            'hover:border-orange-600': resource.type === 'exercises',
            'hover:border-teal-600': resource.type === 'glossary'
          }"
          @click="selectResourceType(resource.type)"
        >
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-16 h-16 rounded-xl flex items-center justify-center"
              :class="{
                'bg-blue-100': resource.type === 'handouts',
                'bg-green-100': resource.type === 'formulas',
                'bg-purple-100': resource.type === 'diagrams',
                'bg-orange-100': resource.type === 'exercises',
                'bg-teal-100': resource.type === 'glossary'
              }"
            >
              <svg
                class="w-8 h-8"
                :class="{
                  'text-blue-600': resource.type === 'handouts',
                  'text-green-600': resource.type === 'formulas',
                  'text-purple-600': resource.type === 'diagrams',
                  'text-orange-600': resource.type === 'exercises',
                  'text-teal-600': resource.type === 'glossary'
                }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  v-if="resource.type === 'handouts'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
                <path
                  v-else-if="resource.type === 'formulas'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
                <path
                  v-else-if="resource.type === 'diagrams'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
                />
                <path
                  v-else-if="resource.type === 'glossary'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ resource.title }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ resourceTypeMetadata[resource.type]?.description || resource.description }}
              </p>
            </div>
          </div>

          <p class="text-gray-600 mb-6">
            {{ resource.description }}
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="px-4 py-2 rounded-lg"
                :class="{
                  'bg-blue-50 text-blue-700': resource.type === 'handouts',
                  'bg-green-50 text-green-700': resource.type === 'formulas',
                  'bg-purple-50 text-purple-700': resource.type === 'diagrams',
                  'bg-orange-50 text-orange-700': resource.type === 'exercises',
                  'bg-teal-50 text-teal-700': resource.type === 'glossary'
                }"
              >
                <span class="text-2xl font-bold">{{ resource.items.length }}</span>
                <span class="text-sm ml-1">項目</span>
              </div>
            </div>
            <svg
              class="w-6 h-6"
              :class="{
                'text-blue-600': resource.type === 'handouts',
                'text-green-600': resource.type === 'formulas',
                'text-purple-600': resource.type === 'diagrams',
                'text-orange-600': resource.type === 'exercises',
                'text-teal-600': resource.type === 'glossary'
              }"
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

        <!-- Glossary Card (INC-035) -->
        <div
          v-if="isNewStructure && glossaryTermCount > 0"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-teal-600"
          @click="goToGlossary"
        >
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 rounded-xl flex items-center justify-center bg-teal-100">
              <svg
                class="w-8 h-8 text-teal-600"
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
                專業術語表
              </h2>
              <p class="text-sm text-gray-500">
                術語查詢與定義
              </p>
            </div>
          </div>

          <p class="text-gray-600 mb-6">
            AI 相關專業術語的定義、範例與相關概念連結，支援搜尋和排序功能
          </p>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="px-4 py-2 rounded-lg bg-teal-50 text-teal-700">
                <span class="text-2xl font-bold">{{ glossaryTermCount }}</span>
                <span class="text-sm ml-1">術語</span>
              </div>
            </div>
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
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
