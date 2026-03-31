/**
 * useXLSXParser — Task #25
 * Parse intern-uploaded XLSX files, validate 18 columns, collect error rows.
 *
 * Template structure (from generate-import-template.js):
 *   Row 1: English field names  ← header row the system parses
 *   Row 2: Chinese names (★ = required)
 *   Row 3: Valid value hints
 *   Rows 4+: Data (example rows + blank rows)
 */

import * as XLSX from '@e965/xlsx'

// ── Schema ────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  'cert_id', 'subject_id', 'topic_id', 'source_type',
  'question_no', 'question',
  'option_a', 'option_b', 'option_c', 'option_d',
  'answer', 'has_image',
]

const ALL_FIELDS = [
  'cert_id', 'subject_id', 'topic_id', 'topic_name',
  'source_type', 'source_year', 'source_batch',
  'question_no', 'question',
  'option_a', 'option_b', 'option_c', 'option_d', 'answer',
  'explanation', 'has_image', 'image_note', 'difficulty',
]

const ENUM = {
  cert_id:      ['ipas-ai-planning', 'ipas-ai-planning-basic'],
  subject_id:   ['L11', 'L12', 'L21', 'L22', 'L23'],
  source_type:  ['official', 'sample', 'ai'],
  answer:       ['A', 'B', 'C', 'D'],
  has_image:    ['FALSE', 'TRUE'],
  difficulty:   ['easy', 'medium', 'hard', ''],  // '' = blank is OK
}

// ── Validation ────────────────────────────────────────────────────────────

function validateRow(row, rowIndex) {
  const errors = []

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    const val = String(row[field] ?? '').trim()
    if (!val) {
      errors.push(`${field} 不可為空`)
    }
  }

  // Enum checks (only when value is present)
  for (const [field, allowed] of Object.entries(ENUM)) {
    const val = String(row[field] ?? '').trim()
    if (val && !allowed.includes(val)) {
      const allowedStr = allowed.filter(Boolean).join(' / ')
      errors.push(`${field} 必須為：${allowedStr}（目前：${val}）`)
    }
  }

  // image_note required when has_image = TRUE
  const hasImage = String(row.has_image ?? '').trim()
  const imageNote = String(row.image_note ?? '').trim()
  if (hasImage === 'TRUE' && !imageNote) {
    errors.push('has_image=TRUE 時 image_note 必填')
  }

  // topic_id prefix matches subject_id
  const topicId   = String(row.topic_id ?? '').trim()
  const subjectId = String(row.subject_id ?? '').trim()
  if (topicId && subjectId && !topicId.startsWith(subjectId)) {
    errors.push(`topic_id (${topicId}) 與 subject_id (${subjectId}) 不符`)
  }

  // source_year must be a number if provided
  const sourceYear = String(row.source_year ?? '').trim()
  if (sourceYear && !/^\d+$/.test(sourceYear)) {
    errors.push(`source_year 應為民國年整數（如 114），目前：${sourceYear}`)
  }

  return errors
}

// ── Parser ────────────────────────────────────────────────────────────────

/**
 * Parse an XLSX File / Blob.
 * Returns a Promise that resolves with:
 *   {
 *     total:       number,      // data rows found (excluding template header rows)
 *     validRows:   Row[],       // rows without validation errors
 *     invalidRows: Row[],       // rows with errors (include .errors and .rowIndex)
 *     allRows:     Row[],       // all non-blank rows (sorted: valid first)
 *   }
 */
export function useXLSXParser() {
  /**
   * @param {File} file
   * @returns {Promise<ParseResult>}
   */
  async function parseFile(file) {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })

    // Use first sheet
    const sheetName = wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]

    // Convert to array-of-arrays to handle the multi-header template structure
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    if (aoa.length < 1) {
      return { total: 0, validRows: [], invalidRows: [], allRows: [] }
    }

    // Locate the header row: it's the row where cell[0] === 'cert_id'
    let headerRowIdx = -1
    for (let i = 0; i < Math.min(aoa.length, 10); i++) {
      if (String(aoa[i][0]).trim() === 'cert_id') {
        headerRowIdx = i
        break
      }
    }

    if (headerRowIdx === -1) {
      throw new Error('找不到欄位標題列（第一欄應為 cert_id）。請確認使用正確的 IMPORT_TEMPLATE.xlsx 模板。')
    }

    const headers = aoa[headerRowIdx].map(h => String(h).trim())

    // Validate that all 18 fields are present
    const missingFields = ALL_FIELDS.filter(f => !headers.includes(f))
    if (missingFields.length > 0) {
      throw new Error(`缺少必要欄位：${missingFields.join(', ')}`)
    }

    // Data rows start after the header row
    // Skip any immediately following hint rows (rows 2 and 3 in template)
    // We detect hint rows by checking if row[0] (cert_id column) contains non-data values
    const dataStartIdx = headerRowIdx + 1

    const validRows   = []
    const invalidRows = []

    for (let i = dataStartIdx; i < aoa.length; i++) {
      const rawRow = aoa[i]

      // Build object from headers
      const rowObj = {}
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j]
        if (ALL_FIELDS.includes(key)) {
          rowObj[key] = String(rawRow[j] ?? '').trim()
        }
      }

      // Skip blank rows (all required fields empty)
      const hasContent = REQUIRED_FIELDS.some(f => rowObj[f])
      if (!hasContent) continue

      // Skip template hint rows. The template has two hint rows after the header:
      //   Row 2: Chinese labels  → cert_id = "★ 認證代碼"    (has Chinese / ★)
      //   Row 3: valid-value hints → cert_id = "ipas-ai-planning / ipas-ai-planning-basic" (has " / ")
      // Detection: cert_id contains Chinese, ★, or " / " (space-slash-space = multi-value hint)
      const certVal = rowObj.cert_id ?? ''
      if (/[★\u4e00-\u9fff]/.test(certVal) || certVal.includes(' / ')) continue

      // Validate
      const errors = validateRow(rowObj, i + 1)

      const enriched = {
        ...rowObj,
        _rowIndex: i + 1,   // 1-based Excel row number
        _errors: errors,
        _valid: errors.length === 0,
      }

      if (errors.length === 0) {
        validRows.push(enriched)
      } else {
        invalidRows.push(enriched)
      }
    }

    return {
      total:       validRows.length + invalidRows.length,
      validRows,
      invalidRows,
      allRows:     [...validRows, ...invalidRows].sort((a, b) => a._rowIndex - b._rowIndex),
    }
  }

  return { parseFile, ALL_FIELDS, REQUIRED_FIELDS }
}
