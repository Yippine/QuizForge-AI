# QuizForge-AI 專案探索報告

## 1. 專案當前狀態

### 1.1 專案狀態：**已有基礎結構，內容豐富**

**狀態特徵：**

- 專案階段：知識庫/內容構建完成，待開發平台層
- Git 提交歷史：4 個主要提交（初始化 -> 知識庫建立 -> 題目整理）
- 當前分支：dev（領先 main）
- 代碼實現：暫無（純內容/知識庫項目）

### 1.2 Git 提交時間線

```
Commit Timeline:
├─ 5040a85 (HEAD->dev, main) Establish A Comprehensive IPAS Knowledge Base
│  └─ 新增完整的 IPAS 知識庫架構
│
├─ e329e2c Untrack Formula Contract from Git
│  └─ 移除 Formula Contract 追蹤
│
├─ 462c1bc Provide Exam Questions
│  └─ 提供考試題目（已遷移到新位置）
│
└─ 608bbb5 Initial commit
   └─ 項目初始化
```

---

## 2. Knowledge Base 目錄結構

### 2.1 完整目錄樹

```
knowledge-base/
└── ipas/
    ├── 1 handout/
    │   ├── AI 應用規劃師(初級)-學習指引-科目1人工智慧基礎概論/
    │   ├── AI 應用規劃師(初級)-學習指引-科目2生成式AI應用與規劃/
    │   ├── AI 應用規劃師(中級)-學習指引-科目1人工智慧技術應用規劃/
    │   ├── AI 應用規劃師(中級)-學習指引-科目2大數據處理分析與應用/
    │   ├── AI 應用規劃師(中級)-學習指引-科目3機器學習技術與應用/
    │   ├── iPAS+AI 應用規劃師初級能力鑑定-考試樣題(114年9月版)/
    │   ├── iPAS+AI 應用規劃師中級能力鑑定-考試樣題(114年9月版)+v2/
    │   └── AI 應用規劃師(初級)學習指引勘誤表11404.md
    │
    ├── 2 mermaid/
    │   ├── L21-人工智慧技術應用與規劃-全局架構.md
    │   ├── L211-AI相關技術應用.md
    │   ├── L212-AI導入評估規劃.md
    │   ├── L213-AI技術應用與系統部署.md
    │   ├── L23-機器學習技術與應用-全局架構.md
    │   ├── L231-機器學習基礎數學.md
    │   ├── L232-機器學習與深度學習.md
    │   ├── L233-機器學習建模與參數調校.md
    │   └── L234-機器學習治理.md
    │
    ├── 3 formula/
    │   ├── L21-科目1/  (8 個 Formula 檔案)
    │   │   ├── L21101-自然語言處理技術與應用.md
    │   │   ├── L21102-電腦視覺技術與應用.md
    │   │   ├── L21103-生成式AI技術與應用.md
    │   │   ├── L21104-多模態人工智慧應用.md
    │   │   ├── L21201-AI導入評估.md
    │   │   ├── L21202-AI導入規劃.md
    │   │   ├── L21203-AI風險管理.md
    │   │   ├── L21301-數據準備與模型選擇.md
    │   │   └── L21302-AI技術系統集成與部署.md
    │   │
    │   └── L23-科目3/  (14 個 Formula 檔案)
    │       ├── L23101-機率統計之機器學習基礎應用.md
    │       ├── L23102-線性代數之機器學習基礎應用.md
    │       ├── L23103-數值優化技術與方法.md
    │       ├── L23201-機器學習原理與技術.md
    │       ├── L23202-常見機器學習演算法.md
    │       ├── L23203-深度學習原理與框架.md
    │       ├── L23301-數據準備與特徵工程.md
    │       ├── L23302-模型選擇與架構設計.md
    │       ├── L23303-模型訓練評估驗證.md
    │       ├── L23304-模型調整與優化.md
    │       ├── L23401-數據隱私安全合規.md
    │       └── L23402-演算法偏見與公平性.md
    │
    └── 4 questions/
        ├── official-questions.json      (100 題，官方+樣題)
        ├── L21-mock-exam.json          (120 題，科目1)
        └── L23-mock-exam.json          (134 題，科目3)
```

---

## 3. 可用資源清單

### 3.1 講義資源 (Handout)

| 資源         | 數量     | 說明                                              |
| ------------ | -------- | ------------------------------------------------- |
| **初級講義** | 2 個     | 科目 1 基礎概論 + 科目 2 生成式 AI                |
| **中級講義** | 3 個     | 科目 1 技術應用 + 科目 2 大數據 + 科目 3 機器學習 |
| **官方樣題** | 2 個     | 初級樣題 + 中級樣題(v2)                           |
| **勘誤表**   | 1 個     | 初級學習指引勘誤                                  |
| **總計**     | 8 個文件 | 全部為 Markdown 格式                              |

### 3.2 架構圖資源 (Mermaid)

| 分類     | 檔案名                                 | 內容            |
| -------- | -------------------------------------- | --------------- |
| L21 全局 | L21-人工智慧技術應用與規劃-全局架構.md | 科目 1 整體架構 |
| L21 細節 | L211/L212/L213-\*.md                   | 3 個子領域細節  |
| L23 全局 | L23-機器學習技術與應用-全局架構.md     | 科目 3 整體架構 |
| L23 細節 | L231-L234-\*.md                        | 4 個子領域細節  |
| **總計** | 9 個 Mermaid 圖                        | 視覺化知識結構  |

### 3.3 Formula 資源 (核心知識單位)

| 編碼系統     | 數量          | 涵蓋範圍                                   |
| ------------ | ------------- | ------------------------------------------ |
| **L21 系列** | 9 個          | AI 技術應用規劃（3 個章節 ×3 個主題）      |
| **L23 系列** | 14 個         | 機器學習技術與應用（4 個章節 ×2-3 個主題） |
| **總計**     | 23 個 Formula | 約 40,000+ 字的詳細內容                    |

**Formula 編碼規則示例：**

```
L21101 = L(課程) + 21(科目1) + 1(章節1) + 01(主題1)
L23401 = L(課程) + 23(科目3) + 4(章節4) + 01(主題1)
```

### 3.4 題目資源 (JSON 格式)

| 檔案名                      | 題數   | 來源          | 編碼示例        |
| --------------------------- | ------ | ------------- | --------------- |
| **official-questions.json** | 100    | 官方教材+樣題 | OFF_L21_CH3_001 |
| **L21-mock-exam.json**      | 120    | 科目 1 模擬考 | L21101_001      |
| **L23-mock-exam.json**      | 134    | 科目 3 模擬考 | L23101_001      |
| **總計**                    | 354 題 | 多來源整合    | -               |

---

## 4. 題目 JSON 結構分析

### 4.1 Official Questions 結構

```json
{
  "exam_info": {
    "source": "official_complete",
    "total_questions": 100,
    "breakdown": {
      "L21_textbook_ch3": 10,
      "L21_textbook_ch4": 10,
      "L21_textbook_ch5": 10,
      "L21_sample": 15,
      "L23_textbook_ch3": 10,
      "L23_textbook_ch4": 10,
      "L23_textbook_ch5": 10,
      "L23_textbook_ch6": 10,
      "L23_sample": 15
    }
  },
  "questions": [
    {
      "question_id": "OFF_L21_CH3_001",
      "source": "講義練習題-科目1-第3章-第1題",
      "subject": "L21",
      "subject_name": "人工智慧技術應用規劃",
      "chapter": "第3章 AI相關技術應用",
      "topic": "L21201_自然語言處理",
      "difficulty": "simple",
      "question": "下列何者為自然語言處理（NLP）中的詞嵌入技術...",
      "options": {
        "A": "TF-IDF",
        "B": "Word2Vec",
        "C": "Stop Words",
        "D": "Bag-of-Words"
      },
      "answer": "B",
      "answer_text": "Word2Vec",
      "explanation": "Word2Vec是一種詞嵌入方法...",
      "keywords": ["Word2Vec", "詞嵌入", "NLP", "向量表示"]
    }
  ]
}
```

### 4.2 Mock Exam 結構 (L21-mock-exam.json)

```json
{
  "questions": [
    {
      "question_id": "L21101_001",
      "sequence": 1,
      "topic": "L21101-自然語言處理技術與應用",
      "difficulty": "simple",
      "question_type": "technical_definition",
      "question": "自然語言處理（NLP）的核心目標為何？",
      "options": {
        "A": "...",
        "B": "...",
        "C": "...",
        "D": "..."
      },
      "answer": "B",
      "explanation": "...",
      "keywords": ["NLP", "定義", "語言處理"],
      "reference": "L21101-自然語言處理技術與應用.md - 核心定義"
    }
  ]
}
```

### 4.3 數據欄位說明

| 欄位            | 類型   | 說明         | 範例                      |
| --------------- | ------ | ------------ | ------------------------- |
| **question_id** | string | 題目唯一標識 | L21101_001                |
| **question_id** | string | 題目序號     | 1                         |
| **topic**       | string | 知識點編碼   | L21101                    |
| **difficulty**  | enum   | 難度等級     | simple, medium, hard      |
| **question**    | string | 題目敘述     | "下列何者..."             |
| **options**     | object | 選項 A/B/C/D | {"A": "...", "B": "..."}  |
| **answer**      | string | 正確答案     | "B"                       |
| **explanation** | string | 解析說明     | "Word2Vec 是..."          |
| **keywords**    | array  | 知識關鍵字   | ["詞嵌入", "NLP"]         |
| **reference**   | string | 關聯 Formula | "L21101-...md - 核心定義" |

---

## 5. Formula 文件詳細分析

### 5.1 Formula 結構示例 (L21101-自然語言處理技術與應用.md)

**文件大小：** 約 2,000+ 行

**內容章節：**

```
├─ 1. 核心定義 (20%)
│   ├─ 1.1 主題定義
│   ├─ 1.2 核心概念
│   ├─ 1.3 CFDS 分解
│   └─ 1.4 技術定位
│
├─ 2. 關鍵公式 (25%)
│   ├─ 2.1 NLP 處理流程主公式
│   ├─ 2.2 技術演進公式
│   ├─ 2.3 Transformer 核心公式
│   ├─ 2.4 詞向量化技術公式
│   ├─ 2.5 預訓練語言模型公式
│   └─ 2.6 文本表示公式
│
├─ 3. 對比矩陣 (15%)
│   ├─ 3.1 技術演進對比表
│   ├─ 3.2 詞向量技術對比
│   ├─ 3.3 BERT vs GPT 對比
│   └─ 3.4 選擇決策樹
│
├─ 4. 實務應用 (20%)
│   ├─ 4.1 智慧客服系統
│   ├─ 4.2 情感分析與輿情監控
│   ├─ 4.3 機器翻譯系統
│   ├─ 4.4 實作步驟
│   └─ 4.5 常見陷阱與解決方案
│
├─ 5. 記憶口訣 (10%)
│   ├─ 5.1 核心口訣
│   ├─ 5.2 記憶技巧
│   ├─ 5.3 快速回憶提示
│   └─ 5.4 易混淆辨析
│
└─ 6. 自我驗證 (10%)
    ├─ 6.1 選擇題
    ├─ 6.2 簡答題
    └─ 6.3 易錯點提醒
```

**主要特點：**

- CFDS 分解框架（Code, Files, Data, State）
- 包含數學公式與符號說明
- 提供對比矩陣與決策樹
- 實務應用場景演示
- 記憶口訣與易錯點分析

---

## 6. 現有專案結構評估

### 6.1 已有組件

```
✓ 知識庫架構完整
  ├─ 講義資源（5 份學習指引）
  ├─ 架構圖（9 個 Mermaid 圖）
  ├─ Formula 文件（23 個詳細主題）
  └─ 題目庫（354 道題目）

✓ 內容品質高
  ├─ Formula 包含 CFDS 分解
  ├─ 題目包含詳細解析
  ├─ 結構化知識組織
  └─ 多層次學習資源

✓ 數據格式標準化
  ├─ JSON 題庫有統一結構
  ├─ Formula 編碼系統清晰
  ├─ Markdown 格式易於維護
  └─ 字段完整（題目+選項+答案+解析）

✓ Git 版本控制
  ├─ 清晰的提交歷史
  ├─ 分支管理（dev/main）
  └─ 知識庫追蹤
```

### 6.2 缺失組件

```
✗ 前端框架：無
✗ 後端框架：無
✗ 數據庫設計：無
✗ API 接口：無
✗ 認證系統：無
✗ 用戶管理：無
✗ 測試框架：無
✗ 部署配置：無
```

---

## 7. 建議技術棧

### 7.1 推薦架構

**基於現有結構與適合團隊規模的建議：**

```
前端層：
  ├─ React / Vue 3 (UI 框架)
  ├─ Tailwind CSS (樣式)
  ├─ Zustand / Pinia (狀態管理)
  └─ Vite (構建工具)

後端層：
  ├─ Node.js + Express / Fastify
  │  或
  ├─ Python + FastAPI (推薦，適合 AI 集成)
  │  或
  ├─ Go + Gin (性能優先)
  └─ 原因：便於整合 Ollama

數據層：
  ├─ MongoDB (靈活存儲 JSON 題庫)
  │  或
  ├─ PostgreSQL + JSON 支持 (結構化)
  └─ Redis (緩存+實時功能)

AI 集成：
  ├─ Ollama (本地 LLM)
  ├─ LangChain (LLM 框架)
  └─ 功能：自動生成題目、錯誤分析

其他：
  ├─ Docker (容器化)
  ├─ GitHub Actions (CI/CD)
  └─ Pytest/Jest (測試)
```

### 7.2 分層實現建議

**Phase 1 (MVP, 4-6 周)：**

- React + Express.js
- MongoDB 存儲現有 JSON 題庫
- 基本題庫瀏覽、做題、查看結果
- 用戶基本認證

**Phase 2 (2-3 月)：**

- 升級後端：FastAPI（便於 AI 集成）
- 加入 Ollama 本地 LLM
- 自動生成題目功能
- 學習進度追蹤

**Phase 3 (3-6 月)：**

- 自適應學習引擎
- 錯題本智慧分析
- 社群功能（排行榜、分享）
- 移動端適配

---

## 8. 立即可進行的工作

### 8.1 數據處理任務

```
Priority 1 (立即)：
  ✓ 驗證所有 JSON 題庫的完整性
  ✓ 補充缺失的字段（如果有）
  ✓ 統一 Formula 編碼格式
  ✓ 建立題庫版本控制機制

Priority 2 (本週)：
  ✓ 設計數據庫 Schema（題目、用戶、答題記錄）
  ✓ 建立題庫導入脚本
  ✓ 建立 API 規範文檔
  ✓ 建立前後端交互數據格式

Priority 3 (本月)：
  ✓ 實現基本後端 API
  ✓ 實現前端題庫展示
  ✓ 實現用戶認證
  ✓ 實現答題提交與評分
```

### 8.2 可複用的代碼框架

**建議建立的工具函數庫：**

```python
# utils/question_loader.py
def load_questions_from_json(filepath) -> List[Question]
def validate_question_structure(question) -> bool
def filter_by_topic(questions, topic_code) -> List[Question]
def filter_by_difficulty(questions, level) -> List[Question]

# utils/formula_parser.py
def parse_formula_file(filepath) -> Dict
def extract_keywords(formula_content) -> List[str]
def extract_examples(formula_content) -> List[Dict]

# models/question.py
class Question(BaseModel):
    question_id: str
    topic: str
    difficulty: str
    question: str
    options: Dict[str, str]
    answer: str
    explanation: str
    keywords: List[str]

# services/quiz_service.py
class QuizService:
    def generate_quiz(self, topic, difficulty, count)
    def evaluate_answer(self, question_id, user_answer)
    def get_user_statistics(self, user_id)
```

---

## 9. 項目統計信息

| 指標             | 數值                       |
| ---------------- | -------------------------- |
| **知識庫總字數** | 約 40,000+ 字              |
| **Formula 主題** | 23 個                      |
| **題庫總題數**   | 354 道                     |
| **題庫覆蓋章節** | 8 個章節                   |
| **支援難度等級** | 3 級（simple/medium/hard） |
| **平均題目欄位** | 11 個                      |
| **Mermaid 圖表** | 9 個                       |
| **Git 提交數**   | 4 個                       |
| **項目涵蓋科目** | 2 個（L21, L23）           |

---

## 10. 總結與下一步

### 10.1 項目優勢

1. **內容完整**：知識庫詳細，覆蓋面廣
2. **格式標準**：JSON、Markdown、Mermaid 統一
3. **品質高**：每道題目包含詳細解析和關鍵字
4. **可擴展**：Formula 編碼系統便於新增內容
5. **版本控制**：Git 追蹤，便於協作

### 10.2 立即行動清單

- [ ] 1. 建立項目開發計畫文檔
- [ ] 2. 選定並配置技術棧
- [ ] 3. 建立數據庫 Schema
- [ ] 4. 開發後端 API 框架
- [ ] 5. 開發前端原型
- [ ] 6. 集成現有題庫數據
- [ ] 7. 實現基本答題功能
- [ ] 8. 建立用戶系統
- [ ] 9. 集成 Ollama 進行 AI 增強
- [ ] 10. 部署與測試

### 10.3 成功指標

- MVP 上線時間：6-8 週
- 支持題庫量：354+ 題
- 用戶功能：註冊、做題、查看結果、進度追蹤
- AI 功能：題目推薦、錯誤分析
