<script setup>
// Task #28 — 題庫編輯頁面
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCertifications } from '@/composables/useCertifications'
import { useBankEditor } from '@/composables/useBankEditor'

const router = useRouter()
const auth = useAuthStore()
const { getCertifications, getTopics } = useCertifications()
const {
  questions,
  loading,
  totalCount,
  error,
  currentPage,
  pageSize,
  filters,
  totalPages,
  fetchQuestions,
  setFilter,
  clearFilters,
  goToPage,
  updateQuestion,
  deleteQuestion,
  fetchQuestion
} = useBankEditor()

// ── State ─────────────────────────────────────────────────────────────────
const editingQuestion = ref(null)
const showEditModal = ref(false)
const editForm = ref({})
const editLoading = ref(false)
const editError = ref(null)

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  fetchQuestions()
})

// ── Computed ──────────────────────────────────────────────────────────────
const certs = computed(() => getCertifications())

const subjects = computed(() => {
  // 列出所有科目（來自所有認證）
  const all = []
  for (const cert of certs.value) {
    for (const subject of cert.subjects) {
      all.push({ ...subject, cert_id: cert.id })
    }
  }
  return all
})

const topics = computed(() => {
  if (!filters.value.subjectId) return []
  return getTopics(filters.value.subjectId)
})

const hasActiveFilters = computed(() => {
  return (
    filters.value.subjectId ||
    filters.value.topicId ||
    filters.value.sourceType ||
    filters.value.difficulty ||
    filters.value.searchText
  )
})

// 判斷是否可編輯某道題
function canEditQuestion(question) {
  return auth.isAdmin || question.owner_id === auth.userId
}

// 判斷是否可刪除某道題
function canDeleteQuestion(question) {
  return auth.isAdmin || question.owner_id === auth.userId
}

// 取得存取權限的中文標籤和圖示
function getAccessLevelLabel(level) {
  const map = {
    public: { icon: '🔓', label: '公開' },
    private: { icon: '🔒', label: '私密' },
    org: { icon: '🏢', label: '企業內' }
  }
  return map[level] || { icon: '❓', label: level }
}

// ── Functions ─────────────────────────────────────────────────────────────

function openEditModal(question) {
  editingQuestion.value = question
  editForm.value = JSON.parse(JSON.stringify(question))
  editError.value = null
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingQuestion.value = null
  editForm.value = {}
  editError.value = null
}

async function saveEdit() {
  if (!editForm.value.id) return

  editLoading.value = true
  editError.value = null
  try {
    const success = await updateQuestion(editForm.value.id, editForm.value)
    if (success) {
      closeEditModal()
    } else {
      editError.value = error.value
    }
  } catch (e) {
    editError.value = `保存失敗：${e.message}`
  } finally {
    editLoading.value = false
  }
}

async function confirmDelete(questionId, questionPreview) {
  // 檢查權限
  const question = questions.value.find(q => q.id === questionId)
  if (!question) return

  if (!canDeleteQuestion(question)) {
    alert('您沒有權限刪除此題目。\n\n只有所有者或管理員可以刪除。')
    return
  }

  if (!confirm(`確定要刪除這道題嗎？\n\n${questionPreview.substring(0, 50)}...`)) {
    return
  }

  const success = await deleteQuestion(questionId)
  if (!success) {
    alert(`刪除失敗：${error.value}`)
  }
}

function truncate(str, len = 50) {
  if (!str) return '—'
  return str.length > len ? str.substring(0, len) + '…' : str
}
</script>

<template>
  <div class="editor-page">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'Bank' })">← 題庫管理</button>
      <div>
        <h1 class="page-title">題庫編輯</h1>
        <p class="page-subtitle">查看、編輯和刪除題庫中的題目</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-section">
      <div class="filter-row">
        <!-- Subject filter -->
        <div class="filter-group">
          <label>科目</label>
          <select
            :value="filters.subjectId || ''"
            @change="setFilter('subjectId', $event.target.value || null)"
            class="filter-select"
          >
            <option value="">全部</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </div>

        <!-- Topic filter -->
        <div class="filter-group">
          <label>主題</label>
          <select
            :value="filters.topicId || ''"
            @change="setFilter('topicId', $event.target.value || null)"
            class="filter-select"
            :disabled="!filters.subjectId"
          >
            <option value="">全部</option>
            <option v-for="topic in topics" :key="topic.id" :value="topic.id">
              {{ topic.name }}
            </option>
          </select>
        </div>

        <!-- Source filter -->
        <div class="filter-group">
          <label>來源</label>
          <select
            :value="filters.sourceType || ''"
            @change="setFilter('sourceType', $event.target.value || null)"
            class="filter-select"
          >
            <option value="">全部</option>
            <option value="sample">官方樣題</option>
            <option value="exercise">講義習題</option>
            <option value="ai">AI 試題</option>
            <option value="past">歷屆試題</option>
          </select>
        </div>

        <!-- Difficulty filter -->
        <div class="filter-group">
          <label>難度</label>
          <select
            :value="filters.difficulty || ''"
            @change="setFilter('difficulty', $event.target.value || null)"
            class="filter-select"
          >
            <option value="">全部</option>
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
        </div>
      </div>

      <!-- Search & buttons -->
      <div class="filter-row">
        <div class="filter-group flex-grow">
          <label>搜尋題目</label>
          <input
            :value="filters.searchText"
            @input="setFilter('searchText', $event.target.value)"
            type="text"
            placeholder="搜尋題目內容…"
            class="filter-input"
          />
        </div>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="btn-clear"
        >
          清除篩選
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-row">
      <div>
        <span v-if="!loading" class="summary-text">
          找到 <strong>{{ totalCount }}</strong> 道題目
          <template v-if="hasActiveFilters">（已篩選）</template>
        </span>
        <span v-else class="summary-text">載入中…</span>
      </div>
    </div>

    <!-- Error alert -->
    <div v-if="error" class="alert alert--error">
      ⚠️ {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-box">
      <div class="spinner" />
      <p>載入題目中…</p>
    </div>

    <!-- Table -->
    <template v-else-if="questions.length > 0">
      <div class="table-wrap">
        <table class="questions-table">
          <thead>
            <tr>
              <th>#</th>
              <th>科目</th>
              <th>主題</th>
              <th>難度</th>
              <th>來源</th>
              <th>存取</th>
              <th>題目預覽</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.id">
              <td class="td-num">{{ q.question_no }}</td>
              <td class="td-subject">{{ q.subject_id }}</td>
              <td class="td-topic">{{ q.topic_id }}</td>
              <td class="td-difficulty">
                <span v-if="q.difficulty" class="badge" :class="`badge-${q.difficulty}`">
                  {{ q.difficulty }}
                </span>
                <span v-else class="badge badge-empty">—</span>
              </td>
              <td class="td-source">
                <span class="badge" :class="`badge-${q.source_type}`">
                  {{ q.source_type }}
                </span>
              </td>
              <td class="td-access">
                <span class="badge badge-access" :title="`${getAccessLevelLabel(q.access_level).label}`">
                  {{ getAccessLevelLabel(q.access_level).icon }}
                </span>
              </td>
              <td class="td-preview">{{ truncate(q.question, 50) }}</td>
              <td class="td-actions">
                <button
                  class="action-btn edit"
                  @click="openEditModal(q)"
                  :disabled="!canEditQuestion(q)"
                  :title="canEditQuestion(q) ? '編輯' : '您沒有權限編輯此題目'"
                >
                  ✎
                </button>
                <button
                  class="action-btn delete"
                  @click="confirmDelete(q.id, q.question)"
                  :disabled="!canDeleteQuestion(q)"
                  :title="canDeleteQuestion(q) ? '刪除' : '您沒有權限刪除此題目'"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
          class="btn-pagination"
        >
          ← 上一頁
        </button>
        <span class="page-info">
          第 {{ currentPage }} / {{ totalPages }} 頁 · 每頁 {{ pageSize }} 題
        </span>
        <button
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
          class="btn-pagination"
        >
          下一頁 →
        </button>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>📭 沒有符合條件的題目</p>
      <button v-if="hasActiveFilters" @click="clearFilters" class="btn-link">
        清除篩選試試？
      </button>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>編輯題目</h2>
          <button class="close-btn" @click="closeEditModal">✕</button>
        </div>

        <!-- Error -->
        <div v-if="editError" class="alert alert--error" style="margin-top: 1rem">
          ⚠️ {{ editError }}
        </div>

        <!-- Form -->
        <div class="edit-form">
          <!-- Basic info -->
          <div class="form-row">
            <div class="form-group">
              <label>題號</label>
              <input v-model="editForm.question_no" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>科目 ID</label>
              <input v-model="editForm.subject_id" type="text" class="form-input" disabled />
            </div>
            <div class="form-group">
              <label>主題 ID</label>
              <input v-model="editForm.topic_id" type="text" class="form-input" disabled />
            </div>
          </div>

          <!-- Metadata -->
          <div class="form-row">
            <div class="form-group">
              <label>難度</label>
              <select v-model="editForm.difficulty" class="form-input">
                <option value="">—</option>
                <option value="easy">簡單</option>
                <option value="medium">中等</option>
                <option value="hard">困難</option>
              </select>
            </div>
            <div class="form-group">
              <label>來源</label>
              <select v-model="editForm.source_type" class="form-input">
                <option value="sample">官方樣題</option>
                <option value="exercise">講義習題</option>
                <option value="ai">AI 試題</option>
                <option value="past">歷屆試題</option>
              </select>
            </div>
            <div class="form-group">
              <label>年份</label>
              <input v-model="editForm.source_year" type="text" class="form-input" placeholder="民國年" />
            </div>
          </div>

          <!-- Question content -->
          <div class="form-group">
            <label>題目 *</label>
            <textarea v-model="editForm.question" class="form-textarea" rows="4" />
          </div>

          <!-- Options -->
          <div class="form-row">
            <div class="form-group">
              <label>選項 A *</label>
              <textarea v-model="editForm.option_a" class="form-textarea" rows="2" />
            </div>
            <div class="form-group">
              <label>選項 B *</label>
              <textarea v-model="editForm.option_b" class="form-textarea" rows="2" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>選項 C *</label>
              <textarea v-model="editForm.option_c" class="form-textarea" rows="2" />
            </div>
            <div class="form-group">
              <label>選項 D *</label>
              <textarea v-model="editForm.option_d" class="form-textarea" rows="2" />
            </div>
          </div>

          <!-- Answer & explanation -->
          <div class="form-row">
            <div class="form-group">
              <label>答案 *</label>
              <select v-model="editForm.answer" class="form-input">
                <option value="">—</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div class="form-group">
              <label>含圖片</label>
              <select v-model="editForm.has_image" class="form-input">
                <option :value="false">否</option>
                <option :value="true">是</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>解析</label>
            <textarea v-model="editForm.explanation" class="form-textarea" rows="3" />
          </div>

          <div class="form-group">
            <label>圖片說明</label>
            <input v-model="editForm.image_note" type="text" class="form-input" />
          </div>

          <!-- Permission fields (admin only) -->
          <div v-if="auth.isAdmin" class="divider">存取權限設定（僅管理員）</div>

          <div v-if="auth.isAdmin" class="form-row">
            <div class="form-group">
              <label>存取權限</label>
              <select v-model="editForm.access_level" class="form-input">
                <option value="public">🔓 公開 - 所有使用者</option>
                <option value="private">🔒 私密 - 僅所有者</option>
                <option value="org">🏢 企業內 - 限定組織</option>
              </select>
            </div>
            <div class="form-group">
              <label>所有者 ID</label>
              <input v-model="editForm.owner_id" type="text" class="form-input" disabled />
            </div>
          </div>

          <div v-if="auth.isAdmin && editForm.access_level === 'org'" class="form-group">
            <label>所屬企業</label>
            <input v-model="editForm.enterprise_id" type="text" class="form-input" placeholder="企業 ID（可選）" />
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button @click="closeEditModal" class="btn-secondary">取消</button>
            <button @click="saveEdit" :disabled="editLoading" class="btn-primary">
              {{ editLoading ? '儲存中…' : '儲存' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

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
  cursor: pointer;
}

.page-title    { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.8rem; color: #94a3b8; margin: 0; }

/* Filter section */
.filter-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-row:last-child { margin-bottom: 0; }

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.filter-select,
.filter-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 120px;
}

.filter-input {
  min-width: 200px;
}

.filter-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e2e8f0;
}

.filter-group.flex-grow {
  flex: 1;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-clear:hover { background: #e2e8f0; }

/* Summary */
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #64748b;
}

.summary-text strong { color: #1e293b; font-weight: 600; }

/* Alerts */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert--error { background: #fee2e2; color: #dc2626; }

/* Loading */
.loading-box {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Table */
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.questions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.questions-table th {
  background: #f8fafc;
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.questions-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.questions-table tr:last-child td { border-bottom: none; }
.questions-table tr:hover { background: #fafbff; }

.td-num      { width: 50px; text-align: center; color: #94a3b8; font-size: 0.8rem; }
.td-subject  { width: 80px; font-family: monospace; color: #64748b; }
.td-topic    { width: 80px; font-family: monospace; color: #64748b; }
.td-difficulty { width: 70px; }
.td-source   { width: 80px; }
.td-access   { width: 50px; text-align: center; }
.td-preview  { flex: 1; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-actions  { width: 90px; text-align: center; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-easy    { background: #dcfce7; color: #16a34a; }
.badge-medium  { background: #fef3c7; color: #d97706; }
.badge-hard    { background: #fee2e2; color: #dc2626; }
.badge-empty   { background: #f1f5f9; color: #64748b; }
.badge-sample    { background: #dbeafe; color: #0284c7; }
.badge-exercise  { background: #dcfce7; color: #15803d; }
.badge-ai        { background: #e9d5ff; color: #7c3aed; }
.badge-past      { background: #fef3c7; color: #b45309; }
.badge-access   { background: #f1f5f9; color: #475569; font-size: 1rem; }

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.1s;
}

.action-btn.edit {
  color: #6366f1;
  background: #eef2ff;
  margin-right: 0.25rem;
}

.action-btn.edit:hover { background: #dbeafe; }

.action-btn.delete {
  color: #dc2626;
  background: #fee2e2;
}

.action-btn.delete:hover { background: #fecaca; }

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1rem;
}

.btn-pagination {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-pagination:hover:not(:disabled) { background: #e2e8f0; }

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #64748b;
  min-width: 200px;
  text-align: center;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.empty-state p { margin: 0 0 1rem; font-size: 1.1rem; }

.btn-link {
  background: none;
  border: none;
  color: #6366f1;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-link:hover { color: #4f46e5; }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
}

.close-btn:hover { color: #475569; }

/* Form */
.edit-form {
  padding: 1.5rem;
}

.divider {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin: 1.5rem 0 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.form-input,
.form-textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border 0.15s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  color: #94a3b8;
}

.form-textarea {
  resize: vertical;
  font-family: 'Monaco', 'Menlo', monospace;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-primary,
.btn-secondary {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 36px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}

.btn-primary:hover:not(:disabled) { background: #4f46e5; }

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover { background: #e2e8f0; }
</style>
