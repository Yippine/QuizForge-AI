<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCertifications } from '@/composables/useCertifications'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const { getSubject, getSubjectName, getChapters } = useCertifications()

const subjectId = route.params.subjectId
const subject   = getSubject(subjectId)

// ── Progress from Supabase ─────────────────────────────────────────────
// topicId → { answered, correct }
const topicStats = ref({})
const loading    = ref(true)

onMounted(async () => {
  if (!auth.isLoggedIn) { loading.value = false; return }
  try {
    // Get user's answered questions for this subject
    const { data } = await supabase
      .from('user_progress')
      .select('question_id, is_correct, questions!inner(topic_id)')
      .eq('questions.subject_id', subjectId)
      .eq('user_id', auth.user.id)

    if (data) {
      // Latest answer per question (dedup by question_id, keep latest)
      const latestMap = {}
      for (const row of data) {
        latestMap[row.question_id] = row
      }
      // Aggregate by topic
      for (const row of Object.values(latestMap)) {
        const tid = row.questions.topic_id
        if (!topicStats.value[tid]) topicStats.value[tid] = { answered: 0, correct: 0 }
        topicStats.value[tid].answered++
        if (row.is_correct) topicStats.value[tid].correct++
      }
    }
  } catch (e) {
    console.warn('[TopicSelect] stats fetch failed:', e.message)
  }
  loading.value = false
})

// ── Question counts from Supabase ──────────────────────────────────────
const questionCounts = ref({})

onMounted(async () => {
  try {
    const { data } = await supabase
      .from('questions')
      .select('topic_id')
      .eq('subject_id', subjectId)

    if (data) {
      for (const row of data) {
        questionCounts.value[row.topic_id] = (questionCounts.value[row.topic_id] ?? 0) + 1
      }
    }
  } catch (e) {
    console.warn('[TopicSelect] counts fetch failed:', e.message)
  }
})

const chapters = getChapters(subjectId)

function getProgress(topicId) {
  const stats = topicStats.value[topicId]
  if (!stats || stats.answered === 0) return null
  return Math.round((stats.correct / stats.answered) * 100)
}

function getProgressClass(pct) {
  if (pct === null) return ''
  if (pct >= 80) return 'progress--good'
  if (pct >= 50) return 'progress--mid'
  return 'progress--low'
}

function startPractice(topicId) {
  router.push({
    name: 'Quiz',
    params: { subjectId },
    query: topicId ? { topicId } : {}
  })
}

function startExam() {
  router.push({ name: 'Exam', params: { subjectId } })
}
</script>

<template>
  <div class="topic-page">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.back()">← 返回</button>
      <div class="header-info">
        <div class="subject-id">{{ subjectId }}</div>
        <h1 class="subject-name">{{ subject?.subject.name ?? subjectId }}</h1>
      </div>
      <button class="btn-exam" @click="startExam">模擬考</button>
    </div>

    <!-- Practice all -->
    <button class="btn-all" @click="startPractice(null)">
      <span>🎲</span>
      <span>隨機練習全部主題</span>
    </button>

    <!-- Chapter → Topics -->
    <div v-if="loading" class="loading">載入進度中...</div>

    <div v-for="chapter in chapters" :key="chapter.id" class="chapter">
      <div class="chapter-name">{{ chapter.name }}</div>

      <button
        v-for="topic in chapter.topics"
        :key="topic.id"
        class="topic-row"
        @click="startPractice(topic.id)"
      >
        <div class="topic-left">
          <div class="topic-name">{{ topic.name }}</div>
          <div class="topic-meta">
            <span class="topic-id">{{ topic.id }}</span>
            <span v-if="questionCounts[topic.id]" class="topic-count">
              {{ questionCounts[topic.id] }} 題
            </span>
            <span v-else class="topic-count empty">尚無題目</span>
          </div>
        </div>

        <div class="topic-right">
          <div
            v-if="getProgress(topic.id) !== null"
            class="progress-badge"
            :class="getProgressClass(getProgress(topic.id))"
          >
            {{ getProgress(topic.id) }}%
          </div>
          <div v-else class="progress-badge progress--none">未練習</div>
          <span class="topic-arrow">›</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.topic-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem 1rem 4rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.back-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.875rem;
  padding: 0.4rem 0;
  flex-shrink: 0;
}

.header-info { flex: 1; min-width: 0; }
.subject-id  { font-size: 0.7rem; font-weight: 600; color: #94a3b8; }
.subject-name { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }

.btn-exam {
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  flex-shrink: 0;
  min-height: 40px;
}

.btn-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  min-height: 48px;
  transition: all 0.15s;
}
.btn-all:hover { background: #eef2ff; border-color: #6366f1; color: #4f46e5; }

.loading { text-align: center; color: #94a3b8; padding: 2rem; }

.chapter { margin-bottom: 1.5rem; }
.chapter-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  padding: 0 0.25rem;
}

.topic-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  text-align: left;
  margin-bottom: 0.5rem;
  transition: all 0.15s;
  min-height: 60px;
}
.topic-row:hover { border-color: #6366f1; background: #fafbff; }

.topic-left { flex: 1; min-width: 0; }
.topic-name { font-size: 0.875rem; font-weight: 500; color: #1e293b; }
.topic-meta { display: flex; align-items: center; gap: 0.5rem; margin-top: 3px; }
.topic-id   { font-size: 0.7rem; color: #94a3b8; font-family: monospace; }
.topic-count { font-size: 0.7rem; color: #64748b; }
.topic-count.empty { color: #cbd5e1; }

.topic-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.topic-arrow  { color: #cbd5e1; font-size: 1.1rem; }

.progress-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}
.progress--good { background: #dcfce7; color: #16a34a; }
.progress--mid  { background: #fef9c3; color: #ca8a04; }
.progress--low  { background: #fee2e2; color: #dc2626; }
.progress--none { background: #f1f5f9; color: #94a3b8; }
</style>
