# QuizForge-AI

**IPAS 資訊安全工程師認證學習平台**

一個基於 Vue 3 的現代化學習資源管理系統，專為 IPAS 資訊安全工程師認證考試設計，提供階層式導航、豐富的學習資源和互動式練習功能。

## 主要功能

### 學習資源中心 (Learning Resources Center)
- **階層式導航系統** - 5 層級結構：Overview -> Certification -> Level -> Subject -> Materials
- **資源選擇 Modal** - 快速選擇科目，支援最近瀏覽記錄
- **Table of Contents 側邊欄** - 文章導航，支援 IntersectionObserver 自動追蹤
- **Glossary 術語表** - 搜尋、排序、相關術語導航

### Materials Hub (教材中心)
- 4 種資源類型：Lecture (講義)、Handout (手冊)、Note (筆記)、Other (其他)
- 麵包屑導航
- Markdown 渲染支援 Mermaid 圖表、KaTeX 數學公式

### Practice Hub (練習中心)
- 雙入口導航：按主題 (Topic) / 按考試 (Exam)
- 即時答題反饋
- 錯題統計與複習

### 進階功能
- **響應式設計** - 支援桌面、平板、手機
- **深色/淺色主題** - 自適應系統偏好
- **離線支援** - 資源本地快取

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 建構工具 | Vite 7 |
| 樣式 | Tailwind CSS 4 |
| 狀態管理 | Pinia 3 |
| 路由 | Vue Router 4 |
| 圖示 | Heroicons Vue |
| 圖表 | Chart.js + vue-chartjs |
| Markdown | markdown-it + @mdit/plugin-katex |
| 圖表渲染 | Mermaid |
| 數學公式 | KaTeX |

## 快速開始

### 前置需求

- Node.js >= 18
- npm >= 9

### 安裝

```bash
# 克隆專案
git clone <repository-url>
cd QuizForge-AI

# 安裝依賴
npm install
```

### 開發

```bash
# 啟動開發伺服器 (port 3003)
npm run dev
```

### 建構

```bash
# 建構生產版本
npm run build

# 預覽建構結果
npm run preview
```

### 程式碼檢查

```bash
# ESLint 檢查
npm run lint

# ESLint 自動修復
npm run lint:fix
```

## 專案結構

```
QuizForge-AI/
├── src/
│   ├── components/          # 可重用元件
│   │   ├── GlossaryList.vue       # 術語表列表
│   │   ├── ResourceCard.vue       # 資源卡片
│   │   ├── ResourceSelectorModal.vue  # 資源選擇 Modal
│   │   ├── TableOfContents.vue    # 目錄側邊欄
│   │   ├── MobileNavigation.vue   # 行動版導航
│   │   └── ...
│   ├── views/               # 頁面視圖
│   │   ├── HomePage.vue           # 首頁
│   │   ├── IpasOverview.vue       # IPAS 總覽 (L1)
│   │   ├── CertificationView.vue  # 認證選擇 (L2)
│   │   ├── LevelView.vue          # 級別選擇 (L3)
│   │   ├── SubjectHub.vue         # 科目中心 (L4)
│   │   ├── ResourceTypes.vue      # Materials Hub (L5)
│   │   ├── PracticeHub.vue        # Practice Hub (L5)
│   │   ├── GlossaryListView.vue   # 術語表列表
│   │   ├── GlossaryDetail.vue     # 術語詳情
│   │   ├── ResourceDetail.vue     # 資源詳情
│   │   └── ...
│   ├── stores/              # Pinia 狀態管理
│   ├── router/              # Vue Router 路由配置
│   ├── assets/              # 靜態資源
│   └── App.vue              # 根元件
├── public/
│   └── data/                # 學習資源 JSON 資料
├── docs/                    # 專案文檔
├── .claude/                 # Claude Code 工作流程
└── package.json
```

## 導航架構

```
L1: IPAS Overview
 └─ L2: Certification (資安工程師)
     └─ L3: Level (初級/中級)
         └─ L4: Subject (資訊安全管理/資訊安全技術)
             ├─ L5a: Materials Hub (Lecture/Handout/Note/Other)
             │   └─ Resource Detail (with TOC)
             ├─ L5b: Practice Hub (Topic/Exam)
             │   └─ Quiz Page
             └─ L5c: Glossary
                 └─ Glossary Detail
```

## 線上預覽

專案部署於 Cloudflare Pages：https://ipas.leopilot.com/

## License

MIT License
