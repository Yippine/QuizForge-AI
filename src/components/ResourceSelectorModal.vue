<script setup>
/**
 * ResourceSelectorModal Component
 * Formula: ResourceSelectorModal = ModalContainer + HierarchicalNavigation + NavigationState + SelectionHandler
 * INC-033-v2: HomePage Integration with Modal-Based Resource Selection
 * Responsibility: 4-step hierarchical navigation modal for resource selection
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useResourcesMap } from '../composables/useResourcesMap'

/**
 * Props & Emits
 */
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialPath: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

/**
 * Composables
 */
const {
  categories,
  loading,
  error,
  loadResourcesMap,
  getCategoryById,
  getCertificationByPath,
  getLevelById
} = useResourcesMap()

/**
 * State
 * Formula: NavigationState = { currentStep, selectedPath, breadcrumbs }
 */
const currentStep = ref(1)
const selectedPath = ref({
  categoryId: null,
  certificationId: null,
  levelId: null,
  subjectId: null
})

/**
 * Computed
 */
// Current category data
const currentCategory = computed(() => {
  if (!selectedPath.value.categoryId) return null
  return getCategoryById(selectedPath.value.categoryId)
})

// Current certification data
const currentCertification = computed(() => {
  if (!selectedPath.value.categoryId || !selectedPath.value.certificationId) return null
  return getCertificationByPath(selectedPath.value.categoryId, selectedPath.value.certificationId)
})

// Current level data
const currentLevel = computed(() => {
  if (!selectedPath.value.categoryId || !selectedPath.value.certificationId || !selectedPath.value.levelId) return null
  return getLevelById(selectedPath.value.categoryId, selectedPath.value.certificationId, selectedPath.value.levelId)
})

// Items to display for current step
const currentItems = computed(() => {
  switch (currentStep.value) {
    case 1:
      return categories.value || []
    case 2:
      return currentCategory.value?.certifications || []
    case 3:
      return currentCertification.value?.levels || []
    case 4:
      return currentLevel.value?.subjects || []
    default:
      return []
  }
})

// Step titles
const stepTitle = computed(() => {
  const titles = {
    1: '選擇分類',
    2: '選擇認證',
    3: '選擇等級',
    4: '選擇科目'
  }
  return titles[currentStep.value] || ''
})

// Breadcrumb trail
const breadcrumbs = computed(() => {
  const trail = []

  if (selectedPath.value.categoryId && currentCategory.value) {
    trail.push({
      step: 1,
      id: selectedPath.value.categoryId,
      name: currentCategory.value.name
    })
  }

  if (selectedPath.value.certificationId && currentCertification.value) {
    trail.push({
      step: 2,
      id: selectedPath.value.certificationId,
      name: currentCertification.value.name
    })
  }

  if (selectedPath.value.levelId && currentLevel.value) {
    trail.push({
      step: 3,
      id: selectedPath.value.levelId,
      name: currentLevel.value.name
    })
  }

  return trail
})

/**
 * Actions
 */
// Close modal
const closeModal = () => {
  emit('update:modelValue', false)
}

// Handle backdrop click
const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

// Go back one step
const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--

    // Clear selection for current and subsequent steps
    switch (currentStep.value) {
      case 1:
        selectedPath.value.categoryId = null
        selectedPath.value.certificationId = null
        selectedPath.value.levelId = null
        selectedPath.value.subjectId = null
        break
      case 2:
        selectedPath.value.certificationId = null
        selectedPath.value.levelId = null
        selectedPath.value.subjectId = null
        break
      case 3:
        selectedPath.value.levelId = null
        selectedPath.value.subjectId = null
        break
    }
  }
}

// Navigate to specific breadcrumb step
const goToStep = (step) => {
  if (step < currentStep.value) {
    currentStep.value = step

    // Clear selections for subsequent steps
    if (step <= 1) {
      selectedPath.value.categoryId = null
      selectedPath.value.certificationId = null
      selectedPath.value.levelId = null
      selectedPath.value.subjectId = null
    } else if (step <= 2) {
      selectedPath.value.certificationId = null
      selectedPath.value.levelId = null
      selectedPath.value.subjectId = null
    } else if (step <= 3) {
      selectedPath.value.levelId = null
      selectedPath.value.subjectId = null
    }
  }
}

// Handle item selection
const handleSelect = (item) => {
  switch (currentStep.value) {
    case 1:
      selectedPath.value.categoryId = item.id
      currentStep.value = 2
      break
    case 2:
      selectedPath.value.certificationId = item.id
      currentStep.value = 3
      break
    case 3:
      selectedPath.value.levelId = item.id
      currentStep.value = 4
      break
    case 4:
      selectedPath.value.subjectId = item.id
      completeSelection()
      break
  }
}

// Complete selection and emit result
const completeSelection = () => {
  const fullPath = {
    categoryId: selectedPath.value.categoryId,
    certificationId: selectedPath.value.certificationId,
    levelId: selectedPath.value.levelId,
    subjectId: selectedPath.value.subjectId
  }

  emit('select', fullPath)
  closeModal()
}

// Reset modal state
const resetState = () => {
  currentStep.value = 1
  selectedPath.value = {
    categoryId: null,
    certificationId: null,
    levelId: null,
    subjectId: null
  }
}

// Initialize with initial path if provided
const initializeWithPath = () => {
  if (props.initialPath) {
    selectedPath.value = { ...props.initialPath }
    // Determine which step to show based on what's selected
    if (props.initialPath.levelId) {
      currentStep.value = 4
    } else if (props.initialPath.certificationId) {
      currentStep.value = 3
    } else if (props.initialPath.categoryId) {
      currentStep.value = 2
    }
  }
}

/**
 * Watchers
 */
// Reset when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadResourcesMap()
    if (props.initialPath) {
      initializeWithPath()
    } else {
      resetState()
    }
  }
})

/**
 * Lifecycle
 */
onMounted(() => {
  loadResourcesMap()
})

/**
 * Helper functions for UI
 */
const getItemIcon = (step) => {
  const icons = {
    1: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    2: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    3: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    4: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  }
  return icons[step] || icons[1]
}

const getStepColor = (step) => {
  const colors = {
    1: { bg: 'bg-primary-100', text: 'text-primary-600', border: 'hover:border-primary-600' },
    2: { bg: 'bg-secondary-100', text: 'text-secondary-600', border: 'hover:border-secondary-600' },
    3: { bg: 'bg-accent-100', text: 'text-accent-600', border: 'hover:border-accent-600' },
    4: { bg: 'bg-green-100', text: 'text-green-600', border: 'hover:border-green-600' }
  }
  return colors[step] || colors[1]
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4"
        @click="handleBackdropClick"
      >
        <!-- Modal Container -->
        <div
          class="bg-white w-full h-full md:h-auto md:max-h-[80vh] md:max-w-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
            <div class="flex items-center gap-3">
              <!-- Back Button -->
              <button
                v-if="currentStep > 1"
                @click="goBack"
                class="p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
              >
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ stepTitle }}</h2>
                <p class="text-sm text-gray-500">步驟 {{ currentStep }} / 4</p>
              </div>
            </div>

            <!-- Close Button -->
            <button
              @click="closeModal"
              class="p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
            >
              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Breadcrumbs -->
          <div v-if="breadcrumbs.length > 0" class="px-4 md:px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div class="flex items-center gap-2 text-sm overflow-x-auto">
              <button
                @click="goToStep(1)"
                class="text-gray-500 hover:text-primary-600 transition-colors whitespace-nowrap"
              >
                首頁
              </button>
              <template v-for="(crumb, index) in breadcrumbs" :key="crumb.step">
                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <button
                  @click="goToStep(crumb.step + 1)"
                  class="transition-colors whitespace-nowrap"
                  :class="index === breadcrumbs.length - 1 ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-primary-600'"
                >
                  {{ crumb.name }}
                </button>
              </template>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4 md:p-6">
            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-12">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mb-4"></div>
                <p class="text-gray-600">載入中...</p>
              </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-12">
              <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-lg font-bold text-gray-900 mb-2">載入失敗</h3>
              <p class="text-gray-600">{{ error }}</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="currentItems.length === 0" class="text-center py-12">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 class="text-lg font-bold text-gray-900 mb-2">沒有可用項目</h3>
              <p class="text-gray-600">此分類下暫無內容</p>
            </div>

            <!-- Items Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="item in currentItems"
                :key="item.id"
                @click="handleSelect(item)"
                class="bg-white rounded-xl shadow-md p-4 md:p-6 cursor-pointer transform hover:scale-102 hover:shadow-lg transition-all duration-200 border-2 border-gray-200"
                :class="getStepColor(currentStep).border"
              >
                <div class="flex items-start gap-4">
                  <!-- Icon -->
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    :class="getStepColor(currentStep).bg"
                  >
                    <svg
                      class="w-6 h-6"
                      :class="getStepColor(currentStep).text"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getItemIcon(currentStep)" />
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        v-if="item.code"
                        class="text-xs font-semibold px-2 py-1 rounded"
                        :class="`${getStepColor(currentStep).bg} ${getStepColor(currentStep).text}`"
                      >
                        {{ item.code }}
                      </span>
                      <h3 class="text-lg font-bold text-gray-900 truncate">{{ item.name }}</h3>
                    </div>
                    <p v-if="item.description" class="text-sm text-gray-600 line-clamp-2">
                      {{ item.description }}
                    </p>

                    <!-- Stats for levels and subjects -->
                    <div v-if="item.levels || item.subjects || item.resources" class="flex items-center gap-3 mt-3">
                      <div
                        v-if="item.levels"
                        class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                      >
                        <span class="font-bold">{{ item.levels.length }}</span> 等級
                      </div>
                      <div
                        v-if="item.subjects"
                        class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                      >
                        <span class="font-bold">{{ item.subjects.length }}</span> 科目
                      </div>
                      <div
                        v-if="item.certifications"
                        class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                      >
                        <span class="font-bold">{{ item.certifications.length }}</span> 認證
                      </div>
                      <div
                        v-if="item.resources"
                        class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                      >
                        <span class="font-bold">{{ item.resources.reduce((sum, r) => sum + r.items.length, 0) }}</span> 資源
                      </div>
                    </div>
                  </div>

                  <!-- Arrow -->
                  <svg
                    class="w-5 h-5 flex-shrink-0"
                    :class="getStepColor(currentStep).text"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-500">
                選擇完成後將自動儲存您的學習進度
              </p>
              <button
                @click="closeModal"
                class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}

/* Subtle scale for cards */
.hover\:scale-102:hover {
  transform: scale(1.02);
}

/* Line clamp for descriptions */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
