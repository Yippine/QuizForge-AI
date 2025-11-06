/**
 * IPAS Constants Definition
 * Formula: Constants = SUBJECTS × TOPICS × QUESTION_SOURCES
 * Purpose: 定義 IPAS 題庫系統的常量配置
 * Data Source: knowledge-base/ipas/3 formula/ 目錄下的 21 個主題 markdown 檔案
 */

import type { SubjectType, TopicType } from '../types/ipas'

/**
 * 科目定義
 * Formula: SUBJECTS = {L21: SubjectType, L23: SubjectType}
 */
export const SUBJECTS: Record<'L21' | 'L23', SubjectType> = {
  L21: {
    id: 'L21',
    name: '人工智慧技術應用與規劃',
    shortName: '科目一',
    description: 'AI技術應用與規劃能力鑑定'
  },
  L23: {
    id: 'L23',
    name: '機器學習技術與應用',
    shortName: '科目三',
    description: '機器學習技術與應用能力鑑定'
  }
}

/**
 * 科目一主題列表 (L21)
 * Formula: TOPICS_L21 = TopicType[] (9 topics: L21101-L21302)
 * Data Source: knowledge-base/ipas/3 formula/L21-科目1/*.md
 */
export const TOPICS_L21: TopicType[] = [
  {
    id: 'L21101',
    subjectId: 'L21',
    name: '自然語言處理技術與應用',
    fullName: 'L21101-自然語言處理技術與應用',
    description: 'NLP技術原理與實務應用',
    sequence: 1,
    icon: '💬'
  },
  {
    id: 'L21102',
    subjectId: 'L21',
    name: '電腦視覺技術與應用',
    fullName: 'L21102-電腦視覺技術與應用',
    description: '影像識別與處理技術',
    sequence: 2,
    icon: '👁️'
  },
  {
    id: 'L21103',
    subjectId: 'L21',
    name: '生成式AI技術與應用',
    fullName: 'L21103-生成式AI技術與應用',
    description: 'Generative AI 技術與應用場景',
    sequence: 3,
    icon: '🎨'
  },
  {
    id: 'L21104',
    subjectId: 'L21',
    name: '多模態人工智慧應用',
    fullName: 'L21104-多模態人工智慧應用',
    description: '多模態AI系統整合',
    sequence: 4,
    icon: '🔗'
  },
  {
    id: 'L21201',
    subjectId: 'L21',
    name: 'AI導入評估',
    fullName: 'L21201-AI導入評估',
    description: 'AI專案評估與可行性分析',
    sequence: 5,
    icon: '🔍'
  },
  {
    id: 'L21202',
    subjectId: 'L21',
    name: 'AI導入規劃',
    fullName: 'L21202-AI導入規劃',
    description: 'AI專案規劃與管理',
    sequence: 6,
    icon: '📋'
  },
  {
    id: 'L21203',
    subjectId: 'L21',
    name: 'AI風險管理',
    fullName: 'L21203-AI風險管理',
    description: 'AI專案風險識別與管理',
    sequence: 7,
    icon: '⚠️'
  },
  {
    id: 'L21301',
    subjectId: 'L21',
    name: '數據準備與模型選擇',
    fullName: 'L21301-數據準備與模型選擇',
    description: '數據處理與模型評估',
    sequence: 8,
    icon: '📊'
  },
  {
    id: 'L21302',
    subjectId: 'L21',
    name: 'AI技術系統集成與部署',
    fullName: 'L21302-AI技術系統集成與部署',
    description: 'AI系統整合與上線部署',
    sequence: 9,
    icon: '🚀'
  }
]

/**
 * 科目三主題列表 (L23)
 * Formula: TOPICS_L23 = TopicType[] (12 topics: L23101-L23402)
 * Data Source: knowledge-base/ipas/3 formula/L23-科目3/*.md
 */
export const TOPICS_L23: TopicType[] = [
  {
    id: 'L23101',
    subjectId: 'L23',
    name: '機率統計之機器學習基礎應用',
    fullName: 'L23101-機率統計之機器學習基礎應用',
    description: '機率論與統計學基礎',
    sequence: 10,
    icon: '📈'
  },
  {
    id: 'L23102',
    subjectId: 'L23',
    name: '線性代數之機器學習基礎應用',
    fullName: 'L23102-線性代數之機器學習基礎應用',
    description: '線性代數數學基礎',
    sequence: 11,
    icon: '🔢'
  },
  {
    id: 'L23103',
    subjectId: 'L23',
    name: '數值優化技術與方法',
    fullName: 'L23103-數值優化技術與方法',
    description: '優化演算法與數值方法',
    sequence: 12,
    icon: '⚡'
  },
  {
    id: 'L23201',
    subjectId: 'L23',
    name: '機器學習原理與技術',
    fullName: 'L23201-機器學習原理與技術',
    description: 'ML基礎理論與方法',
    sequence: 13,
    icon: '🤖'
  },
  {
    id: 'L23202',
    subjectId: 'L23',
    name: '常見機器學習演算法',
    fullName: 'L23202-常見機器學習演算法',
    description: '分類、回歸、聚類演算法',
    sequence: 14,
    icon: '🧮'
  },
  {
    id: 'L23203',
    subjectId: 'L23',
    name: '深度學習原理與框架',
    fullName: 'L23203-深度學習原理與框架',
    description: '神經網路與深度學習框架',
    sequence: 15,
    icon: '🧠'
  },
  {
    id: 'L23301',
    subjectId: 'L23',
    name: '數據準備與特徵工程',
    fullName: 'L23301-數據準備與特徵工程',
    description: '數據預處理與特徵提取',
    sequence: 16,
    icon: '🔧'
  },
  {
    id: 'L23302',
    subjectId: 'L23',
    name: '模型選擇與架構設計',
    fullName: 'L23302-模型選擇與架構設計',
    description: '模型架構設計與選擇',
    sequence: 17,
    icon: '🏗️'
  },
  {
    id: 'L23303',
    subjectId: 'L23',
    name: '模型訓練評估驗證',
    fullName: 'L23303-模型訓練評估驗證',
    description: '模型訓練與性能評估',
    sequence: 18,
    icon: '📊'
  },
  {
    id: 'L23304',
    subjectId: 'L23',
    name: '模型調整與優化',
    fullName: 'L23304-模型調整與優化',
    description: '超參數調優與模型優化',
    sequence: 19,
    icon: '⚙️'
  },
  {
    id: 'L23401',
    subjectId: 'L23',
    name: '數據隱私安全合規',
    fullName: 'L23401-數據隱私安全合規',
    description: '數據安全與隱私保護',
    sequence: 20,
    icon: '🔒'
  },
  {
    id: 'L23402',
    subjectId: 'L23',
    name: '演算法偏見與公平性',
    fullName: 'L23402-演算法偏見與公平性',
    description: 'AI公平性與偏見消除',
    sequence: 21,
    icon: '⚖️'
  }
]

/**
 * 官方題目主題定義
 * Formula: OFFICIAL_TOPIC = Virtual Topic for Official Questions
 */
export const OFFICIAL_TOPIC: TopicType = {
  id: 'OFFICIAL',
  subjectId: 'OFFICIAL', // 獨立科目，不屬於 L21 或 L23
  name: '官方題目',
  fullName: 'OFFICIAL-官方題目',
  description: '講義練習題與範例試題',
  sequence: 0,
  icon: '📘'
}

/**
 * 官方題目子主題列表 (9 個主題)
 * Formula: OFFICIAL_TOPICS = TopicType[] (9 topics: OFF_L21, OFF_L23, OFF_L211-OFF_L234)
 * Data Source: official-questions.json breakdown
 */
export const OFFICIAL_TOPICS: TopicType[] = [
  {
    id: 'OFF_L21',
    subjectId: 'OFFICIAL',
    name: '人工智慧技術應用與規劃',
    fullName: 'OFF_L21-人工智慧技術應用與規劃',
    description: '官方樣題-科目1',
    sequence: 1,
    icon: '🎯',
    sourcePattern: '官方樣題-科目1'
  },
  {
    id: 'OFF_L23',
    subjectId: 'OFFICIAL',
    name: '機器學習技術與應用',
    fullName: 'OFF_L23-機器學習技術與應用',
    description: '官方樣題-科目3',
    sequence: 2,
    icon: '🎯',
    sourcePattern: '官方樣題-科目3'
  },
  {
    id: 'OFF_L211',
    subjectId: 'OFFICIAL',
    name: 'AI相關技術應用',
    fullName: 'OFF_L211-AI相關技術應用',
    description: '講義練習題-第3章',
    sequence: 3,
    icon: '💬',
    sourcePattern: '講義練習題-科目1-第3章'
  },
  {
    id: 'OFF_L212',
    subjectId: 'OFFICIAL',
    name: 'AI導入評估規劃',
    fullName: 'OFF_L212-AI導入評估規劃',
    description: '講義練習題-第4章',
    sequence: 4,
    icon: '📋',
    sourcePattern: '講義練習題-科目1-第4章'
  },
  {
    id: 'OFF_L213',
    subjectId: 'OFFICIAL',
    name: 'AI技術應用與系統部署',
    fullName: 'OFF_L213-AI技術應用與系統部署',
    description: '講義練習題-第5章',
    sequence: 5,
    icon: '🚀',
    sourcePattern: '講義練習題-科目1-第5章'
  },
  {
    id: 'OFF_L231',
    subjectId: 'OFFICIAL',
    name: '機器學習基礎數學',
    fullName: 'OFF_L231-機器學習基礎數學',
    description: '講義練習題-第3章',
    sequence: 6,
    icon: '📈',
    sourcePattern: '講義練習題-科目3-第3章'
  },
  {
    id: 'OFF_L232',
    subjectId: 'OFFICIAL',
    name: '機器學習與深度學習',
    fullName: 'OFF_L232-機器學習與深度學習',
    description: '講義練習題-第4章',
    sequence: 7,
    icon: '🧠',
    sourcePattern: '講義練習題-科目3-第4章'
  },
  {
    id: 'OFF_L233',
    subjectId: 'OFFICIAL',
    name: '機器學習建模與參數調校',
    fullName: 'OFF_L233-機器學習建模與參數調校',
    description: '講義練習題-第5章',
    sequence: 8,
    icon: '⚙️',
    sourcePattern: '講義練習題-科目3-第5章'
  },
  {
    id: 'OFF_L234',
    subjectId: 'OFFICIAL',
    name: '機器學習治理',
    fullName: 'OFF_L234-機器學習治理',
    description: '講義練習題-第6章',
    sequence: 9,
    icon: '🔒',
    sourcePattern: '講義練習題-科目3-第6章'
  }
]

/**
 * 所有主題列表
 * Formula: ALL_TOPICS = OFFICIAL_TOPIC + TOPICS_L21 + TOPICS_L23 (22 topics total)
 */
export const ALL_TOPICS: TopicType[] = [OFFICIAL_TOPIC, ...TOPICS_L21, ...TOPICS_L23]

/**
 * 官方題目配置
 */
export const OFFICIAL_QUESTIONS_CONFIG = {
  sourceFile: 'official-questions.json',
  idPrefix: 'OFF_',
  totalQuestions: 100,
  breakdown: {
    L21_textbook: 30,
    L21_sample: 15,
    L23_textbook: 40,
    L23_sample: 15
  }
}

/**
 * 模擬考試配置
 */
export const MOCK_EXAM_CONFIG = {
  L21: {
    sourceFile: 'L21-mock-exam.json',
    totalQuestions: 120,
    subjectName: '人工智慧技術應用與規劃'
  },
  L23: {
    sourceFile: 'L23-mock-exam.json',
    totalQuestions: 134,
    subjectName: '機器學習技術與應用'
  }
}

/**
 * 難度顯示名稱映射
 */
export const DIFFICULTY_LABELS: Record<string, string> = {
  simple: '簡單',
  medium: '中等',
  hard: '困難'
}

/**
 * 科目顯示顏色
 */
export const SUBJECT_COLORS = {
  L21: {
    primary: 'primary',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    border: 'border-primary-300'
  },
  L23: {
    primary: 'secondary',
    bg: 'bg-secondary-50',
    text: 'text-secondary-700',
    border: 'border-secondary-300'
  }
}

/**
 * 根據主題ID獲取主題資訊
 * Formula: getTopicById(topicId) -> TopicType | undefined
 */
export function getTopicById(topicId: string): TopicType | undefined {
  return ALL_TOPICS.find(topic => topic.id === topicId)
}

/**
 * 根據科目ID獲取主題列表
 * Formula: getTopicsBySubject(subjectId) -> TopicType[]
 */
export function getTopicsBySubject(subjectId: 'L21' | 'L23'): TopicType[] {
  return ALL_TOPICS.filter(topic => topic.subjectId === subjectId)
}

/**
 * 根據主題全名獲取主題資訊
 * Formula: getTopicByFullName(fullName) -> TopicType | undefined
 */
export function getTopicByFullName(fullName: string): TopicType | undefined {
  return ALL_TOPICS.find(topic => topic.fullName === fullName)
}

/**
 * 從主題字串提取主題ID
 * Formula: extractTopicID(topic: string) -> string
 * Purpose: 統一處理不同格式的主題字串，提取標準化的主題ID
 *
 * 支援格式:
 * - "L21101_自然語言處理技術與應用" -> "L21101"
 * - "L21201-AI導入評估" -> "L21201"
 * - "L23101" -> "L23101"
 * - "自然語言處理技術與應用" -> null (無法提取)
 *
 * @param topic - 主題字串（來自 question.topic 欄位）
 * @returns 主題ID (L21xxx 或 L23xxx) 或 null
 */
export function extractTopicID(topic: string): string | null {
  if (!topic) return null

  // 匹配格式: L21101_xxx 或 L21101-xxx 或 L21101
  const match = topic.match(/^(L2[13]\d{3})/)
  return match ? match[1] : null
}
