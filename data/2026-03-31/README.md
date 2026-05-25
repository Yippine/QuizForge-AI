# 題目資源庫 - 2026-03-31

## 概述

本目錄存放經過驗證的題目資源，包含官方題庫和使用者上傳的題目檔案。
**所有 XLSX 檔案均符合 `docs/intern-guide/IMPORT_TEMPLATE.xlsx` 的格式規範。**

## 現有檔案

### 官方題庫（直接版本控制追蹤）

| 時間戳 | 題目來源 | 題數 | 檔案名 | 狀態 |
|--------|--------|------|--------|------|
| 20260331_120000 | L21 科目1 官方題庫 | 45 | `20260331_120000-L21-人工智慧技術應用規劃_official.xlsx` | ✅ |
| 20260331_120500 | L21 科目1 模擬考試 | 120 | `20260331_120500-L21-人工智慧技術應用規劃_mock-exam.xlsx` | ✅ |
| 20260331_121000 | L23 科目2 官方題庫 | 55 | `20260331_121000-L23-機器學習技術與應用_official.xlsx` | ✅ |
| 20260331_121500 | L23 科目2 模擬考試 | 134 | `20260331_121500-L23-機器學習技術與應用_mock-exam.xlsx` | ✅ |

**總計：** 354 題

### 格式規範

所有檔案遵循 IMPORT_TEMPLATE.xlsx 的 18 欄位標準：

| 欄位名稱 | 必填 | 說明 | 範例 |
|--------|------|------|------|
| cert_id | ★ | 認證代碼 | `ipas-ai-planning` |
| subject_id | ★ | 科目代碼 | L21、L23 |
| topic_id | ★ | 主題代碼 | L21201、L21202 |
| topic_name | - | 主題名稱 | （系統自動對應） |
| source_type | ★ | 來源類型 | official / sample / ai |
| source_year | - | 年度（民國） | 114、115 等 |
| source_batch | - | 批次 | 第一梯次、樣題 |
| question_no | ★ | 題號 | 001、002 等 |
| question | ★ | 題目內容 | （單行文本） |
| option_a ~ d | ★ | 選項 A~D | （去除前綴） |
| answer | ★ | 正確答案 | A / B / C / D |
| explanation | - | 解析說明 | （詳細說明） |
| has_image | ★ | 是否含圖片 | TRUE / FALSE |
| image_note | - | 圖片說明 | （PDF 頁碼） |
| difficulty | - | 難度等級 | easy / medium / hard |

### 來源資訊

- **Origin:** `origin/archive/v1-resource-center` 分支
- **轉換自：** JSON 格式，位於 `knowledge-base/ipas/ai-planning/intermediate/`
- **轉換時間：** 2026-03-31
- **轉換工具：** Python openpyxl + 自訂轉換指令碼
- **轉換映射：**
  - `difficulty` 對應：simple → easy, medium → medium, hard → hard
  - `question_no` 自動從 question_id 提取
  - `topic_id` 自動從 topic 字段提取
  - `source_type` 自動判定為 official

## 檔案命名規則

### 官方題庫
```
{YYYYMMDD}_{HHMMSS}-L{科目代碼}-{科目名稱}_{題型類別}.xlsx
```

- **YYYYMMDD_HHMMSS**: 匯入時間戳
- **L{科目代碼}**: L21（AI規劃）、L23（機器學習）等
- **題型類別**: `official` / `mock-exam`

### 使用者上傳
```
{YYYYMMDD}_{HHMMSS}-{username}-{原始檔案名}.xlsx
```

- 例：`20260401_150000-intern-quiz-v2.xlsx`
- 此類檔案會被自動忽略（`.gitignore` 規則）

## Git 版本控制規則

- ✅ **已追蹤**：科目代碼檔案（L21、L23 等）
- ❌ **已忽略**：使用者上傳檔案（含 username）

規則位於 `.gitignore`:
```
data/**/[0-9]*.xlsx          # 忽略所有数字開頭的 XLSX
!data/**/*-L[0-9][0-9]-*.xlsx # 但保留含 L21、L23 等的官方題庫
```

## 導入使用

### 步驟 1：選擇題庫
在應用中選擇相應的 XLSX 檔案：
- **官方題庫**（讀取專用）：選擇 `L21_official.xlsx` 或 `L23_official.xlsx`
- **模擬考試**（練習用）：選擇 `L21_mock-exam.xlsx` 或 `L23_mock-exam.xlsx`
- **用戶上傳**（自訂題庫）：上傳時確保格式符合模板

### 步驟 2：驗證格式
導入前，應用會自動驗證：
- ✓ 所有必填欄位有值（cert_id、subject_id、topic_id 等）
- ✓ 答案欄位為有效值（A/B/C/D）
- ✓ 難度欄位為有效值（easy/medium/hard）
- ✓ 題號為 3 位數字（001-999）

### 步驟 3：導入
確認驗證無誤後，點擊「導入」。系統會：
1. 建立或更新題目記錄
2. 關聯到對應的科目和主題
3. 記錄導入時間和來源

## 維護說明

### 新增官方題庫步驟
1. 從來源系統/分支匯出 JSON
2. 使用轉換指令碼轉為 XLSX（見下方技術細節）
3. 按命名規則存放在日期目錄下
4. 自動納入版本控制 ✅

### 轉換指令碼使用
```bash
python3 convert_json_to_template.py <input.json> <output.xlsx>
```

指令碼會自動：
- 映射 JSON 欄位到模板格式
- 驗證資料完整性
- 設定適當的欄位格式和寬度

### 清理舊備份
建議按季度清理舊備份，保留最新 2-3 個版本：
- Q1 (2026-03-31) - 保留
- Q2 (2026-06-30) - 保留
- Q3 (2026-09-30) - 保留
- Q4 (2026-12-31) - 清理舊版本

---

**最後更新**：2026-03-31  
**格式版本**：1.0 (符合 IMPORT_TEMPLATE.xlsx)
