<script setup>
/**
 * QuizForge AI - Statistics Panel Component
 * Formula: StatisticsPanel = OverallStats + TopicPerformance + DifficultyAnalysis + ProgressTracking
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionBankStore } from '../stores/questionBank'
import { useAnswerTracking } from '../composables/useAnswerTracking'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const router = useRouter()
const store = useQuestionBankStore()
const { getAnswerHistory, getStatistics } = useAnswerTracking()

/**
 * 狀態管理
 */
const loading = ref(true)
const answerHistory = ref([])
const timeRange = ref('all') // 'all', 'today', 'week', 'month'

/**
 * 計算屬性
 */
// 基礎統計
const overallStats = computed(() => {
  const history = answerHistory.value
  const total = history.length
  const correct = history.filter(h => h.isCorrect).length
  const incorrect = total - correct
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return {
    total,
    correct,
    incorrect,
    accuracy,
    avgTime: calculateAverageTime(history),
    streak: calculateCurrentStreak(history)
  }
})

// 主題表現統計
const topicStats = computed(() => {
  const topicMap = new Map()

  answerHistory.value.forEach(answer => {
    const topic = answer.topic || '未知主題'
    if (!topicMap.has(topic)) {
      topicMap.set(topic, { total: 0, correct: 0, incorrect: 0 })
    }
    const stats = topicMap.get(topic)
    stats.total++
    if (answer.isCorrect) {
      stats.correct++
    } else {
      stats.incorrect++
    }
  })

  return Array.from(topicMap.entries()).map(([topic, stats]) => ({
    topic,
    ...stats,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  })).sort((a, b) => b.total - a.total)
})

// 難度分析統計
const difficultyStats = computed(() => {
  const difficultyMap = new Map()

  answerHistory.value.forEach(answer => {
    const difficulty = answer.difficulty || 'unknown'
    if (!difficultyMap.has(difficulty)) {
      difficultyMap.set(difficulty, { total: 0, correct: 0, incorrect: 0 })
    }
    const stats = difficultyMap.get(difficulty)
    stats.total++
    if (answer.isCorrect) {
      stats.correct++
    } else {
      stats.incorrect++
    }
  })

  return Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
    difficulty: difficulty === 'simple' ? '簡單' : difficulty === 'medium' ? '中等' : difficulty === 'hard' ? '困難' : '未知',
    ...stats,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  }))
})

// 時間趨勢數據
const trendData = computed(() => {
  const dailyMap = new Map()

  answerHistory.value.forEach(answer => {
    const date = new Date(answer.timestamp).toLocaleDateString('zh-TW')
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { correct: 0, incorrect: 0, total: 0 })
    }
    const stats = dailyMap.get(date)
    stats.total++
    if (answer.isCorrect) {
      stats.correct++
    } else {
      stats.incorrect++
    }
  })

  const dates = Array.from(dailyMap.keys()).sort()
  const correctData = dates.map(date => dailyMap.get(date).correct)
  const incorrectData = dates.map(date => dailyMap.get(date).incorrect)

  return {
    labels: dates.slice(-7), // 最近7天
    correct: correctData.slice(-7),
    incorrect: incorrectData.slice(-7)
  }
})

/**
 * Chart.js 配置
 */
// 主題表現長條圖
const topicChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: '主題答題表現',
      font: { size: 16 }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '題數'
      }
    }
  }
}))

const topicChartData = computed(() => ({
  labels: topicStats.value.map(stat => stat.topic),
  datasets: [
    {
      label: '正確',
      data: topicStats.value.map(stat => stat.correct),
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1
    },
    {
      label: '錯誤',
      data: topicStats.value.map(stat => stat.incorrect),
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 1
    }
  ]
}))

// 難度分析圓餅圖
const difficultyChartData = computed(() => ({
  labels: difficultyStats.value.map(stat => stat.difficulty),
  datasets: [{
    data: difficultyStats.value.map(stat => stat.total),
    backgroundColor: [
      'rgba(34, 197, 94, 0.8)',  // 綠色 - 簡單
      'rgba(251, 146, 60, 0.8)', // 橙色 - 中等
      'rgba(239, 68, 68, 0.8)',  // 紅色 - 困難
      'rgba(156, 163, 175, 0.8)' // 灰色 - 未知
    ],
    borderColor: [
      'rgb(34, 197, 94)',
      'rgb(251, 146, 60)',
      'rgb(239, 68, 68)',
      'rgb(156, 163, 175)'
    ],
    borderWidth: 1
  }]
}))

const difficultyChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    title: {
      display: true,
      text: '難度分佈',
      font: { size: 16 }
    }
  }
}))

// 時間趨勢折線圖
const trendChartData = computed(() => ({
  labels: trendData.value.labels,
  datasets: [
    {
      label: '正確題數',
      data: trendData.value.correct,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: '錯誤題數',
      data: trendData.value.incorrect,
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: true
    }
  ]
}))

const trendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    title: {
      display: true,
      text: '答題趨勢（最近7天）',
      font: { size: 16 }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '題數'
      }
    }
  }
}))

/**
 * 工具函數
 */
// 計算平均答題時間
const calculateAverageTime = (history) => {
  if (history.length === 0) return 0
  const totalTime = history.reduce((sum, answer) => {
    return sum + (answer.timeSpent || 0)
  }, 0)
  return Math.round(totalTime / history.length / 1000) // 轉換為秒
}

// 計算當前連勝
const calculateCurrentStreak = (history) => {
  let streak = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].isCorrect) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// 格式化時間
const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

/**
 * 生命週期
 */
onMounted(async () => {
  try {
    answerHistory.value = getAnswerHistory()
    loading.value = false
  } catch (error) {
    console.error('Error loading statistics:', error)
    loading.value = false
  }
})

/**
 * 事件處理
 */
const refreshData = () => {
  answerHistory.value = getAnswerHistory()
}

const exportStats = () => {
  const data = {
    overallStats: overallStats.value,
    topicStats: topicStats.value,
    difficultyStats: difficultyStats.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `quizforge-stats-${new Date().toLocaleDateString('zh-TW')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// INC-011: 新增開始練習導航函數
const startPractice = () => {
  router.push('/topic-selection')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
    <!-- Header -->
    <div class="max-w-7xl mx-auto mb-8">
      <!-- Back Button -->
      <button
        @click="router.push('/')"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm md:text-base"
      >
        <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回主頁
      </button>

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">學習統計</h1>
          <p class="text-gray-600 mt-1">深入了解你的學習進度和表現</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="refreshData"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            刷新數據
          </button>
          <button
            @click="exportStats"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            導出統計
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16">
      <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
      <p class="text-gray-600 text-lg">載入統計數據中...</p>
    </div>

    <!-- Statistics Content -->
    <div v-else-if="answerHistory.length > 0" class="max-w-7xl mx-auto">
      <!-- Overall Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-blue-600">{{ overallStats.total }}</div>
          <div class="text-sm text-gray-600 mt-2">總答題數</div>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-green-600">{{ overallStats.correct }}</div>
          <div class="text-sm text-gray-600 mt-2">答對題數</div>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-red-600">{{ overallStats.incorrect }}</div>
          <div class="text-sm text-gray-600 mt-2">答錯題數</div>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-purple-600">{{ overallStats.accuracy }}%</div>
          <div class="text-sm text-gray-600 mt-2">正確率</div>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl font-bold text-orange-600">{{ overallStats.streak }}</div>
          <div class="text-sm text-gray-600 mt-2">連勝記錄</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Topic Performance -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="h-80">
            <Bar
              :data="topicChartData"
              :options="topicChartOptions"
            />
          </div>
          <!-- Topic Details -->
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">主題詳情</h3>
            <div class="space-y-3">
              <div
                v-for="topic in topicStats"
                :key="topic.topic"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ topic.topic }}</div>
                  <div class="text-sm text-gray-600">
                    {{ topic.total }} 題 · {{ topic.correct }} 對 {{ topic.incorrect }} 錯
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold" :class="topic.accuracy >= 70 ? 'text-green-600' : topic.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'">
                    {{ topic.accuracy }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Difficulty Analysis -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="h-80">
            <Doughnut
              :data="difficultyChartData"
              :options="difficultyChartOptions"
            />
          </div>
          <!-- Difficulty Details -->
          <div class="mt-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">難度分析</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="diff in difficultyStats"
                :key="diff.difficulty"
                class="p-3 border rounded-lg"
              >
                <div class="font-medium text-gray-900">{{ diff.difficulty }}</div>
                <div class="text-sm text-gray-600">
                  {{ diff.total }} 題 · 正確率 {{ diff.accuracy }}%
                </div>
                <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full"
                    :class="diff.accuracy >= 70 ? 'bg-green-500' : diff.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
                    :style="{ width: `${diff.accuracy}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Time Trend -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div class="h-96">
          <Line
            :data="trendChartData"
            :options="trendChartOptions"
          />
        </div>
      </div>

      <!-- Performance Insights -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">學習洞察</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="text-lg font-semibold text-blue-900 mb-2">平均答題時間</div>
            <div class="text-2xl font-bold text-blue-600">
              {{ formatTime(overallStats.avgTime) }}
            </div>
            <div class="text-sm text-blue-700 mt-1">每題平均耗時</div>
          </div>
          <div class="p-4 bg-green-50 rounded-lg">
            <div class="text-lg font-semibold text-green-900 mb-2">最佳表現主題</div>
            <div class="text-xl font-bold text-green-600">
              {{ topicStats.length > 0 ? topicStats.sort((a, b) => b.accuracy - a.accuracy)[0].topic : 'N/A' }}
            </div>
            <div class="text-sm text-green-700 mt-1">
              {{ topicStats.length > 0 ? `${topicStats.sort((a, b) => b.accuracy - a.accuracy)[0].accuracy}% 正確率` : '' }}
            </div>
          </div>
          <div class="p-4 bg-purple-50 rounded-lg">
            <div class="text-lg font-semibold text-purple-900 mb-2">學習活躍度</div>
            <div class="text-2xl font-bold text-purple-600">
              {{ trendData.labels.length }} 天
            </div>
            <div class="text-sm text-purple-700 mt-1">學習天數</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 bg-white rounded-lg shadow max-w-4xl mx-auto">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p class="text-gray-600 text-lg mb-4">尚無統計數據</p>
      <p class="text-gray-500 mb-6">開始答題後即可查看詳細的學習統計</p>
      <button
        @click="startPractice"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        開始練習
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 確保圖表響應式 */
.h-80 {
  height: 20rem;
}

.h-96 {
  height: 24rem;
}

/* 平滑動畫 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>