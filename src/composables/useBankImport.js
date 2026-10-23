/**
 * useBankImport — Task #26 / Task #29
 * Batch-write parsed XLSX rows to Supabase `questions` table.
 *
 * Dedup strategy: client-side pre-filter.
 * Before inserting, load existing keys from Supabase and filter them out.
 * This avoids relying on Supabase JS v2 `ignoreDuplicates` (v1-only API)
 * and works correctly with expression-based indexes that PostgREST can't
 * reference by name in ON CONFLICT clauses.
 *
 * Dedup key: cert_id | subject_id | source_type | topic_id | source_year | source_batch | question_no
 * (matches migration 005 COALESCE logic)
 *
 * Task #29 增強：權限設置
 * - Admin 匯入 → questions.access_level = 'public'
 * - 普通使用者匯入 → questions.access_level = 'private'
 * - 所有匯入的題目設置 owner_id = 當前使用者
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const BATCH_SIZE = 100

/** Build a dedup key matching migration 005's COALESCE expression index */
function makeKey(cert_id, subject_id, source_type, topic_id, source_year, source_batch, question_no) {
  const year  = source_year  != null ? String(source_year)  : '0'
  const batch = source_batch != null ? String(source_batch) : ''
  return `${cert_id}|${subject_id}|${source_type}|${topic_id}|${year}|${batch}|${question_no}`
}

/**
 * 標準化已解析的 XLSX 列到 Supabase questions schema
 * @param {Object} row — 從 useXLSXParser 得到的行
 * @param {String} userId — 當前使用者 ID
 * @param {Boolean} isAdmin — 是否為管理員
 */
function toDbRow(row, userId, isAdmin) {
  return {
    cert_id:      row.cert_id,
    subject_id:   row.subject_id,
    topic_id:     row.topic_id,
    topic_name:   row.topic_name     || null,
    source_type:  row.source_type,
    source_year:  row.source_year    ? parseInt(row.source_year, 10) : null,
    source_batch: row.source_batch   || null,
    question_no:  row.question_no,
    question:     row.question,
    option_a:     row.option_a,
    option_b:     row.option_b,
    option_c:     row.option_c,
    option_d:     row.option_d,
    answer:       row.answer,
    explanation:  row.explanation    || null,
    has_image:    row.has_image === 'TRUE',
    image_note:   row.image_note     || null,
    difficulty:   row.difficulty     || null,
    // ── 權限欄位 ──────────────────────────────────────────────
    access_level: isAdmin ? 'public' : 'private',  // Admin 匯入 = public，普通使用者 = private
    owner_id:     userId,                           // 設置匯入者為所有者
    enterprise_id: null,                            // MVP: 先不設置企業 ID
  }
}

export function useBankImport() {
  const importing = ref(false)
  const progress  = ref(0)    // 0–100
  const imported  = ref(0)
  const skipped   = ref(0)
  const errorMsg  = ref(null)

  /**
   * 匯入驗證過的列到 Supabase，跳過重複項目
   * @param {Array} validRows — 來自 useXLSXParser().parseFile()
   * @returns {Promise<{ imported: number, skipped: number }>}
   */
  async function importRows(validRows) {
    const auth = useAuthStore()

    importing.value = true
    progress.value  = 0
    imported.value  = 0
    skipped.value   = 0
    errorMsg.value  = null

    try {
      // ── Step 1: Load existing dedup keys ──────────────────────────────
      const { data: existing, error: fetchErr } = await supabase
        .from('questions')
        .select('cert_id, subject_id, source_type, topic_id, source_year, source_batch, question_no')

      if (fetchErr) throw fetchErr

      const existingKeys = new Set()
      for (const row of (existing ?? [])) {
        existingKeys.add(
          makeKey(row.cert_id, row.subject_id, row.source_type, row.topic_id, row.source_year, row.source_batch, row.question_no)
        )
      }

      // ── Step 2: Filter to only new rows ───────────────────────────────
      const newRows = []
      for (const row of validRows) {
        // Task #29: 傳遞 userId 和 isAdmin 來設置權限欄位
        const dbRow = toDbRow(row, auth.userId, auth.isAdmin)
        const key   = makeKey(
          dbRow.cert_id, dbRow.subject_id, dbRow.source_type, dbRow.topic_id,
          dbRow.source_year, dbRow.source_batch,
          dbRow.question_no,
        )

        if (existingKeys.has(key)) {
          skipped.value++
        } else {
          newRows.push(dbRow)
          existingKeys.add(key)  // prevent within-batch duplicates
        }
      }

      // ── Step 3: Batch insert new rows ─────────────────────────────────
      const total = newRows.length

      if (total === 0) {
        // All rows were duplicates — still a success
        return { imported: 0, skipped: skipped.value }
      }

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = newRows.slice(i, i + BATCH_SIZE)

        const { error } = await supabase
          .from('questions')
          .insert(batch)

        if (error) throw error

        imported.value += batch.length
        progress.value  = Math.round(((i + batch.length) / total) * 100)
      }

      return { imported: imported.value, skipped: skipped.value }

    } catch (e) {
      errorMsg.value = e.message ?? '匯入失敗，請稍後再試'
      throw e
    } finally {
      importing.value = false
      progress.value  = 100
    }
  }

  return { importRows, importing, progress, imported, skipped, errorMsg }
}
