<script setup>
/**
 * GlossaryListView Page
 * Formula: GlossaryListView = Navigation + GlossaryList + Breadcrumb
 * Responsibility: Wrapper page for GlossaryList component with navigation
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import GlossaryList from '../components/GlossaryList.vue'

const router = useRouter()
const route = useRoute()

// Route params
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)
const subjectId = computed(() => route.params.subjectId)

/**
 * Navigation Actions
 */
const goBack = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials`)
}

const goToSubjectHub = () => {
  router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}`)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Navigation Header -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-4">
          <button
            class="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
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
            返回講義區
          </button>
        </div>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 flex-wrap mb-6">
          <span
            class="hover:text-teal-600 cursor-pointer"
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
            class="hover:text-teal-600 cursor-pointer"
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
            class="hover:text-teal-600 cursor-pointer"
            @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}`)"
          >{{ levelId }}</span>
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
            class="hover:text-teal-600 cursor-pointer"
            @click="goToSubjectHub"
          >{{ subjectId }}</span>
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
            class="hover:text-teal-600 cursor-pointer"
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
          <span class="font-semibold text-gray-900">專業術語表</span>
        </div>

        <!-- Page Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            專業術語表
          </h1>
          <p class="text-lg text-gray-600">
            AI 相關專業術語的定義、範例與相關概念連結
          </p>
        </div>
      </div>

      <!-- Glossary List Component -->
      <GlossaryList :subject-id="subjectId" />
    </div>
  </div>
</template>

<style scoped>
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
