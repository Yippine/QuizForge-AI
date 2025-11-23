import { defineStore } from 'pinia'
import { useAnswerTracking } from '../composables/useAnswerTracking'
import { loadAllQuestions } from '../utils/ipasQuestionLoader'
import { ALL_TOPICS, SUBJECTS, OFFICIAL_TOPICS, extractTopicID } from '../constants/ipas'

/**
 * Question Data Model
 * @typedef {Object} Question
 * @property {string} question_id - 唯一識別碼 (e.g., "OFF_L21_CH3_001")
 * @property {string} source - 題目來源 (e.g., "講義練習題-科目1-第3章-第1題")
 * @property {string} subject - 科目代碼 (L21 or L23)
 * @property {string} subject_name - 科目名稱
 * @property {string} chapter - 章節 (e.g., "第3章 AI相關技術應用")
 * @property {string} topic - Formula主題代碼 (e.g., "L21201_自然語言處理")
 * @property {string} difficulty - 難度 ("simple" | "medium" | "hard")
 * @property {string} question - 題目內容
 * @property {Object} options - 選項 {A: string, B: string, C: string, D: string}
 * @property {string} answer - 正確答案 ("A" | "B" | "C" | "D")
 * @property {string} answer_text - 正確答案文字
 * @property {string} explanation - 解析說明
 * @property {string[]} keywords - 關鍵字陣列
 */

/**
 * QuestionBank Store - 題庫狀態管理
 * Formula: defineStore(questionBank) -> {State + Getters + Actions}
 */
export const useQuestionBankStore = defineStore('questionBank', {
  /**
   * State Definition
   * Formula: State = {questions: [] + filteredQuestions: [] + currentFilters: {topic: null, difficulty: null} + loading: false + error: null}
   */
  state: () => ({
    // 所有題目 (354 questions total)
    questions: [],

    // 過濾後的題目
    filteredQuestions: [],

    // INC-019: 打亂後的題目（用於隨機模式）
    shuffledQuestions: null,

    // 當前過濾條件
    currentFilters: {
      topic: null,      // Formula 主題代碼 (e.g., "L21201")
      difficulty: null, // 難度 ("simple" | "medium" | "hard") - 單一難度過濾
      difficulties: [], // INC-021: 多難度過濾 (string[])
      subject: null,    // 科目 ("L21" | "L23")
      source: 'all'     // INC-045: 來源過濾 ('all' | 'official' | 'ai')
    },

    // 載入狀態
    loading: false,

    // 錯誤訊息
    error: null,

    // 題庫統計資訊
    stats: {
      totalQuestions: 0,
      bySource: {},
      bySubject: {},
      byTopic: {},
      byDifficulty: {}
    },

    // 統計計算快取
    statisticsCache: {
      lastUpdated: null,
      userStats: null,
      topicPerformance: null,
      difficultyPerformance: null,
      timeSeriesData: null
    }
  }),

  /**
   * Getters Definition
   * Formula: Getters = {questionsByTopic(topic) + questionsByDifficulty(difficulty) + topicList() + difficultyStats()}
   */
  getters: {
    /**
     * 按 Formula 主題過濾題目
     * @param {string} topic - Formula 主題代碼
     * @returns {Question[]}
     */
    questionsByTopic: (state) => (topic) => {
      if (!topic) return state.questions
      return state.questions.filter(q => q.topic === topic)
    },

    /**
     * 按難度過濾題目
     * @param {string} difficulty - 難度等級
     * @returns {Question[]}
     */
    questionsByDifficulty: (state) => (difficulty) => {
      if (!difficulty) return state.questions
      return state.questions.filter(q => q.difficulty === difficulty)
    },

    /**
     * 按科目過濾題目
     * @param {string} subject - 科目代碼
     * @returns {Question[]}
     */
    questionsBySubject: (state) => (subject) => {
      if (!subject) return state.questions
      return state.questions.filter(q => q.subject === subject)
    },

    /**
     * 取得所有 Formula 主題列表 (從 constants 取得完整定義)
     * @returns {TopicType[]} 包含完整主題資訊的陣列
     */
    topicList: () => {
      return ALL_TOPICS
    },

    /**
     * 取得所有科目列表 (從 constants 取得完整定義)
     * @returns {SubjectType[]} 包含完整科目資訊的陣列
     */
    subjectList: () => {
      return Object.values(SUBJECTS)
    },

    /**
     * 難度統計
     * @returns {Object} {simple: number, medium: number, hard: number}
     */
    difficultyStats: (state) => {
      const stats = { simple: 0, medium: 0, hard: 0 }
      state.questions.forEach(q => {
        if (stats[q.difficulty] !== undefined) {
          stats[q.difficulty]++
        }
      })
      return stats
    },

    /**
     * 取得當前過濾結果
     * INC-019: 優先返回打亂的題目（如果有設定）
     * @returns {Question[]}
     */
    currentQuestions: (state) => {
      // INC-019: 如果有打亂的題目，優先返回
      if (state.shuffledQuestions !== null) {
        return state.shuffledQuestions
      }
      return state.filteredQuestions.length > 0
        ? state.filteredQuestions
        : state.questions
    },

    /**
     * 檢查是否有套用過濾
     * @returns {boolean}
     */
    hasActiveFilters: (state) => {
      return !!(state.currentFilters.topic ||
                state.currentFilters.difficulty ||
                state.currentFilters.subject)
    },

    /**
     * 取得使用者統計資訊
     * @returns {Object} 用戶答題統計
     */
    userStatistics: (state) => {
      if (!state.statisticsCache.userStats) {
        return {
          totalAnswered: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          accuracy: 0,
          averageTimePerQuestion: 0,
          currentStreak: 0,
          bestStreak: 0,
          studyDays: 0,
          lastStudyDate: null
        }
      }
      return state.statisticsCache.userStats
    },

    /**
     * 取得主題表現統計
     * @returns {Array} 主題表現資料
     */
    topicPerformance: (state) => {
      if (!state.statisticsCache.topicPerformance) {
        return []
      }
      return state.statisticsCache.topicPerformance
    },

    /**
     * 取得難度表現統計
     * @returns {Array} 難度表現資料
     */
    difficultyPerformance: (state) => {
      if (!state.statisticsCache.difficultyPerformance) {
        return []
      }
      return state.statisticsCache.difficultyPerformance
    },

    /**
     * 取得時間序列資料
     * @returns {Object} 時間趨勢資料
     */
    timeSeriesData: (state) => {
      if (!state.statisticsCache.timeSeriesData) {
        return {
          dailyData: [],
          weeklyData: [],
          monthlyData: []
        }
      }
      return state.statisticsCache.timeSeriesData
    }
  },

  /**
   * Actions Definition
   * Formula: Actions = {loadQuestions(source?) + filterByTopic(topic) + filterByDifficulty(difficulty) + resetFilters()}
   */
  actions: {
    /**
     * 載入題庫 JSON 資料 (使用 ipasQuestionLoader 統一載入)
     * Formula: loadAllQuestions() -> normalize -> merge -> state.questions
     */
    async loadQuestions() {
      this.loading = true
      this.error = null

      try {
        // 使用新的 loadAllQuestions 函數統一載入所有題庫
        const allQuestions = await loadAllQuestions()

        if (allQuestions.length === 0) {
          throw new Error('No questions loaded. Please check question files.')
        }

        // 更新 state
        this.questions = allQuestions
        this.filteredQuestions = []

        // 計算統計資訊
        this.calculateStats()

        console.log(`✅ Successfully loaded ${allQuestions.length} questions from IPAS question loader`)
        console.log(`📊 Stats: ${this.stats.bySubject.L21 || 0} L21 questions, ${this.stats.bySubject.L23 || 0} L23 questions`)
        console.log(`📚 Topics available: ${ALL_TOPICS.length} topics`)

      } catch (err) {
        this.error = err.message
        console.error('❌ Error loading questions:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * 計算題庫統計資訊
     * INC-013-HOTFIX: 使用 extractTopicID 標準化主題ID進行統計
     */
    calculateStats() {
      this.stats.totalQuestions = this.questions.length

      // 按來源統計
      this.stats.bySource = this.questions.reduce((acc, q) => {
        acc[q.source] = (acc[q.source] || 0) + 1
        return acc
      }, {})

      // 按科目統計
      this.stats.bySubject = this.questions.reduce((acc, q) => {
        acc[q.subject] = (acc[q.subject] || 0) + 1
        return acc
      }, {})

      // 按 Formula 主題統計
      // INC-013-HOTFIX: 標準化主題ID進行統計
      this.stats.byTopic = this.questions.reduce((acc, q) => {
        const topicId = extractTopicID(q.topic) || q.topic
        acc[topicId] = (acc[topicId] || 0) + 1
        return acc
      }, {})

      // 按難度統計
      this.stats.byDifficulty = this.questions.reduce((acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
        return acc
      }, {})
    },

    /**
     * 按 Formula 主題過濾
     * Formula: set currentFilters.topic -> update filteredQuestions
     * @param {string} topic - Formula 主題代碼
     */
    filterByTopic(topic) {
      this.currentFilters.topic = topic
      this.applyFilters()
    },

    /**
     * 按難度過濾（單一難度）
     * Formula: set currentFilters.difficulty -> update filteredQuestions
     * @param {string} difficulty - 難度等級
     */
    filterByDifficulty(difficulty) {
      this.currentFilters.difficulty = difficulty
      this.applyFilters()
    },

    /**
     * INC-021: 按多個難度過濾
     * Formula: set currentFilters.difficulties -> update filteredQuestions
     * @param {string[]} difficulties - 難度等級陣列
     */
    filterByDifficulties(difficulties) {
      this.currentFilters.difficulties = difficulties
      this.applyFilters()
    },

    /**
     * 按科目過濾
     * Formula: set currentFilters.subject -> update filteredQuestions
     * @param {string} subject - 科目代碼
     */
    filterBySubject(subject) {
      this.currentFilters.subject = subject
      this.applyFilters()
    },

    /**
     * 套用所有過濾條件 (AND 邏輯)
     * Formula: questions.filter(topic & difficulty & subject)
     * INC-013-HOTFIX: 使用 extractTopicID 進行主題ID比對
     * INC-014: 支援官方題目子主題過濾 (使用 sourcePattern)
     */
    applyFilters() {
      let result = this.questions

      // INC-046: 按科目過濾（不應排除官方題目，來源過濾由 source 控制）
      if (this.currentFilters.subject) {
        result = result.filter(q => q.subject === this.currentFilters.subject)
      }

      // 按 Formula 主題過濾
      // INC-013-HOTFIX: 統一提取主題ID進行比對
      // INC-014: 官方題目子主題過濾 (使用 sourcePattern)
      if (this.currentFilters.topic) {
        const targetTopicId = this.currentFilters.topic

        // INC-014: 檢查是否為官方題目子主題
        if (targetTopicId === 'OFFICIAL') {
          // OFFICIAL 主題：顯示所有官方題目
          result = result.filter(q => q.question_id.startsWith('OFF_'))
        } else if (targetTopicId.startsWith('OFF_')) {
          // 官方題目子主題：根據 sourcePattern 過濾
          const officialTopic = OFFICIAL_TOPICS.find(t => t.id === targetTopicId)
          if (officialTopic && officialTopic.sourcePattern) {
            result = result.filter(q =>
              q.source && q.source.includes(officialTopic.sourcePattern)
            )
          }
        } else {
          // 一般主題：使用 extractTopicID 進行主題ID比對
          result = result.filter(q => {
            // 標準化題目的主題ID (處理可能的完整格式)
            const questionTopicId = extractTopicID(q.topic) || q.topic
            return questionTopicId === targetTopicId
          })
        }
      }

      // 按難度過濾
      // INC-021: 優先使用 difficulties 陣列，向後相容 difficulty 單值
      if (this.currentFilters.difficulties && this.currentFilters.difficulties.length > 0) {
        result = result.filter(q => this.currentFilters.difficulties.includes(q.difficulty))
      } else if (this.currentFilters.difficulty) {
        result = result.filter(q => q.difficulty === this.currentFilters.difficulty)
      }

      // INC-045: 按來源過濾
      if (this.currentFilters.source === 'official') {
        result = result.filter(q => q.question_id.startsWith('OFF_'))
      } else if (this.currentFilters.source === 'ai') {
        result = result.filter(q => !q.question_id.startsWith('OFF_'))
      }
      // source === 'all' 時不過濾

      this.filteredQuestions = result

      console.log(`🔍 Filtered: ${result.length} questions match current filters`, this.currentFilters)
    },

    /**
     * 重置所有過濾條件
     * Formula: clear currentFilters -> show all questions
     */
    resetFilters() {
      this.currentFilters = {
        topic: null,
        difficulty: null,
        difficulties: [], // INC-021: 清除多難度過濾
        subject: null,
        source: 'all'     // INC-045: 重置來源過濾
      }
      this.filteredQuestions = []
      this.shuffledQuestions = null  // INC-019: 同時清除打亂的題目
      console.log('🔄 Filters reset - showing all questions')
    },

    /**
     * INC-019: 設置打亂的題目
     * @param {Question[]} questions - 打亂後的題目陣列
     */
    setShuffledQuestions(questions) {
      this.shuffledQuestions = questions
      console.log(`🔀 Shuffled questions set: ${questions.length} questions`)
    },

    /**
     * INC-019: 清除打亂的題目
     */
    clearShuffledQuestions() {
      this.shuffledQuestions = null
      console.log('🔄 Shuffled questions cleared')
    },

    /**
     * INC-045: 按題目來源過濾（重構版本）
     * Formula: filterBySource(source) = (this.currentFilters.source = source) -> this.applyFilters()
     * @param {string} source - 來源類型 ('all' | 'official' | 'ai')
     */
    filterBySource(source) {
      this.currentFilters.source = source
      this.applyFilters()
    },

    /**
     * 依 question_id 取得單一題目
     * @param {string} questionId
     * @returns {Question | undefined}
     */
    getQuestionById(questionId) {
      return this.questions.find(q => q.question_id === questionId)
    },

    /**
     * 隨機抽取題目
     * @param {number} count - 要抽取的題數
     * @returns {Question[]}
     */
    getRandomQuestions(count = 10) {
      const source = this.hasActiveFilters ? this.filteredQuestions : this.questions
      // 使用 Fisher-Yates 洗牌算法，確保真正的隨機性
      const shuffled = [...source]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled.slice(0, count)
    },

    /**
     * 計算使用者統計資訊
     * Formula: calculateUserStatistics() -> UserStats & PerformanceAnalysis & TimeSeries
     */
    calculateUserStatistics() {
      const { getAnswerHistory } = useAnswerTracking()
      const answerHistory = getAnswerHistory()

      if (answerHistory.length === 0) {
        // 沒有答題記錄時返回預設值
        this.statisticsCache.userStats = {
          totalAnswered: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          accuracy: 0,
          averageTimePerQuestion: 0,
          currentStreak: 0,
          bestStreak: 0,
          studyDays: 0,
          lastStudyDate: null
        }
        this.statisticsCache.topicPerformance = []
        this.statisticsCache.difficultyPerformance = []
        this.statisticsCache.timeSeriesData = {
          dailyData: [],
          weeklyData: [],
          monthlyData: []
        }
        this.statisticsCache.lastUpdated = new Date().toISOString()
        return
      }

      // 計算基本統計
      const totalAnswered = answerHistory.length
      const correctAnswers = answerHistory.filter(a => a.isCorrect).length
      const incorrectAnswers = totalAnswered - correctAnswers
      const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0

      // 計算平均答題時間
      const totalTime = answerHistory.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
      const averageTimePerQuestion = totalAnswered > 0 ? Math.round(totalTime / totalAnswered / 1000) : 0

      // 計算連勝記錄
      const { currentStreak, bestStreak } = this.calculateStreaks(answerHistory)

      // 計算學習天數
      const uniqueDates = new Set(answerHistory.map(a => new Date(a.timestamp).toDateString()))
      const studyDays = uniqueDates.size

      // 最後學習日期
      const lastStudyDate = answerHistory.length > 0
        ? new Date(Math.max(...answerHistory.map(a => new Date(a.timestamp))))
        : null

      // 更新用戶統計
      this.statisticsCache.userStats = {
        totalAnswered,
        correctAnswers,
        incorrectAnswers,
        accuracy,
        averageTimePerQuestion,
        currentStreak,
        bestStreak,
        studyDays,
        lastStudyDate: lastStudyDate ? lastStudyDate.toISOString() : null
      }

      // 計算主題表現
      this.statisticsCache.topicPerformance = this.calculateTopicPerformance(answerHistory)

      // 計算難度表現
      this.statisticsCache.difficultyPerformance = this.calculateDifficultyPerformance(answerHistory)

      // 計算時間序列資料
      this.statisticsCache.timeSeriesData = this.calculateTimeSeriesData(answerHistory)

      this.statisticsCache.lastUpdated = new Date().toISOString()

      console.log('📊 User statistics calculated and cached')
    },

    /**
     * 計算連勝記錄
     * @param {Array} answerHistory - 答題歷史
     * @returns {Object} 連勝統計
     */
    calculateStreaks(answerHistory) {
      let currentStreak = 0
      let bestStreak = 0
      let tempStreak = 0

      for (const answer of answerHistory) {
        if (answer.isCorrect) {
          tempStreak++
          bestStreak = Math.max(bestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }

      // 計算當前連勝（從最後開始往回數）
      currentStreak = 0
      for (let i = answerHistory.length - 1; i >= 0; i--) {
        if (answerHistory[i].isCorrect) {
          currentStreak++
        } else {
          break
        }
      }

      return { currentStreak, bestStreak }
    },

    /**
     * 計算主題表現
     * @param {Array} answerHistory - 答題歷史
     * @returns {Array} 主題表現統計
     */
    calculateTopicPerformance(answerHistory) {
      const topicMap = new Map()

      answerHistory.forEach(answer => {
        const topic = answer.topic || '未知主題'
        if (!topicMap.has(topic)) {
          topicMap.set(topic, {
            topic,
            total: 0,
            correct: 0,
            incorrect: 0,
            accuracy: 0,
            totalTime: 0,
            averageTime: 0
          })
        }

        const stats = topicMap.get(topic)
        stats.total++
        stats.totalTime += answer.timeSpent || 0

        if (answer.isCorrect) {
          stats.correct++
        } else {
          stats.incorrect++
        }
      })

      // 計算最終統計
      const performance = Array.from(topicMap.values()).map(stats => ({
        ...stats,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        averageTime: stats.total > 0 ? Math.round(stats.totalTime / stats.total / 1000) : 0
      }))

      // 按總題數排序
      return performance.sort((a, b) => b.total - a.total)
    },

    /**
     * 計算難度表現
     * @param {Array} answerHistory - 答題歷史
     * @returns {Array} 難度表現統計
     */
    calculateDifficultyPerformance(answerHistory) {
      const difficultyMap = new Map()
      const difficultyNames = {
        'simple': '簡單',
        'medium': '中等',
        'hard': '困難'
      }

      answerHistory.forEach(answer => {
        const difficulty = answer.difficulty || 'unknown'
        if (!difficultyMap.has(difficulty)) {
          difficultyMap.set(difficulty, {
            difficulty: difficultyNames[difficulty] || difficulty,
            total: 0,
            correct: 0,
            incorrect: 0,
            accuracy: 0,
            totalTime: 0,
            averageTime: 0
          })
        }

        const stats = difficultyMap.get(difficulty)
        stats.total++
        stats.totalTime += answer.timeSpent || 0

        if (answer.isCorrect) {
          stats.correct++
        } else {
          stats.incorrect++
        }
      })

      // 計算最終統計
      const performance = Array.from(difficultyMap.values()).map(stats => ({
        ...stats,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        averageTime: stats.total > 0 ? Math.round(stats.totalTime / stats.total / 1000) : 0
      }))

      // 按難度排序：簡單 -> 中等 -> 困難
      const difficultyOrder = ['simple', 'medium', 'hard', 'unknown']
      return performance.sort((a, b) => {
        const aIndex = difficultyOrder.indexOf(a.difficulty)
        const bIndex = difficultyOrder.indexOf(b.difficulty)
        return aIndex - bIndex
      })
    },

    /**
     * 計算時間序列資料
     * @param {Array} answerHistory - 答題歷史
     * @returns {Object} 時間序列資料
     */
    calculateTimeSeriesData(answerHistory) {
      const dailyMap = new Map()
      const weeklyMap = new Map()
      const monthlyMap = new Map()

      answerHistory.forEach(answer => {
        const date = new Date(answer.timestamp)

        // 每日資料
        const dayKey = date.toLocaleDateString('zh-TW')
        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, { date: dayKey, correct: 0, incorrect: 0, total: 0 })
        }
        const dayStats = dailyMap.get(dayKey)
        dayStats.total++
        if (answer.isCorrect) {
          dayStats.correct++
        } else {
          dayStats.incorrect++
        }

        // 每週資料
        const weekKey = this.getWeekKey(date)
        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, { week: weekKey, correct: 0, incorrect: 0, total: 0 })
        }
        const weekStats = weeklyMap.get(weekKey)
        weekStats.total++
        if (answer.isCorrect) {
          weekStats.correct++
        } else {
          weekStats.incorrect++
        }

        // 每月資料
        const monthKey = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { month: monthKey, correct: 0, incorrect: 0, total: 0 })
        }
        const monthStats = monthlyMap.get(monthKey)
        monthStats.total++
        if (answer.isCorrect) {
          monthStats.correct++
        } else {
          monthStats.incorrect++
        }
      })

      return {
        dailyData: Array.from(dailyMap.values()).slice(-30), // 最近30天
        weeklyData: Array.from(weeklyMap.values()).slice(-12), // 最近12週
        monthlyData: Array.from(monthlyMap.values()) // 所有月份
      }
    },

    /**
     * 取得週的標識符
     * @param {Date} date - 日期
     * @returns {string} 週標識符
     */
    getWeekKey(date) {
      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const weekNumber = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
      return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
    },

    /**
     * 清除統計快取
     */
    clearStatisticsCache() {
      this.statisticsCache = {
        lastUpdated: null,
        userStats: null,
        topicPerformance: null,
        difficultyPerformance: null,
        timeSeriesData: null
      }
    },

    /**
     * 檢查統計快取是否需要更新
     * @returns {boolean} 是否需要更新
     */
    needsStatisticsUpdate() {
      const { getAnswerHistory } = useAnswerTracking()
      const answerHistory = getAnswerHistory()

      // 如果沒有快取，需要更新
      if (!this.statisticsCache.lastUpdated) {
        return true
      }

      // 如果答題記錄變化，需要更新
      if (answerHistory.length === 0 && this.statisticsCache.userStats?.totalAnswered > 0) {
        return true
      }

      if (answerHistory.length !== this.statisticsCache.userStats?.totalAnswered) {
        return true
      }

      // 如果快取超過5分鐘，可以考慮更新（可選）
      const cacheAge = new Date() - new Date(this.statisticsCache.lastUpdated)
      const fiveMinutes = 5 * 60 * 1000

      return cacheAge > fiveMinutes
    },

    /**
     * 取得統計資料（自動更新快取）
     * @returns {Object} 完整統計資料
     */
    getStatisticsData() {
      if (this.needsStatisticsUpdate()) {
        this.calculateUserStatistics()
      }

      return {
        userStats: this.userStatistics,
        topicPerformance: this.topicPerformance,
        difficultyPerformance: this.difficultyPerformance,
        timeSeriesData: this.timeSeriesData,
        lastUpdated: this.statisticsCache.lastUpdated
      }
    }
  }
})
