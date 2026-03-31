/**
 * useQuizSession
 * Formula: Session = questions[] → state(index, answers) → progress → sync
 * 管理刷題的答題狀態、進度追蹤、解析顯示、Supabase 同步
 */
import { ref, computed, readonly } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useQuizSession(questions) {
  const auth = useAuthStore()

  // ── State ──────────────────────────────────────────────────────────────
  const currentIndex  = ref(0)
  const answers       = ref({})   // { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const showExplain   = ref({})   // { [questionId]: boolean }
  const syncQueue     = ref([])   // Pending progress rows to write to Supabase

  // ── Getters ────────────────────────────────────────────────────────────
  const total          = computed(() => questions.value?.length ?? 0)
  const current        = computed(() => questions.value?.[currentIndex.value] ?? null)
  const isFirst        = computed(() => currentIndex.value === 0)
  const isLast         = computed(() => currentIndex.value === total.value - 1)
  const answeredCount  = computed(() => Object.keys(answers.value).length)
  const progressPct    = computed(() =>
    total.value > 0 ? Math.round((answeredCount.value / total.value) * 100) : 0
  )

  /** 當前題是否已作答 */
  const isAnswered = computed(() => {
    const q = current.value
    return q ? q.id in answers.value : false
  })

  /** 當前題作答是否正確 */
  const isCorrect = computed(() => {
    const q = current.value
    if (!q || !isAnswered.value) return null
    return answers.value[q.id] === q.answer
  })

  /** 本場得分統計 */
  const score = computed(() => {
    const total_ = Object.keys(answers.value).length
    if (total_ === 0) return null
    const correct = Object.entries(answers.value).filter(([qid, ans]) => {
      const q = questions.value?.find(q => String(q.id) === String(qid))
      return q?.answer === ans
    }).length
    return { correct, total: total_, pct: Math.round((correct / total_) * 100) }
  })

  // ── Actions ────────────────────────────────────────────────────────────
  function answer(option) {
    const q = current.value
    if (!q || q.id in answers.value) return  // 已作答不可改

    answers.value[q.id]    = option
    showExplain.value[q.id] = true

    // Queue for Supabase sync
    if (auth.isLoggedIn) {
      syncQueue.value.push({
        user_id:         auth.user.id,
        question_id:     q.id,
        is_correct:      option === q.answer,
        selected_answer: option,
        answered_at:     new Date().toISOString()
      })
      // Fire-and-forget batch sync every 5 answers
      if (syncQueue.value.length >= 5) flushSync()
    }
  }

  function next() {
    if (!isLast.value) currentIndex.value++
  }

  function prev() {
    if (!isFirst.value) currentIndex.value--
  }

  function goTo(index) {
    if (index >= 0 && index < total.value) currentIndex.value = index
  }

  function toggleExplain() {
    const q = current.value
    if (!q) return
    showExplain.value[q.id] = !showExplain.value[q.id]
  }

  function isExplainVisible(questionId) {
    return !!showExplain.value[questionId]
  }

  /** Flush pending progress rows to Supabase */
  async function flushSync() {
    if (syncQueue.value.length === 0) return
    const toSync = [...syncQueue.value]
    syncQueue.value = []
    try {
      await supabase.from('user_progress').insert(toSync)
    } catch (e) {
      // Re-queue on failure (simple retry)
      syncQueue.value.unshift(...toSync)
      console.warn('[useQuizSession] sync failed, will retry:', e.message)
    }
  }

  /** Call when quiz ends (navigate away etc.) */
  async function finalize() {
    await flushSync()
  }

  return {
    // State (readonly to prevent external mutation)
    currentIndex:  readonly(currentIndex),
    answers:       readonly(answers),
    // Getters
    total, current, isFirst, isLast,
    answeredCount, progressPct, isAnswered, isCorrect, score,
    // Actions
    answer, next, prev, goTo,
    toggleExplain, isExplainVisible,
    flushSync, finalize
  }
}
