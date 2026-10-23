<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCertifications } from '@/composables/useCertifications'
import { useQuizSession } from '@/composables/useQuizSession'

const route  = useRoute()
const router = useRouter()
const { getSubjectName, getTopicName } = useCertifications()

const subjectId = route.params.subjectId
const topicId   = route.query.topicId ?? null

// ── Load questions ──────────────────────────────────────────────────────
const questions = ref([])
const loading   = ref(true)
const error     = ref(null)

onMounted(async () => {
  try {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('subject_id', subjectId)
      .order('id')

    if (topicId) query = query.eq('topic_id', topicId)

    const { data, error: err } = await query
    if (err) throw err
    questions.value = data ?? []
  } catch (e) {
    error.value = e.message
    console.error('[QuizPage] load failed:', e)
  } finally {
    loading.value = false
  }
})

// ── Quiz Session ────────────────────────────────────────────────────────
const session = useQuizSession(questions)
const { current, currentIndex, total, isFirst, isLast,
        isAnswered, isCorrect, progressPct, score,
        answer, next, prev, goTo, isExplainVisible, toggleExplain, finalize } = session

// ── Keyboard shortcuts ──────────────────────────────────────────────────
const KEYS = { A: 'A', B: 'B', C: 'C', D: 'D' }

function onKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  const key = e.key.toUpperCase()

  if (key in KEYS && !isAnswered.value) {
    answer(key)
  } else if ((e.key === 'ArrowRight' || e.key === 'Enter') && isAnswered.value) {
    if (!isLast.value) next()
  } else if (e.key === 'ArrowLeft') {
    prev()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(async () => {
  window.removeEventListener('keydown', onKeydown)
  await finalize()
})

// ── UI helpers ──────────────────────────────────────────────────────────
const optionLabels = ['A', 'B', 'C', 'D']

function optionText(q, label) {
  return q[`option_${label.toLowerCase()}`]
}

function optionClass(q, label) {
  if (!isAnswered.value) return ''
  const selected = session.answers.value[q.id]
  const correct  = q.answer
  if (label === correct)   return 'opt--correct'
  if (label === selected && label !== correct) return 'opt--wrong'
  return 'opt--dim'
}

const pageTitle = computed(() => {
  if (topicId) return getTopicName(topicId)
  return getSubjectName(subjectId)
})
</script>

<template>
  <div class="quiz-page">

    <!-- Loading / Error / Empty ──────────────────────────────────────── -->
    <div v-if="loading" class="state-card">
      <div class="spinner" />
      <p>載入題目中...</p>
    </div>

    <div v-else-if="error" class="state-card state-card--error">
      <p>❌ 載入失敗：{{ error }}</p>
      <button @click="router.back()">返回</button>
    </div>

    <div v-else-if="total === 0" class="state-card">
      <p style="font-size:2rem">📭</p>
      <p>此科目尚無題目</p>
      <p style="font-size:0.8rem;color:#94a3b8">請先透過題庫管理匯入 XLSX 題目</p>
      <button class="btn-back" @click="router.back()">返回</button>
    </div>

    <!-- Quiz UI ──────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Top Bar -->
      <div class="quiz-topbar">
        <button class="btn-icon" title="返回" @click="router.back()">←</button>
        <div class="topbar-center">
          <span class="topic-label">{{ pageTitle }}</span>
          <span class="progress-text">{{ currentIndex + 1 }} / {{ total }}</span>
        </div>
        <span class="score-badge" v-if="score">{{ score.correct }}/{{ score.total }} 正確</span>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: progressPct + '%' }" />
      </div>

      <!-- Question Card -->
      <div class="question-card" v-if="current">
        <!-- has_image hint -->
        <div v-if="current.has_image" class="image-hint">
          📷 此題含圖片，請參照原試題第 {{ current.image_note || '?' }} 頁
        </div>

        <!-- Question body -->
        <div class="question-meta">
          <span class="q-no">第 {{ currentIndex + 1 }} 題</span>
          <span v-if="current.difficulty" class="q-diff" :class="`diff--${current.difficulty}`">
            {{ { easy: '易', medium: '中', hard: '難' }[current.difficulty] }}
          </span>
          <span v-if="current.source_type" class="q-source">
            {{ { sample: '樣題', exercise: '習題', ai: 'AI', past: '歷屆' }[current.source_type] }}
          </span>
        </div>

        <p class="question-text">{{ current.question }}</p>

        <!-- Options -->
        <div class="options">
          <button
            v-for="label in optionLabels"
            :key="label"
            class="option"
            :class="[optionClass(current, label), isAnswered ? 'answered' : '']"
            :disabled="isAnswered"
            @click="answer(label)"
          >
            <span class="opt-label">{{ label }}</span>
            <span class="opt-text">{{ optionText(current, label) }}</span>
          </button>
        </div>

        <!-- Result feedback -->
        <div v-if="isAnswered" class="feedback" :class="isCorrect ? 'feedback--correct' : 'feedback--wrong'">
          {{ isCorrect ? '✓ 正確' : `✗ 正確答案：${current.answer}` }}
        </div>

        <!-- Explanation -->
        <div v-if="isAnswered && current.explanation" class="explain-section">
          <button class="explain-toggle" @click="toggleExplain()">
            {{ isExplainVisible(current.id) ? '收起解析 ▲' : '查看解析 ▼' }}
          </button>
          <div v-if="isExplainVisible(current.id)" class="explain-body">
            {{ current.explanation }}
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="nav-bar">
        <button class="btn-nav" :disabled="isFirst" @click="prev()">← 上一題</button>

        <div class="dot-nav">
          <button
            v-for="(_, i) in questions"
            :key="i"
            class="dot"
            :class="{
              'dot--current':  i === currentIndex,
              'dot--answered': questions[i]?.id in session.answers.value
            }"
            @click="goTo(i)"
          />
        </div>

        <button
          class="btn-nav btn-nav--primary"
          :disabled="isLast && !isAnswered"
          @click="isLast ? router.back() : next()"
        >
          {{ isLast ? '完成 ✓' : '下一題 →' }}
        </button>
      </div>

      <!-- Keyboard hint -->
      <p class="keyboard-hint">鍵盤：A B C D 作答 · ← → 切換題目</p>
    </template>

  </div>
</template>

<style scoped>
.quiz-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem 4rem;
  min-height: calc(100dvh - 56px);
}

/* State cards ─────────────────────────────────────────────────────────── */
.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 60dvh;
  color: #64748b;
  text-align: center;
}
.state-card--error { color: #dc2626; }
.spinner {
  width: 36px; height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.btn-back {
  padding: 0.5rem 1.25rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 0.875rem;
  color: #374151;
}

/* Top Bar ─────────────────────────────────────────────────────────────── */
.quiz-topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
}
.btn-icon {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #64748b;
  padding: 0.25rem;
  min-width: 32px;
  min-height: 32px;
}
.topbar-center { flex: 1; text-align: center; }
.topic-label   { display: block; font-size: 0.75rem; color: #94a3b8; }
.progress-text { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.score-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

/* Progress bar ─────────────────────────────────────────────────────────── */
.progress-bar-wrap {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin-bottom: 1rem;
}
.progress-bar {
  height: 100%;
  background: #6366f1;
  border-radius: 2px;
  transition: width 0.3s;
}

/* Question card ─────────────────────────────────────────────────────────── */
.question-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.image-hint {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 0.6rem 0.875rem;
  font-size: 0.8rem;
  color: #92400e;
  margin-bottom: 1rem;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.q-no     { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
.q-diff, .q-source {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}
.diff--easy   { background: #dcfce7; color: #16a34a; }
.diff--medium { background: #fef9c3; color: #ca8a04; }
.diff--hard   { background: #fee2e2; color: #dc2626; }
.q-source     { background: #f1f5f9; color: #64748b; }

.question-text {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #1e293b;
  margin: 0 0 1.25rem;
  white-space: pre-wrap;
}

/* Options ─────────────────────────────────────────────────────────────── */
.options { display: flex; flex-direction: column; gap: 0.5rem; }

.option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  text-align: left;
  transition: all 0.12s;
  min-height: 48px;
  line-height: 1.5;
}
.option:not(.answered):hover { border-color: #6366f1; background: #eef2ff; }
.option:disabled:not(.answered) { opacity: 0.5; }

.opt-label {
  width: 24px;
  height: 24px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}
.opt-text { font-size: 0.875rem; color: #374151; flex: 1; }

.opt--correct { border-color: #22c55e; background: #f0fdf4; }
.opt--correct .opt-label { background: #22c55e; color: #fff; }
.opt--wrong   { border-color: #ef4444; background: #fef2f2; }
.opt--wrong   .opt-label { background: #ef4444; color: #fff; }
.opt--dim     { opacity: 0.5; }

/* Feedback ─────────────────────────────────────────────────────────────── */
.feedback {
  margin-top: 1rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}
.feedback--correct { background: #f0fdf4; color: #16a34a; }
.feedback--wrong   { background: #fef2f2; color: #dc2626; }

/* Explanation ─────────────────────────────────────────────────────────── */
.explain-section { margin-top: 0.75rem; }
.explain-toggle {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.25rem 0;
}
.explain-body {
  background: #f8fafc;
  border-left: 3px solid #6366f1;
  border-radius: 0 8px 8px 0;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.6;
  margin-top: 0.5rem;
  white-space: pre-wrap;
}

/* Navigation ─────────────────────────────────────────────────────────── */
.nav-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.btn-nav {
  padding: 0.625rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 0.875rem;
  color: #374151;
  transition: all 0.1s;
  min-height: 40px;
  flex-shrink: 0;
}
.btn-nav:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-nav:not(:disabled):hover { border-color: #6366f1; color: #4f46e5; }
.btn-nav--primary {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
.btn-nav--primary:not(:disabled):hover { background: #4f46e5; border-color: #4f46e5; color: #fff; }

.dot-nav {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  max-height: 48px;
  overflow: hidden;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #e2e8f0;
  padding: 0;
  min-height: 8px;
  transition: background 0.1s;
}
.dot--answered  { background: #6366f1; }
.dot--current   { background: #1e293b; transform: scale(1.3); }

.keyboard-hint {
  text-align: center;
  font-size: 0.7rem;
  color: #cbd5e1;
  margin: 0;
}
</style>
