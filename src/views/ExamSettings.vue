<script setup>
/**
 * ExamSettings Page
 * Formula: ExamSettings = RangeSelector + [EmptyWarningBlock(isRangeEmpty)] + QuestionCountSelector(filteredQuestionOptions, smartDefaultIndex) + TimeLimitSelector + ModeButtons
 * Responsibility: 模擬考試設定頁面，用於設定題目範圍、題數和時間限制
 * INC-018: Exam settings interface
 * INC-019: 模擬考試主題範圍選擇器
 * INC-020: 智慧題數選項調整（動態過濾 + 智慧預設 + 響應式重置）
 * INC-021: UI 優化與使用者體驗提升（空範圍警告 + Footer 更新）
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuestionBankStore } from '../stores/questionBank'
import { extractTopicID } from '../constants/ipas'
import { useResourcesMap } from '../composables/useResourcesMap'
import OptionSelector from '../components/OptionSelector.vue'

const router = useRouter()
const route = useRoute()
const store = useQuestionBankStore()
const { getCategoryById, getCertificationByPath, getLevelById } = useResourcesMap()

/**
 * State
 * INC-019: 新增 selectedRange 狀態
 */
const selectedRange = ref('all') // 預設「全部題目」
const questionCount = ref(20) // 預設 20 題
const timeLimit = ref(null) // 預設不限時
const isQuestionCountValid = ref(true)
const isTimeLimitValid = ref(true)

/**
 * INC-032: Route params detection for scoped mode
 * Formula: isSubjectScoped = computed(() => !!route.params.subjectId)
 */
const isSubjectScoped = computed(() => !!route.params.subjectId)
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)
const subjectId = computed(() => route.params.subjectId)

// Get breadcrumb data for new structure
const ipasCategory = computed(() => isSubjectScoped.value ? getCategoryById('ipas') : null)
const certification = computed(() => isSubjectScoped.value ? getCertificationByPath('ipas', certificationId.value) : null)
const level = computed(() => isSubjectScoped.value ? getLevelById('ipas', certificationId.value, levelId.value) : null)
const subject = computed(() => isSubjectScoped.value ? level.value?.subjects.find(s => s.id === subjectId.value) : null)

/**
 * Options
 * INC-019: 新增 rangeOptions（步驟 1）
 */
const rangeOptions = [
  { label: '全部主題', value: 'all', description: '從所有題庫出題' },
  { label: '官方題目', value: 'official', description: '官方考試題目' },
  { label: '科目一', value: 'L21', description: '人工智慧技術應用與規劃' },
  { label: '科目三', value: 'L23', description: '機器學習技術與應用' }
]

const questionOptions = [
  { label: '10題', value: 10 },
  { label: '20題', value: 20 },
  { label: '30題', value: 30 },
  { label: '全部題目', value: null },
  { label: '自訂', value: 'custom' }
]

const timeOptions = [
  { label: '10分鐘', value: 10 },
  { label: '20分鐘', value: 20 },
  { label: '30分鐘', value: 30 },
  { label: '不限時', value: null },
  { label: '自訂', value: 'custom' }
]

/**
 * Computed
 * INC-019: 新增 availableQuestions 和 rangeQuestionCount（步驟 3-4）
 */
// 步驟 3: 題目過濾邏輯（參考 TopicSelection.vue:69-89）
const availableQuestions = computed(() => {
  const allQuestions = store.questions

  if (selectedRange.value === 'all') {
    // 全部題目
    return allQuestions
  } else if (selectedRange.value === 'official') {
    // 官方題目：過濾 question_id.startsWith('OFF_')
    return allQuestions.filter(q => q.question_id.startsWith('OFF_'))
  } else if (selectedRange.value === 'L21' || selectedRange.value === 'L23') {
    // 科目過濾：使用 extractTopicID 判斷科目歸屬
    return allQuestions.filter(q => {
      const topicId = extractTopicID(q.topic) || q.topic
      // 檢查主題ID是否以 L21 或 L23 開頭
      return topicId.startsWith(selectedRange.value)
    })
  }

  return allQuestions
})

// 步驟 4: 動態題數計算
const rangeQuestionCount = computed(() => {
  return availableQuestions.value.length
})

/**
 * INC-020 步驟 1: 動態過濾題數選項
 * Formula: filteredQuestionOptions = questionOptions.filter(opt => (opt.value === null | opt.value === 'custom' | opt.value <= rangeQuestionCount.value))
 */
const filteredQuestionOptions = computed(() => {
  const maxCount = rangeQuestionCount.value

  // 過濾掉超過範圍的固定選項
  return questionOptions.filter(opt => {
    // 全部題目、自訂選項始終保留
    if (opt.value === null || opt.value === 'custom') return true
    // 固定數字選項：只保留 <= maxCount 的選項
    return opt.value <= maxCount
  })
})

/**
 * INC-020 步驟 2: 智慧預設索引
 * Formula: smartDefaultIndex = FindOptimalIndex(filteredQuestionOptions, 20, rangeQuestionCount)
 * 邏輯：優先選擇 20 題，若超範圍則選最大有效選項，兜底為索引 0
 */
const smartDefaultIndex = computed(() => {
  const maxCount = rangeQuestionCount.value
  const validOptions = filteredQuestionOptions.value

  // 目標：找到最接近 20 題的有效選項
  const targetValue = 20

  // 如果 20 題在範圍內，返回其索引
  const targetIndex = validOptions.findIndex(opt => opt.value === targetValue)
  if (targetIndex !== -1) return targetIndex

  // 如果 20 題超過範圍，找到最大的固定數字選項
  let maxValidIndex = 0
  for (let i = 0; i < validOptions.length; i++) {
    const opt = validOptions[i]
    if (typeof opt.value === 'number' && opt.value <= maxCount) {
      maxValidIndex = i
    }
  }

  return maxValidIndex
})

/**
 * INC-021 步驟 1: 空範圍檢測
 * Formula: isRangeEmpty = computed(() => rangeQuestionCount.value === 0)
 */
const isRangeEmpty = computed(() => rangeQuestionCount.value === 0)

const canStartQuiz = computed(() => {
  return isQuestionCountValid.value && isTimeLimitValid.value
})

/**
 * Actions
 * INC-019: 新增 handleRangeUpdate
 */
const handleRangeUpdate = (value) => {
  selectedRange.value = value
  // 當範圍改變時，重置題數如果超過新範圍的總題數
  if (questionCount.value > rangeQuestionCount.value) {
    questionCount.value = Math.min(questionCount.value, rangeQuestionCount.value)
  }
}

const handleQuestionCountUpdate = (value) => {
  questionCount.value = value
  // null 代表「全部題目」，是有效的選擇
  // 數字代表具體題數，也是有效的
  isQuestionCountValid.value = true
}

const handleTimeLimitUpdate = (value) => {
  timeLimit.value = value
  // null 代表「不限時」，是有效的選擇
  // 數字代表具體時間限制，也是有效的
  isTimeLimitValid.value = true
}

const startPractice = () => {
  if (!canStartQuiz.value) return

  // INC-019 步驟 8: 擴展路由參數（新增 range 參數）
  // 如果 questionCount 為 null（全部題目），使用 rangeQuestionCount
  const finalQuestionCount = questionCount.value !== null ? questionCount.value : rangeQuestionCount.value

  router.push({
    path: '/quiz',
    query: {
      mode: 'practice',
      questionCount: finalQuestionCount,
      timeLimit: timeLimit.value || undefined,
      range: selectedRange.value
    }
  })
}

const startExam = () => {
  if (!canStartQuiz.value) return

  // INC-019 步驟 8: 擴展路由參數（新增 range 參數）
  // 如果 questionCount 為 null（全部題目），使用 rangeQuestionCount
  const finalQuestionCount = questionCount.value !== null ? questionCount.value : rangeQuestionCount.value

  router.push({
    path: '/quiz',
    query: {
      mode: 'exam',
      questionCount: finalQuestionCount,
      timeLimit: timeLimit.value || undefined,
      range: selectedRange.value
    }
  })
}

const goBack = () => {
  // INC-032: Conditional navigation based on route structure
  if (isSubjectScoped.value) {
    // Go back to PracticeHub
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/practice`)
  } else {
    // Go back to home
    router.push('/')
  }
}

const goToPracticeHub = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/practice`)
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
 * INC-032: Auto-select range when coming from PracticeHub
 */
onMounted(() => {
  if (isSubjectScoped.value && subjectId.value) {
    selectedRange.value = subjectId.value
    handleRangeUpdate(subjectId.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8 md:py-12 px-4">
    <!-- Header -->
    <header class="max-w-3xl mx-auto mb-8">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm md:text-base"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        {{ isSubjectScoped ? '返回題目區' : '返回主頁' }}
      </button>

      <!-- INC-032: Breadcrumb for scoped mode -->
      <div v-if="isSubjectScoped && ipasCategory && certification && level && subject" class="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
        <span class="hover:text-primary-600 cursor-pointer" @click="goToIpas">{{ ipasCategory.name }}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="hover:text-primary-600 cursor-pointer" @click="goToCertification">{{ certification.name }}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="hover:text-primary-600 cursor-pointer" @click="goToLevel">{{ level.name }}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="hover:text-primary-600 cursor-pointer" @click="goToSubjectHub">{{ subject.code }}</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="hover:text-primary-600 cursor-pointer" @click="goToPracticeHub">題目區</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="font-semibold text-gray-900">模擬考試</span>
      </div>

      <!-- Title -->
      <div class="text-center mb-6">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          模擬考試設定
        </h1>
        <p class="text-sm md:text-base text-gray-600">選擇題數和時間限制，開始你的練習或考試</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8">
        <!-- INC-019 步驟 5: 新增 Range Selector -->
        <!-- INC-032: Hide range selector when scoped to a subject -->
        <OptionSelector
          v-if="!isSubjectScoped"
          :options="rangeOptions"
          :default-index="0"
          label="選擇題目範圍"
          @update:value="handleRangeUpdate"
        />

        <!-- INC-032: Show subject info when scoped -->
        <div v-else class="bg-primary-50 rounded-lg p-4 md:p-6">
          <h3 class="text-base md:text-lg font-semibold text-gray-900 mb-2">題目範圍</h3>
          <div class="text-sm md:text-base text-gray-700">
            <span class="font-semibold text-primary-600">{{ subject?.code }} - {{ subject?.name }}</span>
          </div>
        </div>

        <!-- INC-021 步驟 2: 空範圍警告區塊 -->
        <div v-if="isRangeEmpty" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div class="text-xs md:text-sm text-yellow-800">
              <p class="font-semibold mb-1">該範圍暫無題目</p>
              <p>請選擇其他範圍以開始練習或考試</p>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-200"></div>

        <!-- Question Count Selector -->
        <!-- INC-019 步驟 7: 調整題數選項上限（根據範圍動態調整） -->
        <!-- INC-020 步驟 3: 更新元件綁定 - 使用 filteredQuestionOptions 和 smartDefaultIndex -->
        <!-- 移除 :key 綁定，避免切換範圍時重置選擇 -->
        <OptionSelector
          :options="filteredQuestionOptions"
          :default-index="smartDefaultIndex"
          :custom-range="{ min: 1, max: rangeQuestionCount }"
          unit="題"
          label="選擇題數"
          @update:value="handleQuestionCountUpdate"
        />

        <!-- Divider -->
        <div class="border-t border-gray-200"></div>

        <!-- Time Limit Selector -->
        <OptionSelector
          :options="timeOptions"
          :default-index="3"
          :custom-range="{ min: 1, max: 180 }"
          unit="分鐘"
          label="選擇時間限制"
          @update:value="handleTimeLimitUpdate"
        />

        <!-- Divider -->
        <div class="border-t border-gray-200"></div>

        <!-- Settings Summary -->
        <!-- INC-019 步驟 6: 更新設定摘要區塊 -->
        <div class="bg-primary-50 rounded-lg p-4 md:p-6">
          <h3 class="text-base md:text-lg font-semibold text-gray-900 mb-3">設定摘要</h3>
          <div class="space-y-2 text-sm md:text-base text-gray-700">
            <div class="flex items-center justify-between">
              <span>題目範圍：</span>
              <span class="font-semibold text-primary-600">
                {{ rangeOptions.find(o => o.value === selectedRange)?.label || '全部題目' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>範圍題數：</span>
              <span class="font-semibold text-secondary-600">
                {{ rangeQuestionCount }} 題
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>題目數量：</span>
              <span class="font-semibold text-primary-600">
                {{ questionCount !== null ? `${questionCount} 題` : '全部題目' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span>時間限制：</span>
              <span class="font-semibold text-primary-600">
                {{ timeLimit !== null ? `${timeLimit} 分鐘` : '不限時' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Start Practice Button -->
          <button
            @click="startPractice"
            :disabled="!canStartQuiz"
            :class="[
              'py-3 rounded-lg font-semibold text-base md:text-lg transition-all shadow-md',
              canStartQuiz
                ? 'bg-accent-600 hover:bg-accent-700 text-white hover:shadow-lg transform hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            <div class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>開始練習</span>
            </div>
            <span class="block text-xs md:text-sm mt-1 opacity-90">可查看答案和解析</span>
          </button>

          <!-- Start Exam Button -->
          <button
            @click="startExam"
            :disabled="!canStartQuiz"
            :class="[
              'py-3 rounded-lg font-semibold text-base md:text-lg transition-all shadow-md',
              canStartQuiz
                ? 'bg-secondary-600 hover:bg-secondary-700 text-white hover:shadow-lg transform hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            <div class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>開始考試</span>
            </div>
            <span class="block text-xs md:text-sm mt-1 opacity-90">完成後統一批改</span>
          </button>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div class="text-sm text-blue-800">
              <p class="font-semibold mb-1">模式說明</p>
              <ul class="space-y-1 list-disc list-inside">
                <li><strong>練習模式：</strong>每題作答後立即顯示答案和解析，適合學習</li>
                <li><strong>考試模式：</strong>完成所有題目後才能查看結果，模擬真實考試</li>
                <li><strong>時間限制：</strong>選擇時間限制後，答題頁面會顯示倒數計時器</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-3xl mx-auto mt-8 text-center text-xs md:text-sm text-gray-500">
      <p>Formula-Contract Methodology | Generated with Claude Code</p>
      <p class="mt-1">基於 INC-016~021 實現 | 模擬考試完整功能</p>
    </footer>
  </div>
</template>

<style scoped>
/* Smooth animations */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
