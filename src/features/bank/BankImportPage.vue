<script setup>
// Task #24 — XLSX 拖拉上傳 + 解析預覽 + 確認匯入
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useXLSXParser } from '@/composables/useXLSXParser'
import { useBankImport } from '@/composables/useBankImport'

const router = useRouter()
const route  = useRoute()

const { parseFile, ALL_FIELDS } = useXLSXParser()
const { importRows, importing, progress, imported, skipped, errorMsg } = useBankImport()

// ── State ─────────────────────────────────────────────────────────────────
const step        = ref('upload')   // 'upload' | 'preview' | 'done'
const dragging    = ref(false)
const parseError  = ref(null)
const parsing     = ref(false)
const parseResult = ref(null)       // { total, validRows, invalidRows, allRows }
const showInvalid = ref(true)       // toggle error rows in table

// ── Preview columns (subset for table display) ────────────────────────────
const PREVIEW_COLS = [
  'cert_id', 'subject_id', 'topic_id', 'source_type',
  'source_year', 'source_batch', 'question_no',
  'question', 'answer', 'has_image',
]

// ── Computed ──────────────────────────────────────────────────────────────
const displayRows = computed(() => {
  if (!parseResult.value) return []
  const rows = showInvalid.value
    ? parseResult.value.allRows
    : parseResult.value.validRows
  return rows
})

const canImport = computed(() =>
  parseResult.value && parseResult.value.validRows.length > 0 && !importing.value
)

// ── File handling ─────────────────────────────────────────────────────────
function onDragOver(e) {
  e.preventDefault()
  dragging.value = true
}
function onDragLeave() { dragging.value = false }

function onDrop(e) {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onFileInput(e) {
  const file = e.target.files?.[0]
  if (file) handleFile(file)
}

async function handleFile(file) {
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    parseError.value = '請上傳 .xlsx 或 .xls 檔案'
    return
  }
  parseError.value = null
  parsing.value    = true
  parseResult.value = null

  try {
    const result = await parseFile(file)
    parseResult.value = result
    step.value = 'preview'
  } catch (e) {
    parseError.value = e.message ?? '解析失敗，請確認使用正確的模板格式'
  } finally {
    parsing.value = false
  }
}

// ── Import ────────────────────────────────────────────────────────────────
async function confirmImport() {
  if (!canImport.value) return
  try {
    await importRows(parseResult.value.validRows)
    step.value = 'done'
  } catch (e) {
    // errorMsg ref already set by useBankImport
  }
}

function reset() {
  step.value        = 'upload'
  parseResult.value = null
  parseError.value  = null
}

// ── Helpers ───────────────────────────────────────────────────────────────
function truncate(str, len = 30) {
  if (!str) return '—'
  return str.length > len ? str.slice(0, len) + '…' : str
}
</script>

<template>
  <div class="import-page">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.push({ name: 'Bank' })">← 題庫管理</button>
      <div>
        <h1 class="page-title">匯入題目</h1>
        <p class="page-subtitle">上傳 XLSX 模板，系統驗證後批次寫入題庫</p>
      </div>
    </div>

    <!-- Step indicator -->
    <div class="steps">
      <div class="step" :class="{ active: step === 'upload', done: step !== 'upload' }">
        <span class="step-num">1</span><span>上傳檔案</span>
      </div>
      <div class="step-sep">→</div>
      <div class="step" :class="{ active: step === 'preview', done: step === 'done' }">
        <span class="step-num">2</span><span>確認預覽</span>
      </div>
      <div class="step-sep">→</div>
      <div class="step" :class="{ active: step === 'done' }">
        <span class="step-num">3</span><span>匯入完成</span>
      </div>
    </div>

    <!-- ── Step 1: Upload ── -->
    <template v-if="step === 'upload'">
      <div
        class="drop-zone"
        :class="{ dragging }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="$refs.fileInput.click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          style="display:none"
          @change="onFileInput"
        />
        <div v-if="parsing" class="drop-content">
          <div class="spinner" />
          <p>解析中…</p>
        </div>
        <div v-else class="drop-content">
          <div class="drop-icon">📄</div>
          <p class="drop-title">拖曳 XLSX 到此處，或點擊選擇檔案</p>
          <p class="drop-hint">請使用官方模板：<code>IMPORT_TEMPLATE.xlsx</code></p>
        </div>
      </div>

      <div v-if="parseError" class="alert alert--error">
        ⚠️ {{ parseError }}
      </div>

      <div class="template-hint">
        <strong>還沒有模板？</strong>
        執行 <code>node scripts/generate-import-template.js</code> 產生，
        或參閱 <code>docs/intern-guide/XLSX_SCHEMA.md</code>。
      </div>
    </template>

    <!-- ── Step 2: Preview ── -->
    <template v-else-if="step === 'preview'">
      <div class="preview-summary">
        <div class="summary-stat">
          <span class="stat-num">{{ parseResult.total }}</span>
          <span class="stat-label">共讀取</span>
        </div>
        <div class="summary-stat stat--ok">
          <span class="stat-num">{{ parseResult.validRows.length }}</span>
          <span class="stat-label">可匯入</span>
        </div>
        <div class="summary-stat stat--err" v-if="parseResult.invalidRows.length > 0">
          <span class="stat-num">{{ parseResult.invalidRows.length }}</span>
          <span class="stat-label">有錯誤</span>
        </div>
      </div>

      <div v-if="parseResult.invalidRows.length > 0" class="alert alert--warn">
        ⚠️ {{ parseResult.invalidRows.length }} 列有錯誤，僅匯入無錯誤的列。
        請修正後重新上傳以補充匯入這些列。
      </div>

      <div v-if="errorMsg" class="alert alert--error">⚠️ {{ errorMsg }}</div>

      <!-- Table controls -->
      <div class="table-controls">
        <label class="toggle-label">
          <input type="checkbox" v-model="showInvalid" />
          顯示錯誤列
        </label>
        <span class="row-count">顯示 {{ displayRows.length }} 列</span>
      </div>

      <!-- Preview table -->
      <div class="table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th>#</th>
              <th v-for="col in PREVIEW_COLS" :key="col">{{ col }}</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in displayRows"
              :key="row._rowIndex"
              :class="{ 'row--error': !row._valid }"
            >
              <td class="td-row">{{ row._rowIndex }}</td>
              <td v-for="col in PREVIEW_COLS" :key="col" class="td-cell">
                {{ truncate(row[col]) }}
              </td>
              <td class="td-status">
                <template v-if="row._valid">
                  <span class="badge badge--ok">✓ OK</span>
                </template>
                <template v-else>
                  <span class="badge badge--err" :title="row._errors.join('\n')">
                    ✗ {{ row._errors.length }} 錯誤
                  </span>
                  <ul class="error-list">
                    <li v-for="(err, i) in row._errors" :key="i">{{ err }}</li>
                  </ul>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Actions -->
      <div class="action-bar">
        <button class="btn-secondary" @click="reset">重新上傳</button>
        <button
          class="btn-primary"
          :disabled="!canImport || importing"
          @click="confirmImport"
        >
          <span v-if="importing">
            匯入中… {{ progress }}%
          </span>
          <span v-else>
            確認匯入 {{ parseResult.validRows.length }} 題
          </span>
        </button>
      </div>

      <!-- Progress bar -->
      <div v-if="importing" class="progress-bar-wrap">
        <div class="progress-bar" :style="{ width: progress + '%' }" />
      </div>
    </template>

    <!-- ── Step 3: Done ── -->
    <template v-else-if="step === 'done'">
      <div class="done-card">
        <div class="done-icon">✅</div>
        <h2 class="done-title">匯入完成</h2>
        <div class="done-stats">
          <div class="done-stat">
            <span class="stat-num">{{ imported }}</span>
            <span class="stat-label">新增題目</span>
          </div>
          <div class="done-stat">
            <span class="stat-num">{{ skipped }}</span>
            <span class="stat-label">已跳過（重複）</span>
          </div>
        </div>
        <div class="done-actions">
          <button class="btn-secondary" @click="reset">繼續匯入</button>
          <button class="btn-primary" @click="router.push({ name: 'Bank' })">返回題庫</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.import-page {
  max-width: 900px;
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
}
.page-title    { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.8rem; color: #94a3b8; margin: 0; }

/* Step indicator */
.steps {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
  font-size: 0.8rem;
}
.step {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #94a3b8;
}
.step.active { color: #6366f1; font-weight: 600; }
.step.done   { color: #16a34a; }
.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}
.step.active .step-num { background: #6366f1; color: #fff; }
.step.done   .step-num { background: #16a34a; color: #fff; }
.step-sep { color: #cbd5e1; }

/* Drop zone */
.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}
.drop-zone:hover { border-color: #6366f1; background: #eef2ff; }
.drop-zone.dragging { border-color: #6366f1; background: #eef2ff; transform: scale(1.01); }

.drop-content { pointer-events: none; }
.drop-icon    { font-size: 2.5rem; margin-bottom: 0.75rem; }
.drop-title   { font-size: 1rem; font-weight: 500; color: #334155; margin: 0 0 0.5rem; }
.drop-hint    { font-size: 0.8rem; color: #94a3b8; margin: 0; }
.drop-hint code {
  background: #e2e8f0;
  padding: 0.1em 0.4em;
  border-radius: 4px;
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
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.alert--error { background: #fee2e2; color: #dc2626; }
.alert--warn  { background: #fef3c7; color: #92400e; }

/* Template hint */
.template-hint {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: #64748b;
}
.template-hint code {
  background: #e2e8f0;
  padding: 0.1em 0.4em;
  border-radius: 4px;
}

/* Preview summary */
.preview-summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  min-width: 80px;
}
.summary-stat.stat--ok  { background: #f0fdf4; border-color: #bbf7d0; }
.summary-stat.stat--err { background: #fef2f2; border-color: #fecaca; }
.stat-num   { font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1; }
.stat-label { font-size: 0.7rem; color: #64748b; margin-top: 4px; }
.summary-stat.stat--ok  .stat-num { color: #16a34a; }
.summary-stat.stat--err .stat-num { color: #dc2626; }

/* Table */
.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
}
.toggle-label { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
.row-count { color: #94a3b8; }

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 1.25rem;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.preview-table th {
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
}
.preview-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}
.preview-table tr:last-child td { border-bottom: none; }

.row--error { background: #fff7f7; }

.td-row   { color: #94a3b8; font-size: 0.7rem; white-space: nowrap; }
.td-cell  { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-status { white-space: nowrap; }

.badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.badge--ok  { background: #dcfce7; color: #16a34a; }
.badge--err { background: #fee2e2; color: #dc2626; cursor: help; }

.error-list {
  margin: 0.25rem 0 0;
  padding-left: 1rem;
  color: #dc2626;
  font-size: 0.7rem;
  line-height: 1.5;
}

/* Action bar */
.action-bar {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
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
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

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

/* Progress bar */
.progress-bar-wrap {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #6366f1;
  transition: width 0.3s;
}

/* Done card */
.done-card {
  text-align: center;
  padding: 3rem 1rem;
}
.done-icon  { font-size: 3rem; margin-bottom: 1rem; }
.done-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 1.5rem; }

.done-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}
.done-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.done-stat .stat-num   { font-size: 2rem; font-weight: 700; color: #6366f1; }
.done-stat .stat-label { font-size: 0.8rem; color: #64748b; }

.done-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}
</style>
