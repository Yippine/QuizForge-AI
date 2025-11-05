/**
 * useAnswerTracking Composable
 * Formula: AnswerTracking = LocalStorageLayer × DataManagement × HistoryTracking × WrongQuestionsManagement
 *
 * Responsibility: 管理答題歷史和錯題本的 LocalStorage 操作
 *
 * Data Structures:
 * - answerHistory: AnswerRecord[] = {questionId, userAnswer, correctAnswer, isCorrect, timestamp, topic, difficulty}
 * - wrongQuestions: WrongQuestionRecord[] = {questionId, wrongCount, lastWrongTime, attempts[]}
 */

import { ref, computed } from 'vue'

// LocalStorage Keys
const STORAGE_KEYS = {
  ANSWER_HISTORY: 'quizforge_answer_history',
  WRONG_QUESTIONS: 'quizforge_wrong_questions'
}

/**
 * Load data from LocalStorage
 * Formula: loadFromStorage(key) -> ParsedData | EmptyArray
 */
const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error)
    return []
  }
}

/**
 * Save data to LocalStorage
 * Formula: saveToStorage(key, data) -> StorageUpdate
 */
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error)
    return false
  }
}

export function useAnswerTracking() {
  // Reactive state
  const answerHistory = ref(loadFromStorage(STORAGE_KEYS.ANSWER_HISTORY))
  const wrongQuestions = ref(loadFromStorage(STORAGE_KEYS.WRONG_QUESTIONS))

  /**
   * Save answer and update wrong questions if incorrect
   * Formula: saveAnswer(answerData) -> UpdateHistory & UpdateWrongQuestions & PersistToStorage
   */
  const saveAnswer = (answerData) => {
    // Validate input
    if (!answerData || !answerData.questionId) {
      console.error('Invalid answer data:', answerData)
      return false
    }

    // Add to answer history
    const historyRecord = {
      questionId: answerData.questionId,
      userAnswer: answerData.userAnswer,
      correctAnswer: answerData.correctAnswer,
      isCorrect: answerData.isCorrect,
      timestamp: answerData.timestamp || new Date().toISOString(),
      topic: answerData.topic || '',
      difficulty: answerData.difficulty || ''
    }

    answerHistory.value.push(historyRecord)
    saveToStorage(STORAGE_KEYS.ANSWER_HISTORY, answerHistory.value)

    // Update wrong questions if incorrect
    if (!answerData.isCorrect) {
      updateWrongQuestion(answerData)
    } else {
      // If answered correctly, check if we should remove from wrong questions
      // We'll keep it for history tracking, but mark it as improved
      const wrongIndex = wrongQuestions.value.findIndex(
        q => q.questionId === answerData.questionId
      )

      if (wrongIndex !== -1) {
        const wrong = wrongQuestions.value[wrongIndex]
        wrong.attempts.push({
          timestamp: historyRecord.timestamp,
          isCorrect: true
        })
        saveToStorage(STORAGE_KEYS.WRONG_QUESTIONS, wrongQuestions.value)
      }
    }

    return true
  }

  /**
   * Update wrong questions record
   * Formula: updateWrongQuestion(answerData) -> WrongQuestionRecord & PersistToStorage
   */
  const updateWrongQuestion = (answerData) => {
    const existingIndex = wrongQuestions.value.findIndex(
      q => q.questionId === answerData.questionId
    )

    const attemptRecord = {
      timestamp: answerData.timestamp || new Date().toISOString(),
      isCorrect: false,
      userAnswer: answerData.userAnswer
    }

    if (existingIndex !== -1) {
      // Update existing wrong question record
      const existing = wrongQuestions.value[existingIndex]
      existing.wrongCount++
      existing.lastWrongTime = attemptRecord.timestamp
      existing.attempts.push(attemptRecord)
    } else {
      // Create new wrong question record
      wrongQuestions.value.push({
        questionId: answerData.questionId,
        wrongCount: 1,
        lastWrongTime: attemptRecord.timestamp,
        topic: answerData.topic || '',
        difficulty: answerData.difficulty || '',
        attempts: [attemptRecord]
      })
    }

    saveToStorage(STORAGE_KEYS.WRONG_QUESTIONS, wrongQuestions.value)
  }

  /**
   * Get answer history
   * Formula: getAnswerHistory() -> AnswerRecord[]
   */
  const getAnswerHistory = () => {
    return answerHistory.value
  }

  /**
   * Get wrong questions (only those not yet corrected)
   * Formula: getWrongQuestions() -> WrongQuestionRecord[]
   */
  const getWrongQuestions = () => {
    // Filter to only show questions that haven't been answered correctly yet
    return wrongQuestions.value.filter(q => {
      const lastAttempt = q.attempts[q.attempts.length - 1]
      return !lastAttempt.isCorrect
    })
  }

  /**
   * Get all wrong questions including corrected ones
   * Formula: getAllWrongQuestions() -> WrongQuestionRecord[]
   */
  const getAllWrongQuestions = () => {
    return wrongQuestions.value
  }

  /**
   * Clear all wrong questions
   * Formula: clearWrongQuestions() -> StorageUpdate
   */
  const clearWrongQuestions = () => {
    wrongQuestions.value = []
    saveToStorage(STORAGE_KEYS.WRONG_QUESTIONS, wrongQuestions.value)
    console.log('All wrong questions cleared')
    return true
  }

  /**
   * Remove specific question from wrong questions
   * Formula: removeFromWrongQuestions(questionId) -> StorageUpdate
   */
  const removeFromWrongQuestions = (questionId) => {
    const index = wrongQuestions.value.findIndex(q => q.questionId === questionId)
    if (index !== -1) {
      wrongQuestions.value.splice(index, 1)
      saveToStorage(STORAGE_KEYS.WRONG_QUESTIONS, wrongQuestions.value)
      console.log(`Removed question ${questionId} from wrong questions`)
      return true
    }
    return false
  }

  /**
   * Get wrong questions count
   * Formula: getWrongQuestionsCount() -> Number
   */
  const getWrongQuestionsCount = () => {
    return getWrongQuestions().length
  }

  /**
   * Clear all answer history
   * Formula: clearAnswerHistory() -> StorageUpdate
   */
  const clearAnswerHistory = () => {
    answerHistory.value = []
    saveToStorage(STORAGE_KEYS.ANSWER_HISTORY, answerHistory.value)
    console.log('All answer history cleared')
    return true
  }

  /**
   * Get statistics
   * Formula: getStatistics() -> {total, correct, incorrect, accuracy}
   */
  const getStatistics = () => {
    const total = answerHistory.value.length
    const correct = answerHistory.value.filter(a => a.isCorrect).length
    const incorrect = total - correct
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    return {
      total,
      correct,
      incorrect,
      accuracy
    }
  }

  // Computed properties
  const wrongQuestionsCount = computed(() => getWrongQuestionsCount())
  const statistics = computed(() => getStatistics())

  // Return API
  return {
    // State
    answerHistory,
    wrongQuestions,

    // Actions
    saveAnswer,
    getAnswerHistory,
    getWrongQuestions,
    getAllWrongQuestions,
    clearWrongQuestions,
    removeFromWrongQuestions,
    getWrongQuestionsCount,
    clearAnswerHistory,
    getStatistics,

    // Computed
    wrongQuestionsCount,
    statistics
  }
}
