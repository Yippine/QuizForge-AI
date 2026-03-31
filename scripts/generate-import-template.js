/**
 * generate-import-template.js
 * 生成 QuizForge-AI XLSX 匯入模板
 * Usage: node scripts/generate-import-template.js
 */
import XLSX from '@e965/xlsx'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.resolve(__dirname, '../docs/intern-guide/IMPORT_TEMPLATE.xlsx')

// ── Column definitions ─────────────────────────────────────────────────
const COLUMNS = [
  { field: 'cert_id',       zh: '認證代碼',   required: true,  width: 28,  hint: 'ipas-ai-planning / ipas-ai-planning-basic' },
  { field: 'subject_id',    zh: '科目代碼',   required: true,  width: 14,  hint: 'L11 / L12 / L21 / L22 / L23' },
  { field: 'topic_id',      zh: '主題代碼',   required: true,  width: 14,  hint: 'L21101 ~ L23402（見參照表）' },
  { field: 'topic_name',    zh: '主題名稱',   required: false, width: 22,  hint: '可留空，系統自動對應' },
  { field: 'source_type',   zh: '來源類型',   required: true,  width: 14,  hint: 'official / sample / ai' },
  { field: 'source_year',   zh: '年度（民國）',required: false, width: 14,  hint: '如 114（民國114年）' },
  { field: 'source_batch',  zh: '批次',       required: false, width: 14,  hint: '如 第二梯次、樣題' },
  { field: 'question_no',   zh: '題號',       required: true,  width: 10,  hint: '如 001、010（補齊三位）' },
  { field: 'question',      zh: '題目內容',   required: true,  width: 60,  hint: '換行改為空格，保持單行' },
  { field: 'option_a',      zh: '選項A',      required: true,  width: 35,  hint: '去除(A)前綴' },
  { field: 'option_b',      zh: '選項B',      required: true,  width: 35,  hint: '去除(B)前綴' },
  { field: 'option_c',      zh: '選項C',      required: true,  width: 35,  hint: '去除(C)前綴' },
  { field: 'option_d',      zh: '選項D',      required: true,  width: 35,  hint: '去除(D)前綴' },
  { field: 'answer',        zh: '正確答案',   required: true,  width: 10,  hint: 'A / B / C / D（大寫）' },
  { field: 'explanation',   zh: '解析',       required: false, width: 55,  hint: '樣題有詳細解析；歷屆可留空' },
  { field: 'has_image',     zh: '含圖片',     required: true,  width: 10,  hint: 'FALSE / TRUE（大寫）' },
  { field: 'image_note',    zh: '圖片說明',   required: false, width: 25,  hint: 'has_image=TRUE時填原PDF頁碼' },
  { field: 'difficulty',    zh: '難度',       required: false, width: 12,  hint: 'easy / medium / hard' },
]

// ── Example rows ──────────────────────────────────────────────────────
const EXAMPLES = [
  {
    cert_id: 'ipas-ai-planning',
    subject_id: 'L21',
    topic_id: 'L21101',
    topic_name: '自然語言處理技術與應用',
    source_type: 'official',
    source_year: 114,
    source_batch: '第二梯次',
    question_no: '001',
    question: '在自然語言處理(NLP)的發展歷程中，以下哪一個階段最早出現？',
    option_a: '基於深度學習的方法',
    option_b: '基於規則的方法',
    option_c: '基於統計的方法',
    option_d: '基於預訓練模型的方法',
    answer: 'B',
    explanation: 'NLP技術演進順序：規則→統計→深度學習→預訓練模型。規則方法最早出現於1950s-1980s。',
    has_image: 'FALSE',
    image_note: '',
    difficulty: 'medium',
  },
  {
    cert_id: 'ipas-ai-planning',
    subject_id: 'L23',
    topic_id: 'L23202',
    topic_name: '深度學習基礎與網路架構',
    source_type: 'sample',
    source_year: 114,
    source_batch: '樣題',
    question_no: '015',
    question: '如圖所示的神經網路架構，該網路包含幾個隱藏層？',
    option_a: '1層',
    option_b: '2層',
    option_c: '3層',
    option_d: '4層',
    answer: 'C',
    explanation: '從圖中可以觀察到，輸入層和輸出層之間共有3個隱藏層（Hidden Layer 1/2/3），因此答案為C。',
    has_image: 'TRUE',
    image_note: '請參照原PDF第12頁圖示',
    difficulty: 'easy',
  },
  {
    cert_id: 'ipas-ai-planning',
    subject_id: 'L23',
    topic_id: 'L23101',
    topic_name: '機率論與統計基礎',
    source_type: 'ai',
    source_year: '',
    source_batch: 'AI生成批次1',
    question_no: '001',
    question: '某資料集服從常態分佈，平均值為50，標準差為10。Z分數為2的數值為何？',
    option_a: '30',
    option_b: '50',
    option_c: '60',
    option_d: '70',
    answer: 'D',
    explanation: 'Z = (X - μ) / σ，移項得 X = μ + Z×σ = 50 + 2×10 = 70。',
    has_image: 'FALSE',
    image_note: '',
    difficulty: 'easy',
  },
]

// ── Reference data（依官方簡章 §2.5，114年版）────────────────────────────
const REFERENCE_DATA = [
  ['【認證代碼 cert_id】', '', ''],
  ['cert_id', '認證名稱', ''],
  ['ipas-ai-planning', 'iPAS AI 應用規劃師（中級 Lv2）', ''],
  ['ipas-ai-planning-basic', 'iPAS AI 應用規劃師（初級 Lv1）', ''],
  ['', '', ''],
  ['【來源類型 source_type】', '', ''],
  ['source_type', '說明', '對應 PDF 目錄'],
  ['official', '官方歷屆考題', '歷屆考題/'],
  ['sample', '官方樣題', '樣題/'],
  ['ai', 'AI 生成題目', '非官方'],
  ['', '', ''],
  ['【答案 answer】', '', ''],
  ['值', '說明', ''],
  ['A', '選項A正確', ''],
  ['B', '選項B正確', ''],
  ['C', '選項C正確', ''],
  ['D', '選項D正確', ''],
  ['', '', ''],
  ['【難度 difficulty（選填）】', '', ''],
  ['值', '說明', ''],
  ['easy', '易', ''],
  ['medium', '中', ''],
  ['hard', '難', ''],
  ['', '', ''],
  ['【含圖片 has_image】', '', ''],
  ['值', '說明', ''],
  ['FALSE', '題目不含圖片（預設）', ''],
  ['TRUE', '題目含圖片，需填 image_note', ''],
  ['', '', ''],
  // ── 初級 L11 ──
  ['【初級 L11 人工智慧基礎概論】', '', ''],
  ['topic_id', 'topic_name', 'subject_id'],
  ['L11101', 'AI的定義與分類', 'L11'],
  ['L11102', 'AI治理概念', 'L11'],
  ['L11201', '資料基本概念與來源', 'L11'],
  ['L11202', '資料整理與分析流程', 'L11'],
  ['L11203', '資料隱私與安全', 'L11'],
  ['L11301', '機器學習基本原理', 'L11'],
  ['L11302', '常見的機器學習模型', 'L11'],
  ['L11401', '鑑別式AI與生成式AI的基本原理', 'L11'],
  ['L11402', '鑑別式AI與生成式AI的整合應用', 'L11'],
  ['', '', ''],
  // ── 初級 L12 ──
  ['【初級 L12 生成式AI應用與規劃】', '', ''],
  ['topic_id', 'topic_name', 'subject_id'],
  ['L12101', 'No Code / Low Code 的基本概念', 'L12'],
  ['L12102', 'No Code / Low Code 的優勢與限制', 'L12'],
  ['L12201', '生成式AI應用領域與常見工具', 'L12'],
  ['L12202', '如何善用生成式AI工具', 'L12'],
  ['L12301', '生成式AI導入評估', 'L12'],
  ['L12302', '生成式AI導入規劃', 'L12'],
  ['L12303', '生成式AI風險管理', 'L12'],
  ['', '', ''],
  // ── 中級 L21 ──
  ['【中級 L21 人工智慧技術應用與規劃】', '', ''],
  ['topic_id', 'topic_name', 'subject_id'],
  ['L21101', '自然語言處理技術與應用', 'L21'],
  ['L21102', '電腦視覺技術與應用', 'L21'],
  ['L21103', '生成式AI技術與應用', 'L21'],
  ['L21104', '多模態人工智慧應用', 'L21'],
  ['L21201', 'AI導入評估', 'L21'],
  ['L21202', 'AI導入規劃', 'L21'],
  ['L21203', 'AI風險管理', 'L21'],
  ['L21301', '數據準備與模型選擇', 'L21'],
  ['L21302', 'AI技術系統集成與部署', 'L21'],
  ['', '', ''],
  // ── 中級 L22 ──
  ['【中級 L22 大數據處理分析與應用】', '', ''],
  ['topic_id', 'topic_name', 'subject_id'],
  ['L22101', '敘述性統計與資料摘要技術', 'L22'],
  ['L22102', '機率分佈與資料分佈模型', 'L22'],
  ['L22103', '假設檢定與統計推論', 'L22'],
  ['L22201', '數據收集與清理', 'L22'],
  ['L22202', '數據儲存與管理', 'L22'],
  ['L22203', '數據處理技術與工具', 'L22'],
  ['L22301', '統計學在大數據中的應用', 'L22'],
  ['L22302', '常見的大數據分析方法', 'L22'],
  ['L22303', '數據可視化工具', 'L22'],
  ['L22401', '大數據與機器學習', 'L22'],
  ['L22402', '大數據在鑑別式AI中的應用', 'L22'],
  ['L22403', '大數據在生成式AI中的應用', 'L22'],
  ['L22404', '大數據隱私保護、安全與合規', 'L22'],
  ['', '', ''],
  // ── 中級 L23 ──
  ['【中級 L23 機器學習技術與應用】', '', ''],
  ['topic_id', 'topic_name', 'subject_id'],
  ['L23101', '機率/統計之機器學習基礎應用', 'L23'],
  ['L23102', '線性代數之機器學習基礎應用', 'L23'],
  ['L23103', '數值優化技術與方法', 'L23'],
  ['L23201', '機器學習原理與技術', 'L23'],
  ['L23202', '常見機器學習演算法', 'L23'],
  ['L23203', '深度學習原理與框架', 'L23'],
  ['L23301', '數據準備與特徵工程', 'L23'],
  ['L23302', '模型選擇與架構設計', 'L23'],
  ['L23303', '模型訓練、評估與驗證', 'L23'],
  ['L23304', '模型調整與優化', 'L23'],
  ['L23401', '數據隱私、安全與合規', 'L23'],
  ['L23402', '演算法偏見與公平性', 'L23'],
]

// ── Build workbook ─────────────────────────────────────────────────────
function buildWorkbook() {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: 匯入資料 ────────────────────────────────────────────────
  const fieldNames = COLUMNS.map(c => c.field)
  const zhNames    = COLUMNS.map(c => `${c.required ? '★ ' : ''}${c.zh}`)
  const hints      = COLUMNS.map(c => c.hint)

  const rows = [
    fieldNames,  // Row 1: English field names (system parses this row)
    zhNames,     // Row 2: Chinese names with ★ = required
    hints,       // Row 3: Valid values / hints
    // Example rows
    ...EXAMPLES.map(ex => fieldNames.map(f => ex[f] ?? '')),
    // Blank data rows
    ...Array(50).fill(fieldNames.map(() => '')),
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws1['!cols'] = COLUMNS.map(c => ({ wch: c.width }))

  // Freeze row 1 (field names row)
  ws1['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(wb, ws1, '匯入資料')

  // ── Sheet 2: 參照表 ───────────────────────────────────────────────────
  const ws2 = XLSX.utils.aoa_to_sheet(REFERENCE_DATA)
  ws2['!cols'] = [{ wch: 35 }, { wch: 35 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws2, '參照表')

  return wb
}

// ── Main ────────────────────────────────────────────────────────────────
const wb = buildWorkbook()

// Ensure output directory exists
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })

XLSX.writeFile(wb, OUTPUT_PATH)
console.log(`✅ XLSX template generated: ${OUTPUT_PATH}`)
console.log(`   Sheet 1: 匯入資料 (${COLUMNS.length} columns, ${EXAMPLES.length} examples + 50 blank rows)`)
console.log(`   Sheet 2: 參照表 (${REFERENCE_DATA.length} rows)`)
