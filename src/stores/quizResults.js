/**
 * QuizResults Store - 答題結果狀態管理
 * Formula: defineStore(quizResults) -> {State + Getters + Actions}
 * Responsibility: 管理答題結果數據，用於結果頁面顯示
 * INC-017: Quiz completion page implementation
 */
import { defineStore } from 'pinia'

export const useQuizResultsStore = defineStore('quizResults', {
  /**
   * State Definition
   * Formula: State = {results + quizConfig + timestamp}
   */
  state: () => ({
    // 答題結果數據
    results: {
      totalQuestions: 0,      // 總題數
      correctCount: 0,         // 正確題數
      incorrectCount: 0,       // 錯誤題數
      accuracy: 0,             // 答對率（百分比）
      elapsedTime: 0,          // 總用時（毫秒）
      formattedTime: '',       // 格式化時間（如：3分25秒）

      // 所有題目的答題狀態
      questionResults: [],     // Array<{question, userAnswer, correctAnswer, isCorrect}>

      // 錯題列表
      wrongQuestions: []       // Array<{question, userAnswer, correctAnswer}>
    },

    // 答題配置（用於重新練習）
    quizConfig: {
      topicId: null,           // 主題 ID
      mode: 'practice',        // 練習/考試模式
      questionIds: [],         // 題目 ID 列表
      questionCount: null,     // 題數限制
      timeLimit: null,         // 時間限制（分鐘）
      sessionSeed: null,       // INC-019-HOTFIX: Session seed for options shuffling
      shouldShuffleOptions: false  // INC-019-HOTFIX: Whether options were shuffled
    },

    // 結果時間戳
    timestamp: null
  }),

  /**
   * Getters Definition
   */
  getters: {
    /**
     * 是否有結果數據
     */
    hasResults: (state) => {
      return state.results.totalQuestions > 0
    },

    /**
     * 取得錯題數量
     */
    wrongQuestionsCount: (state) => {
      return state.results.wrongQuestions.length
    },

    /**
     * 是否全部答對
     */
    isPerfectScore: (state) => {
      return state.results.accuracy === 100 && state.results.totalQuestions > 0
    }
  },

  /**
   * Actions Definition
   */
  actions: {
    /**
     * 保存答題結果
     * Formula: saveResults(data) -> update state
     * @param {Object} resultsData - 結果數據
     */
    saveResults(resultsData) {
      const {
        totalQuestions,
        correctCount,
        incorrectCount,
        accuracy,
        elapsedTime,
        formattedTime,
        questionResults,
        wrongQuestions,
        quizConfig
      } = resultsData

      // 更新結果數據
      this.results = {
        totalQuestions,
        correctCount,
        incorrectCount,
        accuracy,
        elapsedTime,
        formattedTime,
        questionResults,
        wrongQuestions
      }

      // 更新配置
      this.quizConfig = quizConfig

      // 更新時間戳
      this.timestamp = new Date().toISOString()

      console.log('💾 Quiz results saved:', {
        totalQuestions,
        correctCount,
        accuracy: `${accuracy}%`,
        formattedTime,
        wrongQuestionsCount: wrongQuestions.length
      })
    },

    /**
     * 清除結果數據
     * Formula: clearResults() -> reset state
     */
    clearResults() {
      this.results = {
        totalQuestions: 0,
        correctCount: 0,
        incorrectCount: 0,
        accuracy: 0,
        elapsedTime: 0,
        formattedTime: '',
        questionResults: [],
        wrongQuestions: []
      }
      this.quizConfig = {
        topicId: null,
        mode: 'practice',
        questionIds: [],
        questionCount: null,
        timeLimit: null,
        sessionSeed: null,
        shouldShuffleOptions: false
      }
      this.timestamp = null

      console.log('🗑️ Quiz results cleared')
    },

    /**
     * 取得結果數據（用於結果頁面）
     * Formula: getResults() -> results + config
     */
    getResults() {
      return {
        results: this.results,
        quizConfig: this.quizConfig,
        timestamp: this.timestamp
      }
    }
  }
})
