import { defineStore } from 'pinia'

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

    // 當前過濾條件
    currentFilters: {
      topic: null,      // Formula 主題代碼 (e.g., "L21201")
      difficulty: null, // 難度 ("simple" | "medium" | "hard")
      subject: null     // 科目 ("L21" | "L23")
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
     * 取得所有 Formula 主題列表
     * @returns {string[]}
     */
    topicList: (state) => {
      const topics = new Set(state.questions.map(q => q.topic))
      return Array.from(topics).sort()
    },

    /**
     * 取得所有科目列表
     * @returns {string[]}
     */
    subjectList: (state) => {
      const subjects = new Set(state.questions.map(q => q.subject))
      return Array.from(subjects).sort()
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
     * @returns {Question[]}
     */
    currentQuestions: (state) => {
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
    }
  },

  /**
   * Actions Definition
   * Formula: Actions = {loadQuestions(source?) + filterByTopic(topic) + filterByDifficulty(difficulty) + resetFilters()}
   */
  actions: {
    /**
     * 載入題庫 JSON 資料
     * Formula: fetch(/questions/*.json) -> merge -> state.questions
     * @param {string[]} sources - 要載入的資料來源 (預設載入全部)
     */
    async loadQuestions(sources = ['official-questions', 'L21-mock-exam', 'L23-mock-exam']) {
      this.loading = true
      this.error = null

      try {
        const allQuestions = []

        // 載入所有指定的 JSON 檔案
        for (const source of sources) {
          const response = await fetch(`/questions/${source}.json`)
          if (!response.ok) {
            throw new Error(`Failed to load ${source}.json: ${response.statusText}`)
          }

          const data = await response.json()

          // 合併題目陣列
          if (data.questions && Array.isArray(data.questions)) {
            allQuestions.push(...data.questions)
          }
        }

        // 更新 state
        this.questions = allQuestions
        this.filteredQuestions = []

        // 計算統計資訊
        this.calculateStats()

        console.log(`✅ Successfully loaded ${allQuestions.length} questions`)

      } catch (err) {
        this.error = err.message
        console.error('❌ Error loading questions:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * 計算題庫統計資訊
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
      this.stats.byTopic = this.questions.reduce((acc, q) => {
        acc[q.topic] = (acc[q.topic] || 0) + 1
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
     * 按難度過濾
     * Formula: set currentFilters.difficulty -> update filteredQuestions
     * @param {string} difficulty - 難度等級
     */
    filterByDifficulty(difficulty) {
      this.currentFilters.difficulty = difficulty
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
     */
    applyFilters() {
      let result = this.questions

      // 按科目過濾
      if (this.currentFilters.subject) {
        result = result.filter(q => q.subject === this.currentFilters.subject)
      }

      // 按 Formula 主題過濾
      if (this.currentFilters.topic) {
        result = result.filter(q => q.topic === this.currentFilters.topic)
      }

      // 按難度過濾
      if (this.currentFilters.difficulty) {
        result = result.filter(q => q.difficulty === this.currentFilters.difficulty)
      }

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
        subject: null
      }
      this.filteredQuestions = []
      console.log('🔄 Filters reset - showing all questions')
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
      const shuffled = [...source].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, count)
    }
  }
})
