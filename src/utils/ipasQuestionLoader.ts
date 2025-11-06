/**
 * IPAS Question Loader & Utility Functions
 * Formula: Utils = IDParsing + SubjectExtraction + TopicLookup + QuestionNormalization
 * Formula: DataLoader = FileReader ∘ SchemaValidator ∘ DataMerger ∘ IntegrityChecker
 * Purpose: 提供題目載入、解析和驗證功能
 */

import type { QuestionType, ValidationResult, SubjectId } from '../types/ipas'
import { ALL_TOPICS, getTopicById, getTopicByFullName } from '../constants/ipas'

/**
 * 從 question_id 提取主題 ID
 * Formula: extractTopicId(question_id) -> string | null
 * Supports: L21101_001 -> L21101, OFF_L21_CH3_001 -> extract from topic field
 */
export function extractTopicId(questionId: string): string | null {
  // 格式1: L21101_001 or L23201_002
  const mockExamMatch = questionId.match(/^(L2[13]\d{3})_\d+$/)
  if (mockExamMatch) {
    return mockExamMatch[1]
  }

  // 格式2: OFF_L21_CH3_001 or OFF_L23_CH4_001
  // 官方題目的主題ID需要從題目的 topic 欄位取得，這裡返回 null
  const officialMatch = questionId.match(/^OFF_L2[13]_CH\d+_\d+$/)
  if (officialMatch) {
    return null // 官方題目需要從 topic 欄位解析
  }

  return null
}

/**
 * 從 question_id 提取科目 ID
 * Formula: extractSubjectId(question_id) -> 'L21' | 'L23' | null
 */
export function extractSubjectId(questionId: string): SubjectId | null {
  // 支援兩種格式
  const match = questionId.match(/^(?:OFF_)?(L2[13])/)
  return match ? (match[1] as SubjectId) : null
}

/**
 * 判斷是否為官方題目
 * Formula: isOfficialQuestion(question_id) -> boolean
 */
export function isOfficialQuestion(questionId: string): boolean {
  return questionId.startsWith('OFF_')
}

/**
 * 標準化題目格式
 * Formula: normalizeQuestionFormat(rawQuestion) -> QuestionType
 * Purpose: 統一處理 mock exam 和 official questions 的不同資料格式
 */
export function normalizeQuestionFormat(rawQuestion: any): QuestionType {
  // 基本欄位
  const normalized: QuestionType = {
    question_id: rawQuestion.question_id,
    subject: rawQuestion.subject || extractSubjectId(rawQuestion.question_id) || 'L21',
    topic: rawQuestion.topic,
    difficulty: rawQuestion.difficulty,
    question: rawQuestion.question,
    options: rawQuestion.options,
    answer: rawQuestion.answer,
    explanation: rawQuestion.explanation || rawQuestion.answer_text || '',
    keywords: rawQuestion.keywords || []
  }

  // 選填欄位
  if (rawQuestion.sequence) normalized.sequence = rawQuestion.sequence
  if (rawQuestion.subject_name) normalized.subject_name = rawQuestion.subject_name
  if (rawQuestion.chapter) normalized.chapter = rawQuestion.chapter
  if (rawQuestion.question_type) normalized.question_type = rawQuestion.question_type
  if (rawQuestion.answer_text) normalized.answer_text = rawQuestion.answer_text
  if (rawQuestion.source) normalized.source = rawQuestion.source
  if (rawQuestion.reference) normalized.reference = rawQuestion.reference

  return normalized
}

/**
 * 載入模擬考試題庫
 * Formula: loadMockExam(subjectId) -> Promise<QuestionType[]>
 */
export async function loadMockExam(subjectId: SubjectId): Promise<QuestionType[]> {
  try {
    const fileName = subjectId === 'L21' ? 'L21-mock-exam.json' : 'L23-mock-exam.json'
    const response = await fetch(`/questions/${fileName}`)

    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error(`Invalid data format in ${fileName}`)
    }

    // 標準化每個題目
    const questions = data.questions.map(normalizeQuestionFormat)

    console.log(`✅ Loaded ${questions.length} questions from ${fileName}`)
    return questions

  } catch (error) {
    console.error(`❌ Error loading mock exam for ${subjectId}:`, error)
    return []
  }
}

/**
 * 載入官方題目
 * Formula: loadOfficialQuestions() -> Promise<QuestionType[]>
 */
export async function loadOfficialQuestions(): Promise<QuestionType[]> {
  try {
    const response = await fetch('/questions/official-questions.json')

    if (!response.ok) {
      throw new Error(`Failed to load official-questions.json: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid data format in official-questions.json')
    }

    // 標準化每個題目
    const questions = data.questions.map(normalizeQuestionFormat)

    console.log(`✅ Loaded ${questions.length} questions from official-questions.json`)
    return questions

  } catch (error) {
    console.error('❌ Error loading official questions:', error)
    return []
  }
}

/**
 * 載入所有題目
 * Formula: loadAllQuestions() -> Promise<QuestionType[]>
 * Formula: Promise.all([loadMockExam('L21'), loadMockExam('L23'), loadOfficialQuestions()]) -> mergeQuestions
 */
export async function loadAllQuestions(): Promise<QuestionType[]> {
  try {
    console.log('📚 Loading all question banks...')

    // 並行載入所有題庫
    const [l21Questions, l23Questions, officialQuestions] = await Promise.all([
      loadMockExam('L21'),
      loadMockExam('L23'),
      loadOfficialQuestions()
    ])

    // 合併所有題目
    const allQuestions = mergeQuestions([l21Questions, l23Questions, officialQuestions])

    console.log(`✅ Successfully loaded ${allQuestions.length} total questions`)
    console.log(`   - L21 Mock Exam: ${l21Questions.length} questions`)
    console.log(`   - L23 Mock Exam: ${l23Questions.length} questions`)
    console.log(`   - Official Questions: ${officialQuestions.length} questions`)

    return allQuestions

  } catch (error) {
    console.error('❌ Error loading all questions:', error)
    return []
  }
}

/**
 * 合併題目陣列
 * Formula: mergeQuestions(sources: QuestionType[][]) -> QuestionType[]
 * Process: flatten -> deduplicate_by_id -> sort_by_sequence
 */
export function mergeQuestions(sources: QuestionType[][]): QuestionType[] {
  // 扁平化陣列
  const flatQuestions = sources.flat()

  // 去除重複 (以 question_id 為鍵)
  const uniqueQuestionsMap = new Map<string, QuestionType>()

  flatQuestions.forEach(question => {
    if (!uniqueQuestionsMap.has(question.question_id)) {
      uniqueQuestionsMap.set(question.question_id, question)
    }
  })

  // 轉為陣列並排序
  const uniqueQuestions = Array.from(uniqueQuestionsMap.values())

  // 按 sequence 排序（如果有的話），否則按 question_id 排序
  uniqueQuestions.sort((a, b) => {
    if (a.sequence && b.sequence) {
      return a.sequence - b.sequence
    }
    return a.question_id.localeCompare(b.question_id)
  })

  return uniqueQuestions
}

/**
 * 驗證題目完整性
 * Formula: validateQuestionIntegrity(questions) -> ValidationResult
 * Checks: id_format + required_fields + referential_integrity
 */
export function validateQuestionIntegrity(questions: QuestionType[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let passed = 0
  let failed = 0

  questions.forEach((question, index) => {
    let hasError = false

    // 檢查必填欄位
    if (!question.question_id) {
      errors.push(`Question #${index + 1}: Missing question_id`)
      hasError = true
    }

    if (!question.subject || !['L21', 'L23'].includes(question.subject)) {
      errors.push(`Question ${question.question_id}: Invalid subject "${question.subject}"`)
      hasError = true
    }

    if (!question.topic) {
      errors.push(`Question ${question.question_id}: Missing topic`)
      hasError = true
    }

    if (!question.difficulty || !['simple', 'medium', 'hard'].includes(question.difficulty)) {
      errors.push(`Question ${question.question_id}: Invalid difficulty "${question.difficulty}"`)
      hasError = true
    }

    if (!question.question) {
      errors.push(`Question ${question.question_id}: Missing question text`)
      hasError = true
    }

    if (!question.options || !question.options.A || !question.options.B || !question.options.C || !question.options.D) {
      errors.push(`Question ${question.question_id}: Invalid options`)
      hasError = true
    }

    if (!question.answer || !['A', 'B', 'C', 'D'].includes(question.answer)) {
      errors.push(`Question ${question.question_id}: Invalid answer "${question.answer}"`)
      hasError = true
    }

    // 檢查 ID 格式
    const idValid = /^(L2[13]\d{3}_\d+|OFF_L2[13]_CH\d+_\d+)$/.test(question.question_id)
    if (!idValid) {
      warnings.push(`Question ${question.question_id}: Unusual ID format`)
    }

    // 檢查主題引用完整性 (只針對非官方題目)
    if (!isOfficialQuestion(question.question_id)) {
      const topicId = extractTopicId(question.question_id)
      if (topicId) {
        const topicExists = getTopicById(topicId)
        if (!topicExists) {
          warnings.push(`Question ${question.question_id}: Topic ${topicId} not found in topic list`)
        }
      }
    } else {
      // 官方題目檢查 topic 欄位格式
      const topicExists = getTopicByFullName(question.topic)
      if (!topicExists) {
        warnings.push(`Question ${question.question_id}: Topic "${question.topic}" not found in topic list`)
      }
    }

    if (hasError) {
      failed++
    } else {
      passed++
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalValidated: questions.length,
      passed,
      failed
    }
  }
}

/**
 * 根據主題過濾題目
 * Formula: filterByTopic(questions, topicId) -> QuestionType[]
 */
export function filterByTopic(questions: QuestionType[], topicId: string): QuestionType[] {
  return questions.filter(q => {
    // 官方題目使用完整主題名稱
    if (isOfficialQuestion(q.question_id)) {
      return q.topic.includes(topicId)
    }
    // 模擬考題目從 question_id 提取主題
    const extractedTopicId = extractTopicId(q.question_id)
    return extractedTopicId === topicId
  })
}

/**
 * 根據科目過濾題目
 * Formula: filterBySubject(questions, subjectId) -> QuestionType[]
 */
export function filterBySubject(questions: QuestionType[], subjectId: SubjectId): QuestionType[] {
  return questions.filter(q => q.subject === subjectId)
}

/**
 * 根據難度過濾題目
 * Formula: filterByDifficulty(questions, difficulty) -> QuestionType[]
 */
export function filterByDifficulty(questions: QuestionType[], difficulty: string): QuestionType[] {
  return questions.filter(q => q.difficulty === difficulty)
}

/**
 * 取得題目統計資訊
 * Formula: getQuestionStats(questions) -> stats
 */
export function getQuestionStats(questions: QuestionType[]) {
  return {
    total: questions.length,
    byDifficulty: {
      simple: questions.filter(q => q.difficulty === 'simple').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    },
    bySubject: {
      L21: questions.filter(q => q.subject === 'L21').length,
      L23: questions.filter(q => q.subject === 'L23').length
    }
  }
}
