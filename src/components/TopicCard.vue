<script setup>
/**
 * TopicCard Component
 * Formula: TopicCard = TopicIcon + TopicInfo + StatsDisplay + SelectButton
 * Responsibility: 主題卡片展示，顯示主題信息和統計
 */
import { computed } from 'vue'

const props = defineProps({
  topic: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

/**
 * Computed
 */
const totalQuestions = computed(() => props.stats.total)

const difficultyBreakdown = computed(() => {
  const { simple, medium, hard } = props.stats.difficulties
  const total = simple + medium + hard
  return {
    simple: total > 0 ? Math.round((simple / total) * 100) : 0,
    medium: total > 0 ? Math.round((medium / total) * 100) : 0,
    hard: total > 0 ? Math.round((hard / total) * 100) : 0
  }
})

/**
 * Actions
 */
const handleSelect = () => {
  emit('select')
}
</script>

<template>
  <div
    :class="[
      'bg-white rounded-xl shadow-lg p-7 md:p-8 cursor-pointer transition-all duration-normal',
      'border-2 hover:shadow-2xl transform hover:scale-105',
      isSelected
        ? 'border-primary-600 ring-4 ring-primary-200'
        : 'border-transparent hover:border-primary-300'
    ]"
    @click="handleSelect"
  >
    <!-- Icon & Title -->
    <div class="flex items-center gap-4 mb-5 md:mb-6">
      <div class="text-4xl">
        {{ topic.icon }}
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-gray-900">
          {{ topic.name }}
        </h3>
        <p class="text-xs text-gray-500">
          {{ topic.id }}
        </p>
      </div>
      <!-- Selected Badge -->
      <div
        v-if="isSelected"
        class="flex-shrink-0"
      >
        <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <svg
            class="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Description -->
    <p class="text-sm text-gray-600 mb-5 md:mb-6">
      {{ topic.description }}
    </p>

    <!-- Stats -->
    <div class="space-y-4">
      <!-- Total Questions -->
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600">題目數量</span>
        <span class="font-bold text-primary-600">{{ totalQuestions }} 題</span>
      </div>

      <!-- Difficulty Distribution -->
      <div>
        <div class="text-xs text-gray-600 mb-2">
          難度分佈
        </div>
        <div class="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
          <div
            v-if="difficultyBreakdown.simple > 0"
            :style="{ width: `${difficultyBreakdown.simple}%` }"
            class="bg-accent-500"
            :title="`簡單: ${difficultyBreakdown.simple}%`"
          ></div>
          <div
            v-if="difficultyBreakdown.medium > 0"
            :style="{ width: `${difficultyBreakdown.medium}%` }"
            class="bg-warning-500"
            :title="`中等: ${difficultyBreakdown.medium}%`"
          ></div>
          <div
            v-if="difficultyBreakdown.hard > 0"
            :style="{ width: `${difficultyBreakdown.hard}%` }"
            class="bg-red-500"
            :title="`困難: ${difficultyBreakdown.hard}%`"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>簡單 {{ stats.difficulties.simple }}</span>
          <span>中等 {{ stats.difficulties.medium }}</span>
          <span>困難 {{ stats.difficulties.hard }}</span>
        </div>
      </div>
    </div>

    <!-- Select Indicator -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <span
          :class="[
            'text-sm font-medium',
            isSelected ? 'text-primary-600' : 'text-gray-500'
          ]"
        >
          {{ isSelected ? '已選擇' : '點擊選擇' }}
        </span>
        <svg
          :class="[
            'w-5 h-5 transition-transform',
            isSelected ? 'text-primary-600 rotate-90' : 'text-gray-400'
          ]"
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
</template>

<style scoped>
.duration-normal {
  transition-duration: 300ms;
}
</style>
