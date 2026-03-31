# TASK #1 — 初始化 Supabase 專案並設定 .env 環境變數

**Module**: X — Auth + 基礎建設
**Priority**: P0
**Schedule**: v2-mvp
**Status**: pending

---

## What（做什麼）

在 Supabase 建立新專案，取得 API 金鑰，並在本地建立 `.env` 環境變數檔案，讓後續所有 Supabase 相關模組可以透過環境變數取得連線資訊，不寫死在程式碼中。

## Why（為什麼）

v2 的核心差異是「有後端」：進度雲端同步、會員登入、CSV 題庫存入資料庫，全部仰賴 Supabase。這是整個 v2 的地基，必須最先完成，其他 35 個任務都依賴它。

## How（怎麼做）

### 1. 建立 Supabase 專案
- 前往 https://supabase.com → New Project
- 專案名稱：`quizforge-ai`
- 資料庫密碼：設定強密碼並記錄
- Region：選 `Northeast Asia (Tokyo)` 降低台灣延遲

### 2. 取得 API 金鑰
Supabase Dashboard → Project Settings → API：
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public key` → `VITE_SUPABASE_ANON_KEY`

### 3. 建立本地 .env 檔案

```bash
# .env（根目錄，不納入 git）
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 確認 .gitignore 包含 .env

```
# .gitignore 確認有這行
.env
.env.local
.env.*.local
```

### 5. 建立 .env.example（給其他開發者參考）

```bash
# .env.example（納入 git）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 完成條件

- [ ] Supabase 專案建立完成，Dashboard 可正常登入
- [ ] 根目錄有 `.env` 且包含 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`
- [ ] `.gitignore` 確認 `.env` 不會被 commit
- [ ] 根目錄有 `.env.example` 作為範本
- [ ] `npm run dev` 可正常啟動（不報環境變數錯誤）

## 下一步

完成後推進至 Task #2：安裝 `@supabase/supabase-js` + `xlsx` 套件，建立 `src/lib/supabase.js` 連線模組。
