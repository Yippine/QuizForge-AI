<script setup>
/**
 * LectureSubjects Component
 * Formula: LectureSubjects = VueComponent × RouterConfig × NavigationFlow × UIStyle
 * Formula: VueComponent = ScriptSetup + Template + Style
 * Formula: ScriptSetup = SubjectData + NavigationActions
 * Responsibility: Display subject selection cards (Subject 1 and Subject 3) with navigation to lecture lists
 */
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

/**
 * Subject Data
 * Formula: SubjectData = Array(Subject) where Subject = id + name + count + color + description
 */
const subjects = ref([
  {
    id: "L21",
    name: "科目 1 - AI 應用規劃",
    count: 9,
    color: "primary",
    description: "iPAS AI 應用規劃師 - 科目一講義",
  },
  {
    id: "L23",
    name: "科目 3 - AI 核心技術",
    count: 12,
    color: "secondary",
    description: "iPAS AI 應用規劃師 - 科目三講義",
  },
]);

/**
 * Navigation Actions
 * Formula: navigateToSubject(subjectId) -> router.push(`/lectures/${subjectId}`)
 * Formula: navigateToHome() -> router.push('/')
 */
const navigateToSubject = (subjectId) => {
  router.push(`/lectures/${subjectId}`);
};

const navigateToHome = () => {
  router.push("/");
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4"
  >
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          講義科目
        </h1>
        <p class="text-lg text-gray-600">選擇您想學習的科目</p>
      </div>

      <!-- Subject Cards Grid -->
      <!-- Formula: SubjectCards = Grid(1, md:2) × Array(SubjectCard) -->
      <!-- Formula: SubjectCard = CardContainer × (Icon + Title + Description + LectureCount + Arrow) × ColorScheme × HoverEffect -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <!-- Subject 1 Card (Primary Color) -->
        <div
          @click="navigateToSubject(subjects[0].id)"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary-600 flex flex-col"
        >
          <!-- Icon & Title -->
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-primary-600"
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
                {{ subjects[0].name }}
              </h2>
            </div>
          </div>

          <!-- Description -->
          <p class="text-gray-600 mb-4 flex-grow">
            {{ subjects[0].description }}
          </p>

          <!-- Lecture Count & Arrow -->
          <div class="flex items-center justify-between mt-auto">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-600"
            >
              {{ subjects[0].count }} 個講義
            </span>
            <svg
              class="w-6 h-6 text-primary-600"
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

        <!-- Subject 3 Card (Secondary Color) -->
        <div
          @click="navigateToSubject(subjects[1].id)"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-secondary-600 flex flex-col"
        >
          <!-- Icon & Title -->
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-secondary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ subjects[1].name }}
              </h2>
            </div>
          </div>

          <!-- Description -->
          <p class="text-gray-600 mb-4 flex-grow">
            {{ subjects[1].description }}
          </p>

          <!-- Lecture Count & Arrow -->
          <div class="flex items-center justify-between mt-auto">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-secondary-100 text-secondary-600"
            >
              {{ subjects[1].count }} 個講義
            </span>
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <!-- Formula: BackButton = button + @click='navigateToHome' + flex items-center gap-2 -->
      <div class="flex justify-center">
        <button
          @click="navigateToHome"
          class="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
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

      <!-- Footer Info -->
      <div class="mt-12 text-center text-sm text-gray-500">
        <p>Formula-Contract Methodology | Generated with Claude Code</p>
        <p class="mt-1">INC-2: Lecture Subjects Selection Page</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth animations */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.duration-300 {
  transition-duration: 300ms;
}

/* Hover effects */
.transform:hover {
  transform: translateY(-4px);
}
</style>
