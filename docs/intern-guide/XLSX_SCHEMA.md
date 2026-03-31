# QuizForge-AI · XLSX 匯入規格（正式版）

> **實習生請讀這份文件。** 本文件定義了所有題目匯入的欄位標準、有效值與範例。

---

## 工作流程

```
PDF（歷屆考題 / 樣題）
  ↓ 使用 AI 提取工具（參見 AI_PROMPT_*.md）
XLSX（填寫本模板）
  ↓ 上傳至 QuizForge 題庫管理頁面
系統驗證預覽（錯誤行標紅）
  ↓ 確認無誤後點擊「確認匯入」
Supabase 題庫（自動寫入）
```

**你只需要操作 XLSX 那一步。** Supabase 是後端資料庫，你不需要碰它。

---

## 欄位定義（共 18 欄）

| # | 欄位名稱 | 中文說明 | 必填 | 有效值 / 格式 |
|---|---------|---------|------|--------------|
| 1 | `cert_id` | 認證代碼 | ✅ | 見下方「有效值表」 |
| 2 | `subject_id` | 科目代碼 | ✅ | L11 / L12 / L21 / L22 / L23 |
| 3 | `topic_id` | 主題代碼 | ✅ | 見下方「主題代碼表」 |
| 4 | `topic_name` | 主題名稱 | ⬜ | 可留空，系統自動對應；填寫可供自行核對 |
| 5 | `source_type` | 來源類型 | ✅ | `official` / `sample` / `ai` |
| 6 | `source_year` | 年度（民國年） | ⬜ | 整數，如 `114`；不確定可留空 |
| 7 | `source_batch` | 批次 | ⬜ | 如 `第一梯次`、`樣題`；自由填寫 |
| 8 | `question_no` | 題號 | ✅ | 字串，如 `001`、`1`；同批次不可重複 |
| 9 | `question` | 題目內容 | ✅ | 純文字；換行用空格取代 |
| 10 | `option_a` | 選項 A | ✅ | 純文字 |
| 11 | `option_b` | 選項 B | ✅ | 純文字 |
| 12 | `option_c` | 選項 C | ✅ | 純文字 |
| 13 | `option_d` | 選項 D | ✅ | 純文字 |
| 14 | `answer` | 正確答案 | ✅ | `A` / `B` / `C` / `D`（大寫） |
| 15 | `explanation` | 解析 | ⬜ | 建議填寫；可從 PDF 講義或 AI 生成 |
| 16 | `has_image` | 是否含圖片 | ✅ | `FALSE` / `TRUE`（大寫） |
| 17 | `image_note` | 圖片說明 | 視情況 | has_image=TRUE 時必填；說明圖片位於原 PDF 第幾頁 |
| 18 | `difficulty` | 難度 | ⬜ | `easy` / `medium` / `hard`；不確定可留空 |

---

## 有效值表

### cert_id（認證代碼）

| cert_id | 對應認證 |
|---------|---------|
| `ipas-ai-planning` | iPAS AI 規劃師（中級） |
| `ipas-ai-planning-basic` | iPAS AI 規劃師（初級） |

### source_type（來源類型）

| 值 | 說明 | 對應 PDF 類型 |
|----|------|--------------|
| `official` | 官方歷屆考題 | 歷屆考題目錄下的 PDF |
| `sample` | 官方樣題 | 樣題目錄下的 PDF |
| `ai` | AI 生成題目 | 人工智慧輔助生成，非官方 |

### subject_id + topic_id（科目與主題代碼）

> 依據：114年度AI應用規劃師能力鑑定簡章 §2.5

#### 初級 (ipas-ai-planning-basic)

| subject_id | topic_id | topic_name |
|-----------|---------|-----------|
| L11 | L11101 | AI的定義與分類 |
| L11 | L11102 | AI治理概念 |
| L11 | L11201 | 資料基本概念與來源 |
| L11 | L11202 | 資料整理與分析流程 |
| L11 | L11203 | 資料隱私與安全 |
| L11 | L11301 | 機器學習基本原理 |
| L11 | L11302 | 常見的機器學習模型 |
| L11 | L11401 | 鑑別式AI與生成式AI的基本原理 |
| L11 | L11402 | 鑑別式AI與生成式AI的整合應用 |
| L12 | L12101 | No Code / Low Code 的基本概念 |
| L12 | L12102 | No Code / Low Code 的優勢與限制 |
| L12 | L12201 | 生成式AI應用領域與常見工具 |
| L12 | L12202 | 如何善用生成式AI工具 |
| L12 | L12301 | 生成式AI導入評估 |
| L12 | L12302 | 生成式AI導入規劃 |
| L12 | L12303 | 生成式AI風險管理 |

#### 中級 (ipas-ai-planning)

| subject_id | topic_id | topic_name |
|-----------|---------|-----------|
| L21 | L21101 | 自然語言處理技術與應用 |
| L21 | L21102 | 電腦視覺技術與應用 |
| L21 | L21103 | 生成式AI技術與應用 |
| L21 | L21104 | 多模態人工智慧應用 |
| L21 | L21201 | AI導入評估 |
| L21 | L21202 | AI導入規劃 |
| L21 | L21203 | AI風險管理 |
| L21 | L21301 | 數據準備與模型選擇 |
| L21 | L21302 | AI技術系統集成與部署 |
| L22 | L22101 | 敘述性統計與資料摘要技術 |
| L22 | L22102 | 機率分佈與資料分佈模型 |
| L22 | L22103 | 假設檢定與統計推論 |
| L22 | L22201 | 數據收集與清理 |
| L22 | L22202 | 數據儲存與管理 |
| L22 | L22203 | 數據處理技術與工具 |
| L22 | L22301 | 統計學在大數據中的應用 |
| L22 | L22302 | 常見的大數據分析方法 |
| L22 | L22303 | 數據可視化工具 |
| L22 | L22401 | 大數據與機器學習 |
| L22 | L22402 | 大數據在鑑別式AI中的應用 |
| L22 | L22403 | 大數據在生成式AI中的應用 |
| L22 | L22404 | 大數據隱私保護、安全與合規 |
| L23 | L23101 | 機率/統計之機器學習基礎應用 |
| L23 | L23102 | 線性代數之機器學習基礎應用 |
| L23 | L23103 | 數值優化技術與方法 |
| L23 | L23201 | 機器學習原理與技術 |
| L23 | L23202 | 常見機器學習演算法 |
| L23 | L23203 | 深度學習原理與框架 |
| L23 | L23301 | 數據準備與特徵工程 |
| L23 | L23302 | 模型選擇與架構設計 |
| L23 | L23303 | 模型訓練、評估與驗證 |
| L23 | L23304 | 模型調整與優化 |
| L23 | L23401 | 數據隱私、安全與合規 |
| L23 | L23402 | 演算法偏見與公平性 |

---

## 範例資料（3 筆）

### 範例一：歷屆考題（無圖片）

```
cert_id:      ipas-ai-planning
subject_id:   L21
topic_id:     L21101
topic_name:   自然語言處理技術與應用
source_type:  official
source_year:  114
source_batch: 第二梯次
question_no:  001
question:     在自然語言處理(NLP)的發展歷程中，以下哪一個階段最早出現？
option_a:     基於深度學習的方法
option_b:     基於規則的方法
option_c:     基於統計的方法
option_d:     基於預訓練模型的方法
answer:       B
explanation:  NLP技術演進順序：規則→統計→深度學習→預訓練模型。基於規則的方法(1950s-1980s)是最早期的NLP技術。
has_image:    FALSE
image_note:   （留空）
difficulty:   medium
```

### 範例二：樣題（含圖片）

```
cert_id:      ipas-ai-planning
subject_id:   L23
topic_id:     L23202
topic_name:   深度學習基礎與網路架構
source_type:  sample
source_year:  114
source_batch: 樣題
question_no:  015
question:     如圖所示的神經網路架構，該網路包含幾個隱藏層？
option_a:     1層
option_b:     2層
option_c:     3層
option_d:     4層
answer:       C
explanation:  （可留空，或填入解析說明）
has_image:    TRUE
image_note:   請參照原PDF第12頁圖示
difficulty:   easy
```

### 範例三：AI生成題目

```
cert_id:      ipas-ai-planning
subject_id:   L23
topic_id:     L23101
topic_name:   機率論與統計基礎
source_type:  ai
source_year:  （留空）
source_batch: AI生成批次1
question_no:  001
question:     某資料集服從常態分佈，平均值為50，標準差為10。Z分數為2的數值為何？
option_a:     30
option_b:     50
option_c:     60
option_d:     70
answer:       D
explanation:  Z = (X - μ) / σ → X = μ + Z×σ = 50 + 2×10 = 70。
has_image:    FALSE
image_note:   （留空）
difficulty:   easy
```

---

## 常見錯誤

| 錯誤 | 正確做法 |
|------|---------|
| answer 填 `b` 或 `(B)` | 只能填 `A` `B` `C` `D` 大寫單字元 |
| has_image 填 `True` 或 `是` | 只能填 `FALSE` 或 `TRUE`（全大寫）|
| difficulty 填 `簡單` | 只能填 `easy` `medium` `hard` |
| source_type 填 `歷屆` | 只能填 `official` `sample` `ai` |
| 同一批次重複的 question_no | 同 cert/subject/year/batch 內 question_no 不可重複 |
| question 欄位含換行符 | 換行改用空格，保持單行 |

---

## 匯入前注意事項

1. 第一列必須是欄位名稱（英文，不可更改）
2. 可一次匯入多個科目的題目（cert_id + subject_id 決定歸屬）
3. 重複匯入同一題目（相同 cert/subject/year/batch/question_no）系統會自動略過，不會重複
4. 系統會在預覽頁面標記錯誤行，**確認前不會寫入資料庫**
