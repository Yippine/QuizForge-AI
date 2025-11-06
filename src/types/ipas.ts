/**
 * IPAS Type System
 * Formula: TypeSystem = SubjectType + TopicType + QuestionType + HelperTypes
 * Purpose: 提供 IPAS 題庫系統的完整類型定義
 */

/**
 * 科目類型
 * Formula: SubjectType = {id: SubjectId, name: string, shortName: string, description?: string}
 */
export interface SubjectType {
  id: 'L21' | 'L23'
  name: string
  shortName: string
  description?: string
}

/**
 * 主題類型
 * Formula: TopicType = {id: string, subjectId: SubjectId, name: string, fullName: string, description?: string, sequence: number}
 */
export interface TopicType {
  id: string // e.g., "L21101", "L23201", "OFFICIAL", "OFF_L21"
  subjectId: 'L21' | 'L23' | 'OFFICIAL' // 支援官方題目獨立科目
  name: string // 簡短名稱，e.g., "自然語言處理技術與應用"
  fullName: string // 完整名稱，e.g., "L21101-自然語言處理技術與應用"
  description?: string
  sequence: number // 排序編號
  icon?: string // 圖示 emoji
  sourcePattern?: string // 用於過濾官方題目的來源模式
}

/**
 * 題目選項類型
 */
export interface QuestionOptions {
  A: string
  B: string
  C: string
  D: string
}

/**
 * 題目類型
 * Formula: QuestionType = {question_id + subject + topic + difficulty + question + options + answer + explanation + metadata}
 * 統一支援兩種格式：L21101_001 (mock exam) 和 OFF_L21_CH3_001 (official)
 */
export interface QuestionType {
  question_id: string // 唯一識別碼
  sequence?: number // 題號
  subject: 'L21' | 'L23' // 科目代碼
  subject_name?: string // 科目名稱
  topic: string // Formula主題代碼，e.g., "L21101-自然語言處理技術與應用"
  chapter?: string // 章節 (official questions)
  difficulty: 'simple' | 'medium' | 'hard' // 難度
  question_type?: string // 題型 (mock exam)
  question: string // 題目內容
  options: QuestionOptions // 選項
  answer: 'A' | 'B' | 'C' | 'D' // 正確答案
  answer_text?: string // 答案文字 (official questions)
  explanation: string // 解析說明
  keywords: string[] // 關鍵字
  source?: string // 來源 (official questions)
  reference?: string // 參考資料 (mock exam)
}

/**
 * 題目來源類型
 */
export type QuestionSourceType = 'mock-exam' | 'official-questions' | 'textbook-exercises'

/**
 * 難度類型
 */
export type DifficultyType = 'simple' | 'medium' | 'hard'

/**
 * 科目ID類型
 */
export type SubjectId = 'L21' | 'L23'

/**
 * 答案選項類型
 */
export type AnswerOption = 'A' | 'B' | 'C' | 'D'

/**
 * 題目統計類型
 */
export interface QuestionStats {
  total: number
  byDifficulty: {
    simple: number
    medium: number
    hard: number
  }
  bySource?: Record<string, number>
}

/**
 * 主題統計類型
 */
export interface TopicStats {
  topicId: string
  totalQuestions: number
  difficulties: {
    simple: number
    medium: number
    hard: number
  }
}

/**
 * 題庫統計類型
 */
export interface QuestionBankStats {
  totalQuestions: number
  bySource: Record<string, number>
  bySubject: Record<string, number>
  byTopic: Record<string, number>
  byDifficulty: Record<string, number>
}

/**
 * 驗證結果類型
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    totalValidated: number
    passed: number
    failed: number
  }
}
