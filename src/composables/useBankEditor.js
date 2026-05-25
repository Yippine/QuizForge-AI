/**
 * useBankEditor — Task #28 / Task #29
 * Formula: Supabase questions 查詢 → 篩選/搜尋 → 編輯/刪除 → 同步更新
 * 題庫編輯邏輯：列表查詢、分頁、過濾、編輯、刪除
 *
 * Task #29 增強：權限控制
 * - Admin 可查看所有題目
 * - 普通使用者只能查看 public 題目或自己建立的 private 題目
 */
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useBankEditor() {
  const auth = useAuthStore()

  // ── State ────────────────────────────────────────────────────────────────
  const questions = ref([])
  const loading = ref(false)
  const totalCount = ref(0)
  const error = ref(null)

  // Pagination & filtering
  const currentPage = ref(1)
  const pageSize = ref(30)

  // Filters
  const filters = ref({
    subjectId: null,
    topicId: null,
    sourceType: null,
    difficulty: null,
    searchText: ''
  })

  // ── Computed ──────────────────────────────────────────────────────────────
  const offset = computed(() => (currentPage.value - 1) * pageSize.value)
  const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

  // ── Query builder ─────────────────────────────────────────────────────────
  function buildQuery() {
    let query = supabase.from('questions').select('*', { count: 'exact' })

    // ── Permission filter ─────────────────────────────────────────────────
    // Admin: 看所有題目
    // 普通使用者: 只能看 public 或自己建立的 private 題目
    if (!auth.isAdmin) {
      query = query.or(
        `access_level.eq.public,and(access_level.eq.private,owner_id.eq.${auth.userId})`
      )
    }
    // Admin 不需要篩選，可以看所有 access_level

    // ── Content filters ──────────────────────────────────────────────────
    if (filters.value.subjectId) {
      query = query.eq('subject_id', filters.value.subjectId)
    }
    if (filters.value.topicId) {
      query = query.eq('topic_id', filters.value.topicId)
    }
    if (filters.value.sourceType) {
      query = query.eq('source_type', filters.value.sourceType)
    }
    if (filters.value.difficulty) {
      query = query.eq('difficulty', filters.value.difficulty)
    }
    if (filters.value.searchText) {
      // 全文搜尋題目內容（不分大小寫）
      query = query.ilike('question', `%${filters.value.searchText}%`)
    }

    return query
  }

  // ── Fetch questions ──────────────────────────────────────────────────────
  async function fetchQuestions() {
    loading.value = true
    error.value = null
    try {
      const query = buildQuery()
        .order('source_year', { ascending: false })
        .order('source_batch', { ascending: false })
        .order('question_no', { ascending: true })
        .range(offset.value, offset.value + pageSize.value - 1)

      const { data, error: err, count } = await query

      if (err) throw err

      questions.value = data ?? []
      totalCount.value = count ?? 0
    } catch (e) {
      error.value = `查詢失敗：${e.message}`
      console.error('[useBankEditor] fetchQuestions error:', e)
    } finally {
      loading.value = false
    }
  }

  // ── Filter & search ──────────────────────────────────────────────────────
  function setFilter(filterName, value) {
    filters.value[filterName] = value
    currentPage.value = 1  // 重置到第一頁
    fetchQuestions()
  }

  function clearFilters() {
    filters.value = {
      subjectId: null,
      topicId: null,
      sourceType: null,
      difficulty: null,
      searchText: ''
    }
    currentPage.value = 1
    fetchQuestions()
  }

  function goToPage(page) {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
    fetchQuestions()
  }

  // ── Edit question ───────────────────────────────────────────────────────
  async function updateQuestion(questionId, updates) {
    try {
      // 檢查編輯權限
      const question = questions.value.find(q => q.id === questionId)
      if (!question) {
        throw new Error('題目不存在')
      }

      // 只有所有者或管理員才能編輯
      if (!auth.isAdmin && question.owner_id !== auth.userId) {
        throw new Error('您沒有權限編輯此題目')
      }

      const { error: err } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', questionId)

      if (err) throw err

      // Update local state
      const idx = questions.value.findIndex(q => q.id === questionId)
      if (idx >= 0) {
        questions.value[idx] = { ...questions.value[idx], ...updates }
      }

      return true
    } catch (e) {
      error.value = `編輯失敗：${e.message}`
      console.error('[useBankEditor] updateQuestion error:', e)
      return false
    }
  }

  // ── Delete question ──────────────────────────────────────────────────────
  async function deleteQuestion(questionId) {
    try {
      // 檢查刪除權限
      const question = questions.value.find(q => q.id === questionId)
      if (!question) {
        throw new Error('題目不存在')
      }

      // 只有所有者或管理員才能刪除
      if (!auth.isAdmin && question.owner_id !== auth.userId) {
        throw new Error('您沒有權限刪除此題目')
      }

      const { error: err } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (err) throw err

      // Update local state
      questions.value = questions.value.filter(q => q.id !== questionId)
      totalCount.value--

      // Refresh if current page is now empty
      if (questions.value.length === 0 && currentPage.value > 1) {
        goToPage(currentPage.value - 1)
      } else {
        fetchQuestions()
      }

      return true
    } catch (e) {
      error.value = `刪除失敗：${e.message}`
      console.error('[useBankEditor] deleteQuestion error:', e)
      return false
    }
  }

  // ── Fetch single question (for editing) ───────────────────────────────
  async function fetchQuestion(questionId) {
    try {
      const { data, error: err } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()

      if (err) throw err
      return data
    } catch (e) {
      console.error('[useBankEditor] fetchQuestion error:', e)
      return null
    }
  }

  return {
    // State
    questions,
    loading,
    totalCount,
    error,
    currentPage,
    pageSize,
    filters,

    // Computed
    offset,
    totalPages,

    // Methods
    fetchQuestions,
    setFilter,
    clearFilters,
    goToPage,
    updateQuestion,
    deleteQuestion,
    fetchQuestion
  }
}
