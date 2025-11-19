<script setup>
/**
 * ResourceList Component
 * Formula: ResourceList = ResourceItems + Filter + Sort + BackNavigation
 * Responsibility: 資源清單頁面 (L4: 資源項目列表)
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'

const router = useRouter()
const route = useRoute()
const { loading, error, loadResourcesMap, getCertificationById, getSubjectById, getResourcesByType, getLevelById } = useResourcesMap()

/**
 * State
 */
const searchQuery = ref('')

/**
 * Computed
 */
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)
const subjectId = computed(() => route.params.subjectId)
const resourceType = computed(() => route.params.resourceType)
const isNewStructure = computed(() => route.name === 'subject-resource-list')

// INC-031: New computed properties for hierarchical breadcrumb
const categoryId = computed(() => isNewStructure.value ? 'ipas' : null)
const level = computed(() => isNewStructure.value ? getLevelById(categoryId.value, certificationId.value, levelId.value) : null)

const certification = computed(() => {
  if (isNewStructure.value) {
    // In new structure, certificationId is 'intermediate' from levelId
    return getCertificationById(levelId.value)
  } else {
    return getCertificationById(certificationId.value)
  }
})

const subject = computed(() => {
  if (isNewStructure.value) {
    // In new structure, use levelId as certificationId for backward compatibility
    return getSubjectById(levelId.value, subjectId.value)
  } else {
    return getSubjectById(certificationId.value, subjectId.value)
  }
})

const resource = computed(() => {
  if (isNewStructure.value) {
    return getResourcesByType(levelId.value, subjectId.value, resourceType.value)
  } else {
    return getResourcesByType(certificationId.value, subjectId.value, resourceType.value)
  }
})

const filteredItems = computed(() => {
  if (!resource.value) return []
  if (!searchQuery.value) return resource.value.items

  const query = searchQuery.value.toLowerCase()
  return resource.value.items.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.id.toLowerCase().includes(query)
  )
})

/**
 * Resource Type Metadata
 */
const resourceTypeMetadata = {
  handouts: {
    title: '學習指引',
    icon: 'document',
    color: 'blue'
  },
  formulas: {
    title: '公式化講義',
    icon: 'calculator',
    color: 'green'
  },
  diagrams: {
    title: '架構圖與流程圖',
    icon: 'chart',
    color: 'purple'
  },
  exercises: {
    title: '練習題',
    icon: 'clipboard',
    color: 'orange'
  }
}

const currentMetadata = computed(() => resourceTypeMetadata[resourceType.value] || {
  title: '學習資源',
  icon: 'document',
  color: 'gray'
})

/**
 * Actions
 */
const selectResource = (resourceId) => {
  if (isNewStructure.value) {
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials/${resourceType.value}/${resourceId}`)
  } else {
    router.push(`/resources/${certificationId.value}/${subjectId.value}/${resourceType.value}/${resourceId}`)
  }
}

const goBack = () => {
  if (isNewStructure.value) {
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials`)
  } else {
    router.push(`/resources/${certificationId.value}/${subjectId.value}`)
  }
}

/**
 * Lifecycle
 */
onMounted(async () => {
  await loadResourcesMap()
  if (!loading.value && !error.value && !resource.value) {
    // Invalid resource type, redirect back
    if (isNewStructure.value) {
      router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials`)
    } else {
      router.push(`/resources/${certificationId.value}/${subjectId.value}`)
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
          載入資源列表...
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
          返回資源類型選擇
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else-if="resource && subject && certification"
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
          返回資源類型選擇
        </button>

        <div class="text-center mb-8">
          <!-- Breadcrumb (INC-031: Conditional rendering based on structure) -->
          <div
            v-if="!isNewStructure"
            class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4 flex-wrap"
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
            <span>{{ subject.name }}</span>
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
            <span class="font-semibold text-gray-900">{{ currentMetadata.title }}</span>
          </div>
          <!-- INC-031: New hierarchical breadcrumb matching ResourceTypes.vue format -->
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
              @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}/${subjectId}`)"
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
              @click="goBack"
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
            <span class="font-semibold text-gray-900">{{ currentMetadata.title }}</span>
          </div>

          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            {{ resource.title }}
          </h1>
          <p class="text-lg text-gray-600">
            {{ resource.description }}
          </p>
        </div>

        <!-- Search Bar -->
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋資源..."
              class="w-full px-6 py-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none text-lg"
            />
            <svg
              class="w-6 h-6 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2"
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
          </div>
          <div class="text-sm text-gray-600 mt-2 text-center">
            找到 {{ filteredItems.length }} 個資源項目
          </div>
        </div>
      </div>

      <!-- Resource Items List -->
      <div class="space-y-4">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-white rounded-xl shadow-md hover:shadow-xl p-6 cursor-pointer transition-all duration-300 border-2 border-transparent"
          :class="{
            'hover:border-blue-500': resourceType === 'handouts',
            'hover:border-green-500': resourceType === 'formulas',
            'hover:border-purple-500': resourceType === 'diagrams',
            'hover:border-orange-500': resourceType === 'exercises'
          }"
          @click="selectResource(item.id)"
        >
          <div class="flex items-center gap-4">
            <!-- Icon -->
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="{
                'bg-blue-100': resourceType === 'handouts',
                'bg-green-100': resourceType === 'formulas',
                'bg-purple-100': resourceType === 'diagrams',
                'bg-orange-100': resourceType === 'exercises'
              }"
            >
              <svg
                class="w-6 h-6"
                :class="{
                  'text-blue-600': resourceType === 'handouts',
                  'text-green-600': resourceType === 'formulas',
                  'text-purple-600': resourceType === 'diagrams',
                  'text-orange-600': resourceType === 'exercises'
                }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  v-if="resourceType === 'handouts'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
                <path
                  v-else-if="resourceType === 'formulas'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
                <path
                  v-else-if="resourceType === 'diagrams'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
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

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-xs font-mono px-2 py-1 rounded"
                  :class="{
                    'bg-blue-100 text-blue-700': resourceType === 'handouts',
                    'bg-green-100 text-green-700': resourceType === 'formulas',
                    'bg-purple-100 text-purple-700': resourceType === 'diagrams',
                    'bg-orange-100 text-orange-700': resourceType === 'exercises'
                  }"
                >
                  {{ item.id }}
                </span>
                <span class="text-xs text-gray-500">{{ item.metadata?.fileType?.toUpperCase() || 'MD' }}</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 truncate">
                {{ item.title }}
              </h3>
              <p
                v-if="item.description"
                class="text-sm text-gray-600 mt-1"
              >
                {{ item.description }}
              </p>
            </div>

            <!-- Arrow -->
            <svg
              class="w-6 h-6 flex-shrink-0"
              :class="{
                'text-blue-600': resourceType === 'handouts',
                'text-green-600': resourceType === 'formulas',
                'text-purple-600': resourceType === 'diagrams',
                'text-orange-600': resourceType === 'exercises'
              }"
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

        <!-- Empty State -->
        <div
          v-if="filteredItems.length === 0"
          class="text-center py-12"
        >
          <svg
            class="w-16 h-16 text-gray-400 mx-auto mb-4"
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
          <p class="text-gray-600 text-lg">
            沒有找到符合的資源
          </p>
          <button
            class="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
            @click="searchQuery = ''"
          >
            清除搜尋
          </button>
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
</style>
