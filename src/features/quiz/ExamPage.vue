<script setup>
// Task #16 — 模擬考模式（限時倒數、全題亂序、考後才顯示解析）
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCertifications } from '@/composables/useCertifications'
import { useCountdownTimer } from '@/composables/useCountdownTimer'
import { useAuthStore } from '@/stores/auth'
import { setExamResult } from '@/lib/examSession'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const { getSubjectName, getSubject } = useCertifications()

const subjectId = route.params.subjectId

// ── Load & Shuffle ────────────────────────────────────────────────────────
const questions = ref([])
const loading   = ref(true)
const error     = ref(null)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

onMounted(async () => {
  try {
    const { data, error: err } = await supabase
      .from('questions')
      .select('*')
      .eq('subject_id', subjectId)

    if (err) throw err
    questions.value = shuffle(data ?? [])
  } catch (e) {
    error.value = e.message
    console.error('[ExamPage] load failed:', e)
  } finally {
    loading.value = false
  }

  if (!error.value && questions.value.length > 0) {
    timer.start(getTimeLimitMinutes(), handleTimeUp)
  }
})

// ── Timer ─────────────────────────────────────────────────────────────────
const timer = useCountdownTimer()

function getTimeLimitMinutes() {
  const subject = getSubject(subjectId)
  const examQ   = subject?.subject?.exam_questions ?? 80
  return examQ <= 50 ? 60 : 90
}

function handleTimeUp() {
  submitExam()
}

// ── Answer State ───────────────────────────────────────────────────────────
const answers    = ref({})
const currentIdx = ref(0)
const submitted  = ref(false)

const total         = computed(() => questions.value.length)
const current       = computed(() => questions.value[currentIdx.value] ?? null)
const isFirst       = computed(() => currentIdx.value === 0)
const isLast        = computed(() => currentIdx.value === total.value - 1)
const answeredCount = computed(() => Object.keys(answers.value).length)

function answer(option) {
  const q = current.value
  if (!q || submitted.value) return
  answers.value = { ...answers.value, [q.id]: option }
}

function next()  { if (!isLast.value)  currentIdx.value++ }
function prev()  { if (!isFirst.value) currentIdx.value-- }
function goTo(i) { if (i >= 0 && i < total.value) currentIdx.value = i }

// ── Keyboard ──────────────────────────────────────────────────────────────
function onKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  const key = e.key.toUpperCase()
  if (['A','B','C','D'].includes(key)) answer(key)
  else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
  else if (e.key === 'ArrowLeft') prev()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  timer.stop()
})

// ── Submit ─────────────────────────────────────────────────────────────────
async function submitExam() {
  if (submitted.value) return
  submitted.value = true
  timer.stop()

  const timeData = timer.getTimeData()

  // Sync to Supabase (fire-and-forget)
  if (auth.isLoggedIn) {
    const progressRows = questions.value
      .filter(q => answers.value[q.id])
      .map(q => ({
        user_id:         auth.user.id,
        question_id:     q.id,
        is_correct:      answers.value[q.id] === q.answer,
        selected_answer: answers.value[q.id],
        answered_at:     new Date().toISOString(),
      }))

    if (progressRows.length > 0) {
      supabase.from('user_progress').insert(progressRows).then(({ error: e }) => {
        if (e) console.warn('[Exam] sync failed:', e.message)
      })
    }
  }

  setExamResult({
    subjectId,
    questions: questions.value,
    answers:   { ...answers.value },
    timeData,
  })

  router.replace({ name: 'ExamResult', params: { subjectId } })
}

// ── UI Helpers ────────────────────────────────────────────────────────────
function optionClass(q, label) {
  const selected = answers.value[q.id]
  return selected === label ? 'opt--selected' : ''
}

function dotClass(i) {
  const q = questions.value[i]
  if (!q) return ''
  if (i === currentIdx.value) return 'dot--current'
  if (answers.value[q.id]) return 'dot--answered'
  return ''
}
</script>

<template>
  <div class="exam-page">

    <!-- Loading -->
    <div v-if="loading" class="state-card">
      <div class="spinner" />
      <p>載入試題中...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-card state-card--error">
      <p>❌ {{ error }}</p>
      <button class="btn-back" @click="router.back()">返回</button>
    </div>

    <!-- Empty -->
    <div v-else-if="total === 0" class="state-card">
      <p style="font-size:2rem">📭</p>
      <p>此科目尚無題目，無法進行模擬考</p>
      <button class="btn-back" @click="router.back()">返回</button>
    </div>

    <!-- Exam UI -->
    <template v-else>
      <!-- Top bar -->
      <div class="exam-topbar">
        <div class="topbar-left">
          <span class="subject-label">{{ getSubjectName(subjectId) }}</span>
          <span class="exam-badge">模擬考</span>
        </div>
        <div class="topbar-center">
          <span class="progress-text">{{ currentIdx + 1 }} / {{ total }}</span>
          <span class="answered-count">已作答 {{ answeredCount }}</span>
        </div>
        <div class="topbar-right">
          <span
            class="timer"
            :class="{
              'timer--warning': timer.isWarning.value,
              'timer--urgent':  timer.remainingMs.value !== null && timer.remainingMs.value < 30000
            }"
          >
            ⏱ {{ timer.formattedTime.value }}
          </span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: (answeredCount / total * 100) + '%' }" />
      </div>

      <!-- Question Card -->
      <div class="question-card" v-if="current">
        <div v-if="current.has_image" class="image-hint">
          📷 此題含圖片，請參照原試題第 {{ current.image_note || '?' }} 頁
        </div>

        <div class="question-meta">
          <span class="q-no">第 {{ currentIdx + 1 }} 題</span>
          <span v-if="current.difficulty" class="q-diff" :class="`diff--${current.difficulty}`">
            {{ { easy: '易', medium: '中', hard: '難' }[current.difficulty] }}
          </span>
        </div>

        <p class="question-text">{{ current.question }}</p>

        <div class="options">
          <button
            v-for="label in ['A','B','C','D']"
            :key="label"
            class="option"
            :class="optionClass(current, label)"
            @click="answer(label)"
          >
            <span class="opt-label">{{ label }}</span>
            <span class="opt-text">{{ current[`option_${label.toLowerCase()}`] }}</span>
          </button>
        </div>

        <div v-if="answers[current.id]" class="exam-answered-hint">
          ✓ 已作答（交卷後顯示解析）
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
            :class="dotClass(i)"
            @click="goTo(i)"
          />
        </div>

        <button class="btn-nav btn-nav--primary" :disabled="isLast" @click="next()">
          下一題 →
        </button>
      </div>

      <!-- Submit -->
      <div class="submit-area">
        <p class="submit-hint">
          已作答 {{ answeredCount }} / {{ total }} 題
          <template v-if="answeredCount < total">
            （尚有 {{ total - answeredCount }} 題未作答）
          </template>
        </p>
        <button class="btn-submit" @click="submitExam">
          交卷並查看結果 →
        </button>
      </div>

      <p class="keyboard-hint">鍵盤：A B C D 作答 · ← → 切換題目</p>
    </template>
  </div>
</template>

<style scoped>
.exam-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem 4rem;
  min-height: calc(100dvh - 56px);
}

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

/* Top bar */
.exam-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  gap: 0.5rem;
}
.topbar-left   { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
.topbar-center { text-align: center; flex: 1; }
.topbar-right  { flex: 1; text-align: right; }

.subject-label { font-size: 0.8rem; color: #64748b; white-space: nowrap; }
.exam-badge {
  font-size: 0.65rem;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
}
.progress-text  { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.answered-count { display: block; font-size: 0.7rem; color: #94a3b8; }

.timer {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}
.timer--warning { color: #f59e0b; }
.timer--urgent  { color: #dc2626; animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0.3; } }

/* Progress */
.progress-bar-wrap {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin-bottom: 1rem;
}
.progress-bar {
  height: 100%;
  background: #f59e0b;
  border-radius: 2px;
  transition: width 0.3s;
}

/* Question card */
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
.q-no   { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
.q-diff {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}
.diff--easy   { background: #dcfce7; color: #16a34a; }
.diff--medium { background: #fef9c3; color: #ca8a04; }
.diff--hard   { background: #fee2e2; color: #dc2626; }
.question-text {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #1e293b;
  margin: 0 0 1.25rem;
  white-space: pre-wrap;
}

/* Options */
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
.option:hover { border-color: #6366f1; background: #eef2ff; }
.opt--selected { border-color: #6366f1; background: #eef2ff; }
.opt--selected .opt-label { background: #6366f1; color: #fff; }
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

.exam-answered-hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #6366f1;
  font-weight: 500;
}

/* Navigation */
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
.btn-nav--primary { background: #6366f1; border-color: #6366f1; color: #fff; }
.btn-nav--primary:not(:disabled):hover { background: #4f46e5; }

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
.dot--answered { background: #f59e0b; }
.dot--current  { background: #1e293b; transform: scale(1.3); }

/* Submit */
.submit-area {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.submit-hint { font-size: 0.85rem; color: #64748b; margin: 0; }
.btn-submit {
  padding: 0.6rem 1.25rem;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  min-height: 40px;
  flex-shrink: 0;
  transition: background 0.15s;
}
.btn-submit:hover { background: #d97706; }

.keyboard-hint {
  text-align: center;
  font-size: 0.7rem;
  color: #cbd5e1;
  margin: 0;
}
</style>
