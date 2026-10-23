---
name: "lebmatter/exampro"
slug: "exampro"
description: "MIT 授權 Frappe 監考考試平台，含視訊監考/排行榜/圖片題型；比初始研究有更多已實作功能"
url: "https://github.com/lebmatter/exampro"
stars: 56
license: "MIT"
language: ["Python", "JavaScript", "HTML"]
tags: ["frappe", "exam", "proctoring", "quiz", "lms", "mit"]
checked_at: "2026-05-25"
latest_version: ""
latest_released_at: ""
tracked_version: "HEAD (--depth=1)"
version_lag: null
default_branch: "main"
branches: ["main"]
references: []
related: ["lms"]
---

# lebmatter/exampro

$$\text{Repo} = \text{ProctorExam}(\text{視訊監考}) + \text{Leaderboard}(\text{✅ 已實作}) + \text{MIT}(\text{商用友善}) + \text{Frappe Traditional Pages}(\text{非 SPA})$$

> ⚠️ **修正初始研究**：原盤點報告標記排行榜為❌缺失，實際代碼中 Leaderboard 已完整實作（Exam Level / Schedule Level），需更新覆蓋率評估。

## 3W 定位

$$\text{3W} = \begin{cases}
What & \text{Frappe Framework 上的監考考試平台（Proctored Exam）} \\
Why & \text{需要視訊監考、違規自動終止、圖片題型的正式考試場景} \\
How & \text{Python DocType 後端 + Frappe 傳統 Web Pages（非 Vue SPA）+ WebRTC 視訊}
\end{cases}$$

**App 元數據（hooks.py）：**
- `app_name = "exampro"`
- `required_apps = []`（**獨立安裝，不依賴 frappe/lms**）
- `website_user_home_page = "/my-exams"`
- `after_install = create_sample_exams`（安裝後自動建立示範資料）
- License: **MIT**（商用免責任，可任意修改、部署、商業化）

---

## 場景與市場

$$\text{Market} = \text{正式考試機構} + \text{企業資格認證} + \text{技術測驗平台}$$

| 場景 | 適配度 | 說明 |
|------|:------:|------|
| 視訊監考正式考試 | ⭐⭐⭐⭐⭐ | 核心設計場景 |
| 排行榜競賽 | ⭐⭐⭐⭐ | ✅ 已實作（Exam/Schedule Level） |
| 圖片題型 | ⭐⭐⭐⭐⭐ | 題目圖片 + 4 選項各自圖片 |
| 批次考生管理 | ⭐⭐⭐⭐ | Exam Batch + bulk_add_submissions |
| 幫助提示系統 | ⭐⭐⭐⭐ | before/after answer hint + help quiz |
| 刷題/練習模式 | ⭐ | **不支援（正式考試導向）** |
| 題庫批量匯入 XLSX | ⭐ | **allow_import=0，僅 bulk email 匯入** |

---

## 技術棧

$$\text{TechStack} = \text{Python 40\%} + \text{JS 38\%} + \text{Frappe Traditional Pages（非 SPA）}$$

| 層 | 技術 | 說明 |
|----|-----|------|
| 後端框架 | Frappe Framework（v15/v16 相容）| DocType ORM + Whitelist API |
| 前端渲染 | Frappe Web Pages（Jinja + vanilla JS）| 非 Vue SPA，傳統模板渲染 |
| 視訊監考 | WebRTC + Canvas API | 候選人視訊 + 面部偵測 |
| 快取 | frappe.cache()（Redis）| 考試進行中題目快取 |
| 依賴 | 無外部 Python 依賴 | 輕量，僅 Frappe Core |

---

## 架構分析

$$\text{Architecture} = \text{17 DocTypes} + \text{Web Pages}(\text{/my-exams, /proctor, /evaluate, /leaderboard}) + \text{API Layer}$$

### DocType 關係圖

```
Exam                          ← 考卷設定（題型/計時/監考/排行榜）
  ├─ Exam Added Question      ← Child：手動指定題目
  ├─ Exam Category Settings   ← Child：按分類隨機抽題
  └─ Exam Certificate Template

Exam Schedule                 ← 場次設定（開始時間/批次指派）
  ├─ Examiner                 ← Child：監考人員
  └─ Schedule Batch Assignment

Exam Submission               ← 單一考生作答記錄
  └─ Exam Answer              ← Child（每題作答）
       evaluation_status: [Not Attempted|Pending|Auto|Done]

Exam Question                 ← 題目本體（MIT 允許商用改造）
  ├─ type: Choices / User Input
  ├─ 4x option_N + is_correct_N + explanation_N
  ├─ 4x possibility_N（User Input 容錯答案）
  ├─ description_image / option_N_image（圖片題型）
  ├─ category → Exam Question Category
  └─ help_quiz → Exam Question Help Quiz（子測驗提示）
```

### 重要功能深度發現

**1. Leaderboard（✅ 完整實作）**
```python
# Exam DocType 欄位
leaderboard: Select [No Leaderboard | Exam Level | Schedule Level]
leaderboard_rows: Int

# www/leaderboard.py → /leaderboard/<submission>
can_show_exam_results_for_leaderboard(exam_doc, submission_doc)
```

**2. 考試進行快取機制（Redis）**
```python
# start_exam() 建立快取
# cache key: "tracking_data:{submission}"
# 儲存：題目順序、剩餘時間、面部偵測軌跡 (retina_location_log JSON)
```

**3. 分類抽題（`select_questions` Table）**
```python
# Exam DocType 欄位
select_questions: Table → Exam Category Settings
# → 每個分類指定抽幾題（隨機抽取）
```

**4. 幫助提示系統（Help Tab）**
```
help_show: [Do not show | Before question | After wrong answer | After any answer]
help_minimum_reading_time: Int  ← 強制閱讀時間（秒）
help_text: Text Editor          ← 富文字提示
help_quiz: Table → Exam Question Help Quiz  ← 子測驗形式提示
```

**5. 違規監控指標（Submission）**
```
face_count_changes: Int    ← 畫面中人臉數量變化次數
total_away_time: Float     ← 總離開時間
total_distracted_time: Float ← 總分心時間
attention_score: Int       ← 注意力評分
warning_count: Int         ← 警告次數（超過 max_warning_count 自動終止）
retina_location_log: JSON  ← 視線位置軌跡
```

---

## 資料流程

```mermaid
graph LR
  A[Exam Manager] -->|建立 Exam + 題目| B[Exam Schedule]
  B --> C[bulk_add_submissions 批量加入考生]
  C --> D[Exam Submission per 候選人]
  
  E[候選人] --> F[/my-exams → 考前說明]
  F --> G[start_exam API → Redis 快取]
  G --> H[逐題作答 get_question]
  H --> I[end_exam → 自動評分]
  I --> J[/leaderboard → 排名]
  
  K[監考員] --> L[/proctor → 即時監看]
  L --> M[視訊串流 + 警告]
  M --> N[自動終止（超過 max_warning_count）]
```

---

## 使用者操作流程

```mermaid
graph TD
  A[Exam Manager] -->|建立 Exam| B[設定題型/計時/監考/排行榜]
  B --> C[建立 Exam Schedule（場次）]
  C --> D[bulk_add_submissions or 邀請連結]
  
  E[候選人] --> F[/exam/invite → accept_invitation]
  F --> G[/my-exams → 考前確認]
  G --> H[start_exam → 視訊啟動]
  H --> I[逐題作答（Choices/User Input）]
  I --> J[end_exam → 成績計算]
  J --> K{show_result 設定}
  K -->|Immediately| L[顯示分數]
  K -->|After Schedule| M[等待排程完成]
  L --> N[/leaderboard 排名頁]
```

---

## API 入口

$$\text{CoreAPI} = \{start\_exam,\; end\_exam,\; get\_question,\; bulk\_add\_submissions,\; save\_marks,\; finish\_evaluation\}$$

```python
# 考試流程
exampro.exam_pro.doctype.exam_submission.exam_submission.start_exam(exam_submission)
exampro.exam_pro.doctype.exam_submission.exam_submission.end_exam(exam_submission)
exampro.exam_pro.doctype.exam_submission.exam_submission.get_question(exam_submission, qsno)

# 批量管理
exampro.exam_pro.doctype.exam_schedule.exam_schedule.bulk_add_submissions(schedule_name, email_list)
exampro.exam_pro.doctype.exam_batch.exam_batch.bulk_add_users(batch_name, emails)

# 評分
exampro.www.evaluate.save_marks(question_id, marks, submission_id, feedback)
exampro.www.evaluate.finish_evaluation(submission_id)

# 排行榜
# www/leaderboard.py → /leaderboard/<submission_id>（Web Page）

# 監考
# www/proctor.py → /proctor（Web Page）
exampro.www.proctor.get_latest_messages(proctor)  # 即時訊息輪詢
```

---

## 交叉比對

$$\text{Correction}: \text{初始研究} \to \begin{cases}
\text{排行榜} & ❌ \xrightarrow{deep} \text{✅ 已實作（Exam/Schedule Level）} \\
\text{allow\_import} & ✅ \xrightarrow{deep} ❌（allow\_import=0）
\end{cases}$$

| QuizForge-AI 功能 | exampro 狀態 | 說明 |
|-----------------|:-----------:|------|
| 視訊監考 | ✅ 完整 | 核心競爭力 |
| 排行榜 | ✅ 已實作 | **初始研究誤判為缺失** |
| 圖片題型 | ✅ 完整 | 題目+選項均支援 |
| 批次考生管理 | ✅ | bulk_add_submissions |
| 計時考試 | ✅ | Redis 快取 + 自動提交 |
| 題庫 XLSX 匯入 | ❌ | allow_import=0 |
| 刷題/練習 | ❌ | 正式考試導向 |
| frappe/lms 整合 | ❌（獨立） | 不需要 LMS app |

---

## 競品比較

| 維度 | exampro | frappe/lms |
|------|:-------:|:----------:|
| License | MIT ✅ | AGPL-3.0 ⚠️ |
| 排行榜 | ✅ | ❌ |
| 視訊監考 | ✅ | ❌ |
| 圖片題型 | ✅ | ❌ |
| 刷題模式 | ❌ | ❌ |
| XLSX 匯入 | ❌ | ⚠️ CSV |
| 課程管理 | ❌ | ✅ |
| Fork 難度 | 中（17 DocTypes，傳統頁面）| 中高（69 DocTypes，Vue SPA）|

---

## 採用決策

$$\text{Decision} = \begin{cases}
\text{MIT License} & \text{✅ 商用部署/修改/衍生物均無限制} \\
\text{Fork 策略} & \text{可行（17 DocTypes，結構清晰，無複雜前端框架）} \\
\text{適用場景} & \text{正式認證考試 + 監考 → Optional 套件} \\
\text{不適用} & \text{刷題練習、題庫匯入（需額外開發）}
\end{cases}$$

### Fork 難度評估：**中（4/10）**

$$\text{ForkDifficulty} = \begin{cases}
\text{後端 DocType} & \text{17 個，結構直觀清晰} \\
\text{前端} & \text{Frappe 傳統 Web Pages（非 SPA），修改成本低} \\
\text{required\_apps} & \text{無依賴，獨立安裝} \\
\text{MIT License} & \text{Fork + 商用 100\% 合規} \\
\text{代碼品質} & \text{有 Redis 快取、完整監控指標，設計成熟}
\end{cases}$$

### 推薦角色定位

```
frappe/lms（基礎 LMS 骨幹）
    ↓
quizforge（Custom App：題庫匯入 + 刷題 + AI 出題）
    ↓
exampro（Optional：正式認證考試 + 視訊監考 + 排行榜）
```

**exampro 排行榜可直接複用** — 排行榜 DocType 欄位和 `/leaderboard` 路由已實作，若採用 exampro 作為正式考試模組，可省去排行榜開發工時（初始估算 8–12 人天可節省）。
