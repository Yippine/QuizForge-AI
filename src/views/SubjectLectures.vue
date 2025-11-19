<script setup>
/**
 * SubjectLectures Component
 * Formula: SubjectLectures = VueComponent × DynamicRouter × FileLoader × DataParser × UIRenderer × NavigationFlow
 * Formula: VueComponent = ScriptSetup + Template + Style
 * Responsibility: 顯示特定科目下的所有講義卡片，支援響應式佈局和導航功能
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

/**
 * Reactive State
 * Formula: State = subjectId + lectures + loading + error
 */
const subjectId = ref(route.params.subjectId)
const lectures = ref([])
const loading = ref(true)
const error = ref(null)

/**
 * Computed Properties
 * Formula: subjectName = (subjectId == 'L21') ? '科目 1 - AI 應用規劃' : '科目 3 - AI 核心技術'
 * Formula: subjectColor = (subjectId == 'L21') ? 'blue' : 'purple'
 */
const subjectName = computed(() => {
  return subjectId.value === 'L21'
    ? '科目 1 - AI 應用規劃'
    : '科目 3 - AI 核心技術'
})

const subjectColor = computed(() => {
  return subjectId.value === 'L21' ? 'blue' : 'purple'
})

const colorClasses = computed(() => {
  const color = subjectColor.value
  return {
    primary: `${color}-600`,
    bg: `${color}-100`,
    text: `${color}-700`,
    hover: `${color}-600`,
    border: `${color}-600`
  }
})

/**
 * Data Parser
 * Formula: DataParser = FilenameExtraction + TitleParsing + ChapterNumbering
 * Formula: parseLectureName(path) -> {id, title, path, subject}
 */
const parseLectureName = (filePath) => {
  // Extract filename from path
  const fileName = filePath.split('/').pop()

  // Extract chapter ID (first 6 characters before -)
  const chapterId = fileName.substring(0, fileName.indexOf('-'))

  // Extract title (between - and .md)
  const title = fileName.substring(fileName.indexOf('-') + 1, fileName.lastIndexOf('.md'))

  return {
    id: chapterId,
    title: title,
    path: filePath,
    subject: subjectId.value
  }
}

/**
 * File Loader
 * Formula: FileLoader = FetchJSON + DataMapping + Sorting
 * Formula: loadLectures() -> lectures[]
 *
 * Note: Changed from import.meta.glob to lectureFilesMap.json for Vite 7.2.2+ compatibility
 * Vite 7.2.2 has stricter handling of non-JS files in import.meta.glob
 */
const loadLectures = async () => {
  try {
    loading.value = true
    error.value = null

    // Load lecture file map from JSON (compatible with Vite 7.2.2+)
    const response = await fetch('/lectureFilesMap.json')
    const lectureFilesMap = await response.json()

    // Get files for current subject
    const fileList = lectureFilesMap[subjectId.value] || []

    // Parse file names and create lecture objects
    const lectureList = fileList.map(item => ({
      id: item.id,
      title: parseLectureName(item.file).title,
      path: item.file,
      subject: subjectId.value
    }))

    // Sort by chapter ID (ascending)
    lectureList.sort((a, b) => a.id.localeCompare(b.id))

    lectures.value = lectureList
    loading.value = false
  } catch (err) {
    console.error('[SubjectLectures] Error loading lectures:', err)
    error.value = '載入講義時發生錯誤，請稍後再試。'
    loading.value = false
  }
}

/**
 * Navigation Actions
 * Formula: NavigationFlow = navigateToLecture + navigateToSubjects + navigateToHome
 * Formula: navigateToLecture(lectureId) -> /lectures/:subjectId/:lectureId
 * Formula: navigateToSubjects() -> /lectures
 * Formula: navigateToHome() -> /
 */
const navigateToLecture = (lectureId) => {
  router.push(`/lectures/${subjectId.value}/${lectureId}`)
}

const navigateToSubjects = () => {
  router.push('/lectures')
}

const navigateToHome = () => {
  router.push('/')
}

/**
 * Lifecycle Hooks
 * Formula: onMounted -> loadLectures()
 */
onMounted(() => {
  loadLectures()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Page Header -->
      <!-- Formula: PageHeader = title + subtitle + icon -->
      <div class="text-center mb-12">
        <div class="flex items-center justify-center gap-4 mb-4">
          <div :class="`w-16 h-16 bg-${colorClasses.bg} rounded-xl flex items-center justify-center`">
            <svg
              :class="`w-8 h-8 text-${colorClasses.primary}`"
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
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900">
            {{ subjectName }}
          </h1>
        </div>
        <p class="text-lg text-gray-600">
          共 {{ lectures.length }} 個講義
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex justify-center items-center py-20"
      >
        <div
          class="animate-spin rounded-full h-16 w-16 border-b-2"
          :class="`border-${colorClasses.primary}`"
        ></div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center py-20"
      >
        <div class="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
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
          <p class="text-red-700 font-semibold">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Lecture Cards Grid -->
      <!-- Formula: LectureCardsGrid = grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 -->
      <!-- Formula: ResponsiveGrid = mobile(1 col) + tablet(2 cols) + desktop(3 cols) -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <!-- Lecture Card -->
          <!-- Formula: LectureCard = CardContainer × (ChapterBadge + LectureTitle + ArrowIcon) × HoverEffect -->
          <div
            v-for="lecture in lectures"
            :key="lecture.id"
            class="bg-white rounded-xl shadow-lg p-6 cursor-pointer border-2 border-transparent transform hover:scale-105 hover:shadow-xl transition-all duration-300"
            :class="`hover:border-${colorClasses.border}`"
            @click="navigateToLecture(lecture.id)"
          >
            <!-- Chapter Badge -->
            <div class="mb-3">
              <span
                class="inline-block px-3 py-1 rounded-full text-sm font-semibold"
                :class="`bg-${colorClasses.bg} text-${colorClasses.text}`"
              >
                {{ lecture.id }}
              </span>
            </div>

            <!-- Lecture Title -->
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              {{ lecture.title }}
            </h3>

            <!-- Arrow Icon -->
            <div class="flex justify-end">
              <svg
                class="w-5 h-5 text-gray-400"
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
        </div>

        <!-- Navigation Buttons -->
        <!-- Formula: NavigationButtons = BackToSubjects + BackToHome -->
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button
            class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-accent-600 rounded-xl shadow-lg hover:shadow-xl hover:border-accent-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            @click="navigateToSubjects"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回科目
          </button>

          <button
            class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            @click="navigateToHome"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            返回首頁
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-12 text-center text-sm text-gray-500">
        <p>Formula-Contract Methodology | Generated with Claude Code</p>
        <p class="mt-1">
          INC-3: Subject Lectures List Page
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/**
 * Smooth Animations
 * Formula: Transition = property + timing-function + duration
 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-300 {
  transition-duration: 300ms;
}

/**
 * Hover Effects
 * Formula: HoverEffect = scale + shadow + border
 */
.transform:hover {
  transform: translateY(-4px);
}

/**
 * Loading Animation
 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/**
 * Dynamic Color Classes
 * Note: Tailwind CSS will purge unused classes, so we need to use complete class names
 */
</style>
