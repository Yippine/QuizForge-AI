<script setup>
/**
 * HomePage Component
 * Formula: HomePage' = HomePage - HardcodedSubjectSelector + (ModalTrigger + RecentSubjectsTags) + (QuickFunctions x ModalFallback)
 * INC-033-v2: HomePage Integration with Modal-Based Resource Selection
 * Responsibility: 主頁入口，提供科目選擇和快速功能導航
 */
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuestionBankStore } from "../stores/questionBank";
import { useCurrentSubjectStore } from "../stores/currentSubject";
import { useAnswerTracking } from "../composables/useAnswerTracking";
import { useResourcesMap } from "../composables/useResourcesMap";
import WrongQuestionsPanel from "../components/WrongQuestionsPanel.vue";
import ResourceSelectorModal from "../components/ResourceSelectorModal.vue";

const router = useRouter();
const store = useQuestionBankStore();
const currentSubjectStore = useCurrentSubjectStore();
const { getStatistics, wrongQuestionsCount } = useAnswerTracking();
const { getCategoryById, getCertificationByPath, getLevelById, loadResourcesMap } = useResourcesMap();

/**
 * State
 */
const loading = ref(true);
const stats = ref({
  total: 0,
  correct: 0,
  accuracy: 0,
});
const showWrongQuestionsPanel = ref(false);
const showResourceSelector = ref(false);

/**
 * Computed
 */
const questionBankSize = computed(() => store.questions.length);

// Subject selector computed properties
const isSubjectSelected = computed(() => currentSubjectStore.isSubjectSelected);
const subjectInfo = computed(() => currentSubjectStore.subjectInfo);

// Path getters for quick functions
const materialsPath = computed(() => currentSubjectStore.materialsPath);
const practicePath = computed(() => currentSubjectStore.practicePath);

// Recent subjects from store
const recentSubjects = computed(() => currentSubjectStore.recentSubjectsList);

// Display path for current selection
const displayPath = computed(() => {
  if (!isSubjectSelected.value) return null;

  const fullPath = currentSubjectStore.fullPath;
  const category = getCategoryById(fullPath.categoryId);
  const certification = getCertificationByPath(fullPath.categoryId, fullPath.certificationId);
  const level = getLevelById(fullPath.categoryId, fullPath.certificationId, fullPath.levelId);

  if (!category || !certification || !level) return null;

  return {
    category: category.name,
    certification: certification.name,
    level: level.name,
    subject: subjectInfo.value?.name || fullPath.subjectId
  };
});

/**
 * Actions
 */
const openResourceSelector = () => {
  showResourceSelector.value = true;
};

const handleModalSelect = (fullPath) => {
  currentSubjectStore.setFullPath(fullPath);
  currentSubjectStore.addToRecent(fullPath);
};

const selectRecentSubject = (recent) => {
  const fullPath = {
    categoryId: recent.categoryId,
    certificationId: recent.certificationId,
    levelId: recent.levelId,
    subjectId: recent.subjectId
  };
  currentSubjectStore.setFullPath(fullPath);
};

const getRecentSubjectName = (recent) => {
  const level = getLevelById(recent.categoryId, recent.certificationId, recent.levelId);
  if (!level) return recent.subjectId;

  const subject = level.subjects.find(s => s.id === recent.subjectId);
  return subject ? `${subject.code} ${subject.name}` : recent.subjectId;
};

const getRecentSubjectPath = (recent) => {
  const category = getCategoryById(recent.categoryId);
  const certification = getCertificationByPath(recent.categoryId, recent.certificationId);
  const level = getLevelById(recent.categoryId, recent.certificationId, recent.levelId);

  if (!category || !certification || !level) return '';

  return `${category.name} > ${certification.name} > ${level.name}`;
};

const isRecentSelected = (recent) => {
  const fullPath = currentSubjectStore.fullPath;
  return recent.categoryId === fullPath.categoryId &&
         recent.certificationId === fullPath.certificationId &&
         recent.levelId === fullPath.levelId &&
         recent.subjectId === fullPath.subjectId;
};

const navigateToMaterials = () => {
  if (isSubjectSelected.value && materialsPath.value) {
    router.push(materialsPath.value);
  } else {
    openResourceSelector();
  }
};

const navigateToPractice = () => {
  if (isSubjectSelected.value && practicePath.value) {
    router.push(practicePath.value);
  } else {
    openResourceSelector();
  }
};

const viewWrongQuestions = () => {
  showWrongQuestionsPanel.value = true;
};

/**
 * Handle start wrong practice event from WrongQuestionsPanel
 * Formula: handleStartWrongPractice(questionIds) -> router.push({ path: '/quiz', query: { mode: 'wrong-questions', ids: questionIds } })
 */
const handleStartWrongPractice = (questionIds) => {
  router.push({
    path: "/quiz",
    query: {
      mode: "wrong-questions",
      ids: questionIds.join(","),
    },
  });
};

/**
 * Handle close panel event from WrongQuestionsPanel
 * Formula: handleClosePanel() -> showWrongQuestionsPanel.value = false
 */
const handleClosePanel = () => {
  showWrongQuestionsPanel.value = false;
};

const viewStatistics = () => {
  router.push("/statistics");
};

/**
 * Lifecycle
 */
onMounted(async () => {
  try {
    // Load resources map for display path resolution
    await loadResourcesMap();

    // Load question bank
    await store.loadQuestions();

    // Load full state from storage
    currentSubjectStore.loadFullState();

    // Load statistics
    const userStats = getStatistics();
    stats.value = {
      total: userStats.totalAnswered || 0,
      correct: userStats.totalCorrect || 0,
      accuracy:
        userStats.totalAnswered > 0
          ? Math.round((userStats.totalCorrect / userStats.totalAnswered) * 100)
          : 0,
    };

    loading.value = false;
  } catch (error) {
    console.error("Failed to load data:", error);
    loading.value = false;
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4"
  >
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"
        ></div>
        <p class="text-gray-600 text-lg">載入中...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-6xl mx-auto">
      <!-- Hero Section -->
      <div class="text-center mb-14 md:mb-16">
        <h1 class="text-5xl font-bold text-gray-900 mb-5 md:mb-6">
          QuizForge AI
        </h1>
        <p class="text-xl text-gray-600 mb-3 md:mb-4">
          iPAS AI 應用規劃師 - 智慧題庫系統
        </p>
        <p class="text-base text-gray-500">
          開始你的學習之旅，掌握 AI 應用規劃核心知識
        </p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6 mb-12">
        <div
          class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal"
        >
          <div class="text-3xl font-bold text-primary-600">
            {{ questionBankSize }}
          </div>
          <div class="text-sm text-gray-600 mt-3">題庫總題數</div>
        </div>
        <div
          class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal"
        >
          <div class="text-3xl font-bold text-accent-600">
            {{ stats.total }}
          </div>
          <div class="text-sm text-gray-600 mt-3">已答題數</div>
        </div>
        <div
          class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal"
        >
          <div class="text-3xl font-bold text-secondary-600">
            {{ stats.accuracy }}%
          </div>
          <div class="text-sm text-gray-600 mt-3">正確率</div>
        </div>
        <div
          class="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-normal relative"
        >
          <div class="text-3xl font-bold text-warning-600">
            {{ wrongQuestionsCount }}
          </div>
          <div class="text-sm text-gray-600 mt-3">錯題數量</div>
          <span
            v-if="wrongQuestionsCount > 0"
            class="absolute top-2 right-2 bg-warning-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
          >
            !
          </span>
        </div>
      </div>

      <!-- Subject Selector Section -->
      <div class="mb-12">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">選擇科目</h2>

        <!-- Selected Subject Display -->
        <div v-if="isSubjectSelected && displayPath" class="mb-6">
          <div class="bg-green-50 border border-green-200 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span class="text-green-800 font-semibold block">
                    已選擇：{{ subjectInfo?.name }} ({{ subjectInfo?.code }})
                  </span>
                  <span class="text-green-600 text-sm">
                    {{ displayPath.category }} > {{ displayPath.certification }} > {{ displayPath.level }}
                  </span>
                </div>
              </div>
              <button
                @click="openResourceSelector"
                class="text-green-600 hover:text-green-800 transition-colors text-sm font-medium"
              >
                更換
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Trigger Button -->
        <div v-if="!isSubjectSelected" class="text-center">
          <button
            @click="openResourceSelector"
            class="inline-flex items-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span class="text-lg font-semibold">選擇學習科目</span>
          </button>
          <p class="text-gray-500 mt-3">請先選擇科目以開始學習</p>
        </div>

        <!-- Recent Subjects Cards -->
        <div v-if="recentSubjects.length > 0" class="mt-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">最近學習</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              v-for="recent in recentSubjects"
              :key="`${recent.categoryId}-${recent.certificationId}-${recent.levelId}-${recent.subjectId}`"
              @click="selectRecentSubject(recent)"
              class="rounded-xl shadow-md p-4 text-left transition-all duration-200 border-2"
              :class="isRecentSelected(recent)
                ? 'bg-primary-50 border-primary-500 shadow-lg'
                : 'bg-white border-transparent hover:shadow-lg hover:border-primary-300'"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     :class="isRecentSelected(recent) ? 'bg-primary-200' : 'bg-primary-100'">
                  <svg class="w-5 h-5" :class="isRecentSelected(recent) ? 'text-primary-700' : 'text-primary-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="isRecentSelected(recent)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold truncate" :class="isRecentSelected(recent) ? 'text-primary-900' : 'text-gray-900'">
                    {{ getRecentSubjectName(recent) }}
                  </h4>
                  <p class="text-xs mt-1 truncate" :class="isRecentSelected(recent) ? 'text-primary-600' : 'text-gray-500'">
                    {{ getRecentSubjectPath(recent) }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Functions Section (SubjectHub Style) -->
      <div class="mb-14 md:mb-16">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">快速功能</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Materials Entry Card (講義區) -->
          <div
            @click="navigateToMaterials"
            class="bg-white rounded-2xl shadow-xl p-10 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-600"
          >
            <div class="text-center">
              <div class="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <h2 class="text-3xl font-bold text-gray-900 mb-4">講義區</h2>
              <p class="text-gray-600 mb-6">
                <template v-if="isSubjectSelected">
                  瀏覽學習指引、公式化講義、架構圖等學習資源
                </template>
                <template v-else>
                  選擇科目後查看對應的講義資源
                </template>
              </p>

              <div class="flex items-center justify-center mb-6">
                <template v-if="isSubjectSelected">
                  <div class="px-6 py-3 bg-blue-50 text-blue-700 rounded-lg">
                    <span class="text-2xl font-bold">{{ subjectInfo?.materialCount }}</span>
                    <span class="text-sm ml-2">份資源</span>
                  </div>
                </template>
                <template v-else>
                  <div class="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg">
                    <span class="text-sm">請先選擇科目</span>
                  </div>
                </template>
              </div>

              <div class="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                <span>進入講義區</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Practice Entry Card (題目區) -->
          <div
            @click="navigateToPractice"
            class="bg-white rounded-2xl shadow-xl p-10 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-600"
          >
            <div class="text-center">
              <div class="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>

              <h2 class="text-3xl font-bold text-gray-900 mb-4">題目區</h2>
              <p class="text-gray-600 mb-6">
                <template v-if="isSubjectSelected">
                  練習題目、模擬測驗，檢驗學習成效
                </template>
                <template v-else>
                  選擇科目後進行主題練習或模擬考試
                </template>
              </p>

              <div class="flex items-center justify-center mb-6">
                <template v-if="isSubjectSelected">
                  <div class="flex items-center gap-4">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-orange-600">{{ subjectInfo?.topicCount }}</div>
                      <div class="text-xs text-gray-500">主題</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-orange-600">{{ subjectInfo?.questionCount }}</div>
                      <div class="text-xs text-gray-500">題目</div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="px-6 py-3 bg-gray-100 text-gray-500 rounded-lg">
                    <span class="text-sm">請先選擇科目</span>
                  </div>
                </template>
              </div>

              <div class="flex items-center justify-center gap-2 text-orange-600 font-semibold">
                <span>前往題目區</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Features -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-8">
        <!-- Wrong Questions -->
        <button
          v-if="wrongQuestionsCount > 0"
          @click="viewWrongQuestions"
          class="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-normal border-2 border-transparent hover:border-warning-500"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-warning-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">錯題本</h3>
                <p class="text-sm text-gray-600">重點複習錯題</p>
              </div>
            </div>
            <span
              class="bg-warning-500 text-white rounded-full px-4 py-2 text-sm font-bold"
            >
              {{ wrongQuestionsCount }} 題
            </span>
          </div>
        </button>

        <!-- Statistics -->
        <button
          @click="viewStatistics"
          class="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-normal border-2 border-transparent hover:border-secondary-500"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-secondary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">學習統計</h3>
                <p class="text-sm text-gray-600">查看詳細分析</p>
              </div>
            </div>
            <svg
              class="w-6 h-6 text-secondary-600"
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
        </button>
      </div>

      <!-- Footer Info -->
      <div class="mt-12 text-center text-sm text-gray-500">
        <p>Formula-Contract Methodology | Generated with Claude Code</p>
        <p class="mt-1">INC-033-v2: HomePage Integration with Modal-Based Resource Selection</p>
      </div>
    </div>

    <!-- Wrong Questions Panel Modal -->
    <Teleport to="body">
      <div
        v-if="showWrongQuestionsPanel"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="handleClosePanel"
      >
        <div class="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <WrongQuestionsPanel
            mode="view"
            @start-wrong-practice="handleStartWrongPractice"
            @close-panel="handleClosePanel"
          />
        </div>
      </div>
    </Teleport>

    <!-- Resource Selector Modal -->
    <ResourceSelectorModal
      v-model="showResourceSelector"
      @select="handleModalSelect"
    />
  </div>
</template>

<style scoped>
/* Smooth animations */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-normal {
  transition-duration: 300ms;
}

/* Hover effects */
.transform:hover {
  transform: translateY(-4px);
}

/* Subtle scale for subject cards */
.hover\:scale-102:hover {
  transform: scale(1.02);
}
</style>
