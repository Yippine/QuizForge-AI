<script setup>
/**
 * PracticeHub Component (INC-032)
 * Formula: PracticeHub = Breadcrumbs + Header + Statistics + DualEntryCards(TopicPractice + MockExam)
 * Responsibility: 題目區總覽頁面，提供主題練習和模擬考試雙入口
 */
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'
import { useQuestionBankStore } from '../stores/questionBank'
import { TOPICS_L21, TOPICS_L23, extractTopicID } from '../constants/ipas'

const router = useRouter()
const route = useRoute()
const store = useQuestionBankStore()
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
 * Statistics - Topic Count and Question Count
 * Formula: topicCount = TOPICS_L21.length | TOPICS_L23.length
 * Formula: questionCount = store.questions.filter(q => extractTopicID(q.topic)?.startsWith(subjectId)).length
 */
const topicCount = computed(() => {
  if (subjectId.value === 'L21') {
    return TOPICS_L21.length // 9 topics
  } else if (subjectId.value === 'L23') {
    return TOPICS_L23.length // 12 topics
  }
  return 0
})

const questionCount = computed(() => {
  // Filter questions by current subject
  return store.questions.filter(q => {
    const topicId = extractTopicID(q.topic) || q.topic
    return topicId.startsWith(subjectId.value)
  }).length
})

/**
 * Actions
 */
const goToTopicPractice = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/practice/topics`)
}

const goToMockExam = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/practice/exam`)
}

const goToHome = () => {
  router.push('/')
}

const goToSubjectHub = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}`)
}

const goToLevel = () => {
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
          載入題目區資料...
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
          返回科目總覽
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
        <div class="flex items-center gap-4 mb-6">
          <button
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
          <span class="text-gray-300">|</span>
          <button
            class="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors text-sm"
            @click="goToSubjectHub"
          >
            返回科目總覽
          </button>
        </div>

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
              @click="goToLevel"
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
            <span class="font-semibold text-gray-900">題目區</span>
          </div>

          <div class="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-lg mb-4">
            <span class="font-bold">{{ subject.code }} 題目區</span>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            {{ subject.name }}
          </h1>
          <p class="text-lg text-gray-600 mb-6">
            選擇練習模式，開始你的學習之旅
          </p>

          <!-- Statistics Panel -->
          <div class="flex items-center justify-center gap-8 mb-8">
            <div class="text-center">
              <div class="text-4xl font-bold text-primary-600">
                {{ topicCount }}
              </div>
              <div class="text-sm text-gray-600 mt-1">
                個主題
              </div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-secondary-600">
                {{ questionCount }}
              </div>
              <div class="text-sm text-gray-600 mt-1">
                道題目
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dual Entry Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Topic Practice Card (Green Theme) -->
        <div
          class="bg-white rounded-2xl shadow-xl p-10 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-600"
          @click="goToTopicPractice"
        >
          <div class="text-center">
            <div class="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div class="text-5xl">
                📝
              </div>
            </div>

            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              主題練習
            </h2>
            <p class="text-gray-600 mb-6">
              選擇特定主題進行針對性練習，逐步掌握各個知識點
            </p>

            <div class="flex items-center justify-center mb-6">
              <div class="px-6 py-3 bg-green-50 text-green-700 rounded-lg">
                <span class="text-2xl font-bold">{{ topicCount }}</span>
                <span class="text-sm ml-2">個主題可選</span>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <span>開始主題練習</span>
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

        <!-- Mock Exam Card (Blue Theme) -->
        <div
          class="bg-white rounded-2xl shadow-xl p-10 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-600"
          @click="goToMockExam"
        >
          <div class="text-center">
            <div class="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div class="text-5xl">
                📋
              </div>
            </div>

            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              模擬考試
            </h2>
            <p class="text-gray-600 mb-6">
              模擬真實考試環境，全面測試能力，檢驗學習成效
            </p>

            <div class="flex items-center justify-center mb-6">
              <div class="px-6 py-3 bg-blue-50 text-blue-700 rounded-lg">
                <span class="text-2xl font-bold">{{ questionCount }}</span>
                <span class="text-sm ml-2">道題目</span>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 text-blue-600 font-semibold">
              <span>開始模擬考試</span>
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
          INC-032: Practice Hub Implementation
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
