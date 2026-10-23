<script setup>
// Task #17 — 得分、各主題正確率、錯題列表、再練一次
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCertifications } from '@/composables/useCertifications'
import { getExamResult, clearExamResult } from '@/lib/examSession'

const route  = useRoute()
const router = useRouter()
const { getSubjectName, getTopicName, getTopics } = useCertifications()

const subjectId = route.params.subjectId
const result    = getExamResult()

// If no result data (e.g. direct URL access), redirect back
onMounted(() => {
  if (!result) router.replace({ name: 'TopicSelect', params: { subjectId } })
})

onUnmounted(() => {
  clearExamResult()
})

// ── Score ─────────────────────────────────────────────────────────────────
const score = computed(() => {
  if (!result) return null
  const { questions, answers } = result
  let correct = 0
  let answered = 0

  for (const q of questions) {
    if (answers[q.id]) {
      answered++
      if (answers[q.id] === q.answer) correct++
    }
  }

  return {
    correct,
    answered,
    total:    questions.length,
    pct:      answered > 0 ? Math.round((correct / answered) * 100) : 0,
    totalPct: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
    passed:   questions.length > 0 ? (correct / questions.length) >= 0.6 : false,
  }
})

function scoreClass(pct) {
  if (pct >= 80) return 'score--high'
  if (pct >= 60) return 'score--pass'
  return 'score--fail'
}

// ── Per-topic accuracy ────────────────────────────────────────────────────
const topicStats = computed(() => {
  if (!result) return []
  const { questions, answers } = result

  const map = {}  // topicId → { correct, total }

  for (const q of questions) {
    const tid = q.topic_id
    if (!map[tid]) map[tid] = { topicId: tid, correct: 0, answered: 0, total: 0 }
    map[tid].total++
    if (answers[q.id]) {
      map[tid].answered++
      if (answers[q.id] === q.answer) map[tid].correct++
    }
  }

  return Object.values(map)
    .map(s => ({
      ...s,
      name: getTopicName(s.topicId),
      pct:  s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : null,
    }))
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))  // weakest first
})

// ── Wrong questions ───────────────────────────────────────────────────────
const wrongQuestions = computed(() => {
  if (!result) return []
  const { questions, answers } = result

  return questions.filter(q => {
    const a = answers[q.id]
    return a && a !== q.answer
  })
})

const unanswered = computed(() => {
  if (!result) return []
  const { questions, answers } = result
  return questions.filter(q => !answers[q.id])
})

// ── Time display ──────────────────────────────────────────────────────────
const timeSummary = computed(() => {
  if (!result?.timeData) return null
  const { elapsedMs, timeLimitMinutes, isTimeUp } = result.timeData
  const min = Math.floor(elapsedMs / 60000)
  const sec = Math.floor((elapsedMs % 60000) / 1000)
  return {
    elapsed: `${min}:${String(sec).padStart(2, '0')}`,
    limit:   timeLimitMinutes,
    isTimeUp,
  }
})

// ── Actions ───────────────────────────────────────────────────────────────
function retakeExam() {
  router.push({ name: 'Exam', params: { subjectId } })
}

function practiceWrong() {
  // Navigate to practice with wrongQuestions — for MVP, go to TopicSelect
  router.push({ name: 'TopicSelect', params: { subjectId } })
}
</script>

<template>
  <div v-if="result" class="result-page">

    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'TopicSelect', params: { subjectId } })">
        ← 返回科目
      </button>
      <div>
        <h1 class="page-title">考試結果</h1>
        <p class="page-subtitle">{{ getSubjectName(subjectId) }}</p>
      </div>
    </div>

    <!-- Score Hero -->
    <div class="score-hero" :class="scoreClass(score.totalPct)">
      <div class="score-circle">
        <span class="score-num">{{ score.totalPct }}</span>
        <span class="score-pct">%</span>
      </div>
      <div class="score-info">
        <div class="score-verdict">
          {{ score.passed ? '🎉 通過' : '📚 需加強' }}
        </div>
        <div class="score-detail">
          答對 {{ score.correct }} / {{ score.total }} 題
          <template v-if="score.answered < score.total">
            （{{ unanswered.length }} 題未作答）
          </template>
        </div>
        <div v-if="timeSummary" class="score-time">
          用時 {{ timeSummary.elapsed }}
          <span v-if="timeSummary.isTimeUp" class="time-up-badge">時間到</span>
        </div>
      </div>
    </div>

    <!-- Per-topic bars -->
    <section class="section">
      <h2 class="section-title">各主題正確率</h2>
      <div class="topic-bars">
        <div
          v-for="t in topicStats"
          :key="t.topicId"
          class="topic-bar-row"
        >
          <div class="topic-bar-label">
            <span class="topic-name">{{ t.name }}</span>
            <span class="topic-id">{{ t.topicId }}</span>
          </div>
          <div class="topic-bar-wrap">
            <div
              class="topic-bar"
              :class="{
                'bar--high': t.pct >= 80,
                'bar--mid':  t.pct >= 60 && t.pct < 80,
                'bar--low':  t.pct !== null && t.pct < 60,
                'bar--none': t.pct === null
              }"
              :style="{ width: (t.pct ?? 0) + '%' }"
            />
          </div>
          <span class="topic-bar-pct">
            {{ t.pct !== null ? t.pct + '%' : '—' }}
          </span>
        </div>
      </div>
    </section>

    <!-- Wrong questions -->
    <section v-if="wrongQuestions.length > 0" class="section">
      <h2 class="section-title">
        錯題列表
        <span class="count-badge">{{ wrongQuestions.length }}</span>
      </h2>

      <div
        v-for="q in wrongQuestions"
        :key="q.id"
        class="wrong-card"
      >
        <div class="wrong-meta">
          <span class="wrong-topic">{{ getTopicName(q.topic_id) }}</span>
          <span v-if="q.difficulty" class="q-diff" :class="`diff--${q.difficulty}`">
            {{ { easy: '易', medium: '中', hard: '難' }[q.difficulty] }}
          </span>
        </div>

        <p class="wrong-question">{{ q.question }}</p>

        <div class="wrong-options">
          <div
            v-for="label in ['A','B','C','D']"
            :key="label"
            class="wrong-opt"
            :class="{
              'opt--correct': label === q.answer,
              'opt--wrong':   label === result.answers[q.id] && label !== q.answer,
              'opt--dim':     label !== q.answer && label !== result.answers[q.id]
            }"
          >
            <span class="opt-label">{{ label }}</span>
            <span class="opt-text">{{ q[`option_${label.toLowerCase()}`] }}</span>
          </div>
        </div>

        <div class="wrong-verdict">
          <span class="verdict-yours">你的答案：{{ result.answers[q.id] }}</span>
          <span class="verdict-correct">正確答案：{{ q.answer }}</span>
        </div>

        <div v-if="q.explanation" class="wrong-explain">
          {{ q.explanation }}
        </div>
      </div>
    </section>

    <!-- Unanswered note -->
    <div v-if="unanswered.length > 0" class="unanswered-note">
      ℹ️ 另有 {{ unanswered.length }} 題未作答，不計入統計。
    </div>

    <!-- Actions -->
    <div class="action-bar">
      <button class="btn-secondary" @click="router.push({ name: 'Home' })">
        回首頁
      </button>
      <button class="btn-secondary" @click="practiceWrong" v-if="wrongQuestions.length > 0">
        練習此科目
      </button>
      <button class="btn-primary" @click="retakeExam">
        再考一次
      </button>
    </div>
  </div>

  <!-- Fallback while redirecting -->
  <div v-else class="state-card">
    <div class="spinner" />
  </div>
</template>

<style scoped>
.result-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

.state-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60dvh;
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.back-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.875rem;
  padding: 0.4rem 0;
  white-space: nowrap;
  flex-shrink: 0;
}
.page-title    { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.8rem; color: #94a3b8; margin: 0; }

/* Score Hero */
.score-hero {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.score-hero.score--high { border-color: #22c55e; background: #f0fdf4; }
.score-hero.score--pass { border-color: #6366f1; background: #eef2ff; }
.score-hero.score--fail { border-color: #f87171; background: #fef2f2; }

.score-circle {
  width: 80px;
  height: 80px;
  min-width: 80px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.score--high .score-circle { background: #dcfce7; }
.score--pass .score-circle { background: #e0e7ff; }
.score--fail .score-circle { background: #fee2e2; }

.score-num { font-size: 1.8rem; font-weight: 800; color: #1e293b; line-height: 1; }
.score-pct { font-size: 0.9rem; font-weight: 700; color: #64748b; }

.score-verdict { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem; }
.score-detail  { font-size: 0.875rem; color: #475569; }
.score-time    { font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem; }

.time-up-badge {
  background: #fee2e2;
  color: #dc2626;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  margin-left: 0.4rem;
}

/* Sections */
.section { margin-bottom: 1.5rem; }
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.875rem;
}
.count-badge {
  font-size: 0.7rem;
  font-weight: 700;
  background: #fee2e2;
  color: #dc2626;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

/* Topic bars */
.topic-bars { display: flex; flex-direction: column; gap: 0.625rem; }

.topic-bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topic-bar-label {
  min-width: 160px;
  max-width: 160px;
  display: flex;
  flex-direction: column;
}
.topic-name { font-size: 0.8rem; color: #334155; font-weight: 500; }
.topic-id   { font-size: 0.65rem; color: #94a3b8; font-family: monospace; }

.topic-bar-wrap {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.topic-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.bar--high { background: #22c55e; }
.bar--mid  { background: #6366f1; }
.bar--low  { background: #f87171; }
.bar--none { width: 0 !important; }

.topic-bar-pct {
  min-width: 36px;
  text-align: right;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

/* Wrong cards */
.wrong-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #f87171;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.875rem;
}

.wrong-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.wrong-topic { font-size: 0.72rem; color: #94a3b8; }
.q-diff {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}
.diff--easy   { background: #dcfce7; color: #16a34a; }
.diff--medium { background: #fef9c3; color: #ca8a04; }
.diff--hard   { background: #fee2e2; color: #dc2626; }

.wrong-question {
  font-size: 0.875rem;
  color: #1e293b;
  line-height: 1.6;
  margin: 0 0 0.75rem;
}

.wrong-options {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}
.wrong-opt {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 0.8rem;
}
.wrong-opt.opt--correct { background: #f0fdf4; }
.wrong-opt.opt--wrong   { background: #fef2f2; }
.wrong-opt.opt--dim     { opacity: 0.5; }
.wrong-opt .opt-label {
  width: 20px;
  height: 20px;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: #e2e8f0;
  font-size: 0.7rem;
  font-weight: 700;
  color: #475569;
}
.wrong-opt.opt--correct .opt-label { background: #22c55e; color: #fff; }
.wrong-opt.opt--wrong   .opt-label { background: #f87171; color: #fff; }
.wrong-opt .opt-text { color: #374151; }

.wrong-verdict {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.verdict-yours   { color: #f87171; }
.verdict-correct { color: #22c55e; }

.wrong-explain {
  background: #f8fafc;
  border-left: 3px solid #6366f1;
  border-radius: 0 6px 6px 0;
  padding: 0.6rem 0.75rem;
  font-size: 0.8rem;
  color: #374151;
  line-height: 1.6;
}

/* Unanswered note */
.unanswered-note {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

/* Action bar */
.action-bar {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
.btn-primary {
  padding: 0.6rem 1.5rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 40px;
  transition: background 0.15s;
}
.btn-primary:hover { background: #4f46e5; }
.btn-secondary {
  padding: 0.6rem 1.25rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 40px;
  transition: background 0.15s;
}
.btn-secondary:hover { background: #e2e8f0; }
</style>
