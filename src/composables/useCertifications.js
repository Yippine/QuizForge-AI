/**
 * useCertifications
 * Formula: Config = certifications.json → queryMethods
 * 所有科目/主題資訊從 config 動態讀取，取代 hardcoded ipas.ts
 */
import certData from '@/config/certifications.json'

const certifications = certData.certifications

// ── Lookup helpers (computed once at module load) ─────────────────────────
const _subjectMap = new Map()   // subjectId → { cert, subject }
const _topicMap   = new Map()   // topicId   → { cert, subject, chapter, topic }

for (const cert of certifications) {
  for (const subject of cert.subjects) {
    _subjectMap.set(subject.id, { cert, subject })
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        _topicMap.set(topic.id, { cert, subject, chapter, topic })
      }
    }
  }
}

// ── Public composable ─────────────────────────────────────────────────────
export function useCertifications() {
  /** 所有認證列表 */
  function getCertifications() {
    return certifications
  }

  /** 取得單一認證 */
  function getCert(certId) {
    return certifications.find(c => c.id === certId) ?? null
  }

  /** 取得單一科目（含其 certId） */
  function getSubject(subjectId) {
    return _subjectMap.get(subjectId) ?? null
  }

  /** 取得某科目的全部主題（扁平陣列） */
  function getTopics(subjectId) {
    const entry = _subjectMap.get(subjectId)
    if (!entry) return []
    return entry.subject.chapters.flatMap(ch => ch.topics)
  }

  /** 取得某科目的 chapters（含 topics） */
  function getChapters(subjectId) {
    const entry = _subjectMap.get(subjectId)
    return entry?.subject.chapters ?? []
  }

  /** 用 topic_id 查找主題資訊 */
  function getTopic(topicId) {
    return _topicMap.get(topicId) ?? null
  }

  /** 取得主題名稱（找不到時回傳 topicId） */
  function getTopicName(topicId) {
    return _topicMap.get(topicId)?.topic.name ?? topicId
  }

  /** 取得科目名稱 */
  function getSubjectName(subjectId) {
    return _subjectMap.get(subjectId)?.subject.name ?? subjectId
  }

  return {
    certifications,
    getCertifications,
    getCert,
    getSubject,
    getSubjectName,
    getTopics,
    getChapters,
    getTopic,
    getTopicName
  }
}
