<script setup>
// Task #27 — GUI 編輯 certifications.json（新增/修改認證/科目/主題）
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCertConfig } from '@/composables/useCertConfig'

const router = useRouter()
const { config, loading, saving, error, isDirty, loadConfig, saveConfig, exportConfig, resetToDefault } = useCertConfig()

// ── State ─────────────────────────────────────────────────────────────────
const editMode    = ref(null)  // null | 'add-cert' | 'edit-cert' | 'add-subject' | ...
const selectedCert = ref(null)
const selectedSubject = ref(null)
const selectedChapter = ref(null)
const currentForm = ref({})    // 當前編輯表單數據

// ── Lifecycle ─────────────────────────────────────────────────────────────
import { onMounted, watch } from 'vue'

onMounted(() => {
  loadConfig()
})

// 監聽配置更改
watch(() => config.value, () => {
  isDirty.value = true
}, { deep: true })

// ── Functions ─────────────────────────────────────────────────────────────

// 關閉編輯模式
function closeEdit() {
  editMode.value = null
  currentForm.value = {}
  selectedCert.value = null
  selectedSubject.value = null
  selectedChapter.value = null
}

// ── Certification operations ──────────────────────────────────────────────

function openAddCert() {
  editMode.value = 'add-cert'
  currentForm.value = { id: '', name: '', name_en: '', level: '', icon: '', subjects: [] }
}

function editCert(cert) {
  selectedCert.value = cert
  editMode.value = 'edit-cert'
  currentForm.value = JSON.parse(JSON.stringify(cert))
}

async function saveCert() {
  if (!currentForm.value.id || !currentForm.value.name) {
    alert('認證 ID 和名稱不能為空')
    return
  }

  if (editMode.value === 'add-cert') {
    // 檢查重複
    if (config.value.certifications.some(c => c.id === currentForm.value.id)) {
      alert('此認證 ID 已存在')
      return
    }
    config.value.certifications.push(currentForm.value)
  } else {
    // 更新
    const idx = config.value.certifications.findIndex(c => c.id === selectedCert.value.id)
    if (idx >= 0) {
      config.value.certifications[idx] = currentForm.value
    }
  }

  await saveConfig()
  closeEdit()
}

function deleteCert(certId) {
  if (!confirm(`確定要刪除認證 "${certId}" 嗎？`)) return
  config.value.certifications = config.value.certifications.filter(c => c.id !== certId)
  saveConfig()
}

// ── Subject operations ────────────────────────────────────────────────────

function openAddSubject(cert) {
  selectedCert.value = cert
  editMode.value = 'add-subject'
  currentForm.value = { id: '', name: '', short_name: '', icon: '', exam_questions: 0, chapters: [] }
}

function editSubject(cert, subject) {
  selectedCert.value = cert
  selectedSubject.value = subject
  editMode.value = 'edit-subject'
  currentForm.value = JSON.parse(JSON.stringify(subject))
}

async function saveSubject() {
  if (!currentForm.value.id || !currentForm.value.name) {
    alert('科目 ID 和名稱不能為空')
    return
  }

  if (editMode.value === 'add-subject') {
    if (selectedCert.value.subjects.some(s => s.id === currentForm.value.id)) {
      alert('此科目 ID 已存在')
      return
    }
    selectedCert.value.subjects.push(currentForm.value)
  } else {
    const idx = selectedCert.value.subjects.findIndex(s => s.id === selectedSubject.value.id)
    if (idx >= 0) {
      selectedCert.value.subjects[idx] = currentForm.value
    }
  }

  await saveConfig()
  closeEdit()
}

function deleteSubject(cert, subjectId) {
  if (!confirm(`確定要刪除科目 "${subjectId}" 嗎？`)) return
  cert.subjects = cert.subjects.filter(s => s.id !== subjectId)
  saveConfig()
}

// ── Chapter operations ────────────────────────────────────────────────────

function openAddChapter(cert, subject) {
  selectedCert.value = cert
  selectedSubject.value = subject
  editMode.value = 'add-chapter'
  currentForm.value = { id: '', name: '', topics: [] }
}

function editChapter(cert, subject, chapter) {
  selectedCert.value = cert
  selectedSubject.value = subject
  selectedChapter.value = chapter
  editMode.value = 'edit-chapter'
  currentForm.value = JSON.parse(JSON.stringify(chapter))
}

async function saveChapter() {
  if (!currentForm.value.id || !currentForm.value.name) {
    alert('章節 ID 和名稱不能為空')
    return
  }

  if (editMode.value === 'add-chapter') {
    if (selectedSubject.value.chapters.some(c => c.id === currentForm.value.id)) {
      alert('此章節 ID 已存在')
      return
    }
    selectedSubject.value.chapters.push(currentForm.value)
  } else {
    const idx = selectedSubject.value.chapters.findIndex(c => c.id === selectedChapter.value.id)
    if (idx >= 0) {
      selectedSubject.value.chapters[idx] = currentForm.value
    }
  }

  await saveConfig()
  closeEdit()
}

function deleteChapter(subject, chapterId) {
  if (!confirm(`確定要刪除章節 "${chapterId}" 嗎？`)) return
  subject.chapters = subject.chapters.filter(c => c.id !== chapterId)
  saveConfig()
}

// ── Topic operations ─────────────────────────────────────────────────────

function openAddTopic(cert, subject, chapter) {
  selectedCert.value = cert
  selectedSubject.value = subject
  selectedChapter.value = chapter
  editMode.value = 'add-topic'
  currentForm.value = { id: '', name: '' }
}

function editTopic(cert, subject, chapter, topic) {
  selectedCert.value = cert
  selectedSubject.value = subject
  selectedChapter.value = chapter
  selectedTopic.value = topic
  editMode.value = 'edit-topic'
  currentForm.value = JSON.parse(JSON.stringify(topic))
}

const selectedTopic = ref(null)

async function saveTopic() {
  if (!currentForm.value.id || !currentForm.value.name) {
    alert('主題 ID 和名稱不能為空')
    return
  }

  if (editMode.value === 'add-topic') {
    if (selectedChapter.value.topics.some(t => t.id === currentForm.value.id)) {
      alert('此主題 ID 已存在')
      return
    }
    selectedChapter.value.topics.push(currentForm.value)
  } else {
    const idx = selectedChapter.value.topics.findIndex(t => t.id === selectedTopic.value.id)
    if (idx >= 0) {
      selectedChapter.value.topics[idx] = currentForm.value
    }
  }

  await saveConfig()
  closeEdit()
}

function deleteTopic(chapter, topicId) {
  if (!confirm(`確定要刪除主題 "${topicId}" 嗎？`)) return
  chapter.topics = chapter.topics.filter(t => t.id !== topicId)
  saveConfig()
}

// ── Export / Reset ───────────────────────────────────────────────────────

function handleExport() {
  const json = exportConfig()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'certifications.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="cert-editor-page">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'Bank' })">← 題庫管理</button>
      <div>
        <h1 class="page-title">認證結構編輯</h1>
        <p class="page-subtitle">管理認證、科目、章節與主題結構。修改即時生效。</p>
        <div v-if="isDirty" class="status-dirty">⚠️ 有未保存的更改</div>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="handleExport">⬇️ 匯出 JSON</button>
        <button class="btn-secondary" @click="resetToDefault" :disabled="saving">⟲ 重置</button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-box">
      <div class="spinner" />
      <p>載入設定中…</p>
    </div>

    <!-- Error alert -->
    <div v-if="error" class="alert alert--error">
      ⚠️ {{ error }}
    </div>

    <!-- Main content -->
    <template v-if="config && !loading">
      <div class="editor-container">
        <!-- Left panel: Tree view -->
        <div class="tree-panel">
          <div class="tree-header">
            <h2>結構樹</h2>
            <button class="btn-add-cert" @click="openAddCert">＋ 新增認證</button>
          </div>

          <div class="tree-list">
            <div v-for="cert in config.certifications" :key="cert.id" class="tree-cert">
              <div class="tree-item" :class="{ active: selectedCert?.id === cert.id }">
                <div class="tree-icon">{{ cert.icon }}</div>
                <div class="tree-label">
                  <div class="tree-name">{{ cert.name }}</div>
                  <div class="tree-id">{{ cert.id }}</div>
                </div>
                <div class="tree-actions">
                  <button class="action-btn edit" @click="editCert(cert)" title="編輯">✎</button>
                  <button class="action-btn delete" @click="deleteCert(cert.id)" title="刪除">✕</button>
                </div>
              </div>

              <!-- Subjects -->
              <div v-if="selectedCert?.id === cert.id" class="tree-children">
                <div v-for="subject in cert.subjects" :key="subject.id" class="tree-subject">
                  <div class="tree-item" :class="{ active: selectedSubject?.id === subject.id }">
                    <div class="tree-icon indent-1">{{ subject.icon }}</div>
                    <div class="tree-label">
                      <div class="tree-name">{{ subject.name }}</div>
                      <div class="tree-id">{{ subject.id }}</div>
                    </div>
                    <div class="tree-actions">
                      <button class="action-btn edit" @click="editSubject(cert, subject)" title="編輯">✎</button>
                      <button class="action-btn delete" @click="deleteSubject(cert, subject.id)" title="刪除">✕</button>
                    </div>
                  </div>

                  <!-- Chapters -->
                  <div v-if="selectedSubject?.id === subject.id" class="tree-children">
                    <div v-for="chapter in subject.chapters" :key="chapter.id" class="tree-chapter">
                      <div class="tree-item" :class="{ active: selectedChapter?.id === chapter.id }">
                        <div class="tree-icon indent-2">📄</div>
                        <div class="tree-label">
                          <div class="tree-name">{{ chapter.name }}</div>
                          <div class="tree-id">{{ chapter.id }}</div>
                        </div>
                        <div class="tree-actions">
                          <button class="action-btn edit" @click="editChapter(cert, subject, chapter)" title="編輯">✎</button>
                          <button class="action-btn delete" @click="deleteChapter(subject, chapter.id)" title="刪除">✕</button>
                        </div>
                      </div>

                      <!-- Topics -->
                      <div v-if="selectedChapter?.id === chapter.id" class="tree-children">
                        <div v-for="topic in chapter.topics" :key="topic.id" class="tree-topic">
                          <div class="tree-item">
                            <div class="tree-icon indent-3">●</div>
                            <div class="tree-label">
                              <div class="tree-name">{{ topic.name }}</div>
                              <div class="tree-id">{{ topic.id }}</div>
                            </div>
                            <div class="tree-actions">
                              <button class="action-btn edit" @click="editTopic(cert, subject, chapter, topic)" title="編輯">✎</button>
                              <button class="action-btn delete" @click="deleteTopic(chapter, topic.id)" title="刪除">✕</button>
                            </div>
                          </div>
                        </div>

                        <!-- Add topic button -->
                        <button class="btn-inline-add" @click="openAddTopic(cert, subject, chapter)">
                          ＋ 新增主題
                        </button>
                      </div>
                    </div>

                    <!-- Add chapter button -->
                    <button class="btn-inline-add" @click="openAddChapter(cert, subject)">
                      ＋ 新增章節
                    </button>
                  </div>
                </div>

                <!-- Add subject button -->
                <button class="btn-inline-add" @click="openAddSubject(cert)">
                  ＋ 新增科目
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right panel: Edit form -->
        <div class="form-panel">
          <template v-if="editMode">
            <!-- Cert form -->
            <template v-if="editMode === 'add-cert' || editMode === 'edit-cert'">
              <h3 class="form-title">
                {{ editMode === 'add-cert' ? '新增認證' : '編輯認證' }}
              </h3>
              <div class="form-group">
                <label>ID *</label>
                <input v-model="currentForm.id" class="form-input" placeholder="e.g. ipas-ai-planning" />
              </div>
              <div class="form-group">
                <label>名稱 (繁體) *</label>
                <input v-model="currentForm.name" class="form-input" />
              </div>
              <div class="form-group">
                <label>名稱 (English)</label>
                <input v-model="currentForm.name_en" class="form-input" />
              </div>
              <div class="form-group">
                <label>級別</label>
                <input v-model="currentForm.level" class="form-input" placeholder="e.g. basic, intermediate" />
              </div>
              <div class="form-group">
                <label>圖示</label>
                <input v-model="currentForm.icon" class="form-input" maxlength="2" />
              </div>
              <div class="form-actions">
                <button class="btn-secondary" @click="closeEdit">取消</button>
                <button class="btn-primary" @click="saveCert" :disabled="saving">
                  {{ saving ? '儲存中…' : '儲存' }}
                </button>
              </div>
            </template>

            <!-- Subject form -->
            <template v-if="editMode === 'add-subject' || editMode === 'edit-subject'">
              <h3 class="form-title">
                {{ editMode === 'add-subject' ? '新增科目' : '編輯科目' }}
              </h3>
              <div class="form-group">
                <label>ID *</label>
                <input v-model="currentForm.id" class="form-input" />
              </div>
              <div class="form-group">
                <label>名稱 *</label>
                <input v-model="currentForm.name" class="form-input" />
              </div>
              <div class="form-group">
                <label>短名稱</label>
                <input v-model="currentForm.short_name" class="form-input" />
              </div>
              <div class="form-group">
                <label>圖示</label>
                <input v-model="currentForm.icon" class="form-input" maxlength="2" />
              </div>
              <div class="form-group">
                <label>試題數</label>
                <input v-model.number="currentForm.exam_questions" type="number" class="form-input" />
              </div>
              <div class="form-actions">
                <button class="btn-secondary" @click="closeEdit">取消</button>
                <button class="btn-primary" @click="saveSubject" :disabled="saving">
                  {{ saving ? '儲存中…' : '儲存' }}
                </button>
              </div>
            </template>

            <!-- Chapter form -->
            <template v-if="editMode === 'add-chapter' || editMode === 'edit-chapter'">
              <h3 class="form-title">
                {{ editMode === 'add-chapter' ? '新增章節' : '編輯章節' }}
              </h3>
              <div class="form-group">
                <label>ID *</label>
                <input v-model="currentForm.id" class="form-input" />
              </div>
              <div class="form-group">
                <label>名稱 *</label>
                <input v-model="currentForm.name" class="form-input" />
              </div>
              <div class="form-actions">
                <button class="btn-secondary" @click="closeEdit">取消</button>
                <button class="btn-primary" @click="saveChapter" :disabled="saving">
                  {{ saving ? '儲存中…' : '儲存' }}
                </button>
              </div>
            </template>

            <!-- Topic form -->
            <template v-if="editMode === 'add-topic' || editMode === 'edit-topic'">
              <h3 class="form-title">
                {{ editMode === 'add-topic' ? '新增主題' : '編輯主題' }}
              </h3>
              <div class="form-group">
                <label>ID * (官方簡章 ID)</label>
                <input v-model="currentForm.id" class="form-input" placeholder="e.g. L11101" />
              </div>
              <div class="form-group">
                <label>名稱 *</label>
                <input v-model="currentForm.name" class="form-input" />
              </div>
              <div class="form-actions">
                <button class="btn-secondary" @click="closeEdit">取消</button>
                <button class="btn-primary" @click="saveTopic" :disabled="saving">
                  {{ saving ? '儲存中…' : '儲存' }}
                </button>
              </div>
            </template>
          </template>

          <template v-else>
            <div class="empty-state">
              <p>👈 選擇左邊項目進行編輯</p>
              <p class="hint">或點擊新增按鈕建立新項目</p>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cert-editor-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
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

.status-dirty {
  font-size: 0.75rem;
  color: #f59e0b;
  margin-top: 0.4rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-secondary {
  padding: 0.5rem 0.9rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Loading */
.loading-box {
  text-align: center;
  padding: 3rem 1rem;
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

/* Alerts */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.alert--error { background: #fee2e2; color: #dc2626; }

/* Editor container */
.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .editor-container {
    grid-template-columns: 1fr;
  }
}

/* Tree panel */
.tree-panel {
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tree-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tree-header h2 {
  margin: 0;
  font-size: 1rem;
  color: #1e293b;
}

.btn-add-cert {
  padding: 0.4rem 0.75rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add-cert:hover { background: #4f46e5; }

/* Tree list */
.tree-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.tree-cert,
.tree-subject,
.tree-chapter,
.tree-topic {
  margin-bottom: 0.5rem;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;
}
.tree-item:hover { background: #e2e8f0; }
.tree-item.active { background: #dbeafe; border-left: 3px solid #6366f1; }

.tree-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
}
.tree-icon.indent-1 { margin-left: 1.5rem; }
.tree-icon.indent-2 { margin-left: 3rem; }
.tree-icon.indent-3 { margin-left: 4.5rem; }

.tree-label {
  flex: 1;
  min-width: 0;
}
.tree-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-id {
  font-size: 0.7rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-actions {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s;
}
.tree-item:hover .tree-actions { opacity: 1; }

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.1s;
}
.action-btn.edit { color: #6366f1; background: #eef2ff; }
.action-btn.edit:hover { background: #dbeafe; }
.action-btn.delete { color: #dc2626; background: #fee2e2; }
.action-btn.delete:hover { background: #fecaca; }

.tree-children {
  margin-left: 0.5rem;
  border-left: 1px solid #cbd5e1;
  padding-left: 0;
  margin-top: 0.25rem;
}

.btn-inline-add {
  margin-left: 1.5rem;
  margin-top: 0.25rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  background: #eef2ff;
  color: #6366f1;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
}
.btn-inline-add:hover { background: #dbeafe; }

/* Form panel */
.form-panel {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
}

.form-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.25rem;
}

.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.4rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
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
  transition: background 0.15s;
  cursor: pointer;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}
.btn-secondary:hover { background: #e2e8f0; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
}
.empty-state p {
  margin: 0.5rem 0;
}
.empty-state .hint {
  font-size: 0.8rem;
}
</style>
