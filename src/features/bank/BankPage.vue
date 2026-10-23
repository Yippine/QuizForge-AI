<script setup>
// Task #23 — 題庫管理主頁
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCertifications } from '@/composables/useCertifications'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const { getCertifications } = useCertifications()

const certs   = getCertifications()
const loading = ref(true)

// subjectId → question count
const questionCounts = ref({})

onMounted(async () => {
  try {
    const { data } = await supabase
      .from('questions')
      .select('subject_id')

    if (data) {
      for (const row of data) {
        const sid = row.subject_id
        questionCounts.value[sid] = (questionCounts.value[sid] ?? 0) + 1
      }
    }
  } catch (e) {
    console.warn('[BankPage] fetch failed:', e.message)
  }
  loading.value = false
})

function certTotal(cert) {
  return cert.subjects.reduce((sum, s) => sum + (questionCounts.value[s.id] ?? 0), 0)
}
</script>

<template>
  <div class="bank-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">題庫管理</h1>
        <p class="page-subtitle">管理認證考試題目，僅管理員可操作</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="router.push({ name: 'CertConfigEditor' })">
          ⚙️ 編輯結構
        </button>
        <button class="btn-secondary" @click="router.push({ name: 'BankEditor' })">
          ✎ 編輯題目
        </button>
        <button class="btn-import" @click="router.push({ name: 'BankImport' })">
          ＋ 匯入 XLSX
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">載入統計中...</div>

    <template v-else>
      <div v-for="cert in certs" :key="cert.id" class="cert-card">
        <div class="cert-header">
          <span class="cert-icon">{{ cert.icon }}</span>
          <div class="cert-info">
            <div class="cert-name">{{ cert.name }}</div>
            <div class="cert-id">{{ cert.id }}</div>
          </div>
          <div class="cert-total">
            {{ certTotal(cert).toLocaleString() }} 題
          </div>
        </div>

        <div class="subject-list">
          <div
            v-for="subject in cert.subjects"
            :key="subject.id"
            class="subject-row"
          >
            <div class="subject-left">
              <span class="subject-icon">{{ subject.icon }}</span>
              <div>
                <div class="subject-name">{{ subject.name }}</div>
                <div class="subject-id">{{ subject.id }}</div>
              </div>
            </div>
            <div class="subject-right">
              <span class="subject-count">
                {{ (questionCounts[subject.id] ?? 0).toLocaleString() }} 題
              </span>
              <button
                class="btn-sm"
                @click="router.push({ name: 'BankImport', query: { subjectId: subject.id } })"
              >
                匯入
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-hint">
        <p>沒有題目？請使用 AI 提取工具從 PDF 提取題目後填入 XLSX 模板，再點擊「匯入 XLSX」。</p>
        <p>
          參閱：
          <code>docs/intern-guide/XLSX_SCHEMA.md</code>、
          <code>docs/intern-guide/AI_PROMPT_歷屆考題.md</code>
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.bank-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

.btn-secondary {
  padding: 0.55rem 1.1rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  min-height: 40px;
  flex-shrink: 0;
  transition: background 0.15s;
}
.btn-secondary:hover { background: #e2e8f0; }

.btn-import {
  padding: 0.55rem 1.1rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  min-height: 40px;
  flex-shrink: 0;
  transition: background 0.15s;
}
.btn-import:hover { background: #4f46e5; }

.loading { text-align: center; color: #94a3b8; padding: 3rem; }

/* Cert card */
.cert-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.cert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.cert-icon { font-size: 1.4rem; }

.cert-info { flex: 1; min-width: 0; }
.cert-name { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
.cert-id   { font-size: 0.7rem; color: #94a3b8; font-family: monospace; }

.cert-total {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6366f1;
  white-space: nowrap;
}

/* Subject rows */
.subject-list { padding: 0.5rem 0; }

.subject-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s;
}
.subject-row:last-child { border-bottom: none; }
.subject-row:hover { background: #fafbff; }

.subject-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
}

.subject-icon { font-size: 1.1rem; flex-shrink: 0; }
.subject-name { font-size: 0.875rem; font-weight: 500; color: #334155; }
.subject-id   { font-size: 0.7rem; color: #94a3b8; font-family: monospace; }

.subject-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.subject-count {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  min-width: 3.5rem;
  text-align: right;
}

.btn-sm {
  padding: 0.3rem 0.75rem;
  background: #eef2ff;
  color: #6366f1;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  transition: background 0.15s;
  min-height: 32px;
}
.btn-sm:hover { background: #e0e7ff; }

/* Hint */
.empty-hint {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-top: 1rem;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.6;
}
.empty-hint p { margin: 0.25rem 0; }
.empty-hint code {
  background: #e2e8f0;
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-size: 0.75rem;
}
</style>
