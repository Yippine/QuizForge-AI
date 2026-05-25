# TASK #29 — 實作題庫存取權限控制

**Module**: B — Question Bank GUI（XLSX 匯入 + 題庫管理）
**Priority**: P2
**Schedule**: v2-mvp
**Status**: pending

---

## What（做什麼）

為題庫實作細粒度的**存取權限控制**機制，支援三種權限模式：

1. **public** — 所有已登入使用者都可查看和刷題
2. **private** — 僅建立者和管理員可查看
3. **org** — 限定組織 (enterprise_id) 內的使用者查看

這使得 QuizForge 可支援：
- 公開的社群題庫（如官方 iPAS 試題）
- 企業內部培訓題庫（僅該企業員工可見）
- 個人私密題庫（僅所有者可見）

## Why（為什麼）

v2 MVP 的核心競爭力之一是**題庫靈活性**。不同組織有不同的題庫需求：
- **公開題庫** — 用於示範和免費服務
- **企業題庫** — 用於培訓認證，需要隱私保護
- **私密題庫** — 用於課程測驗，僅限特定課程參與者

權限控制讓我們支援這些場景，同時降低資料洩露風險。

## How（怎麼做）

### 1. 資料庫 Schema 更新

在 Supabase `questions` 表添加三個欄位：

```sql
ALTER TABLE questions ADD COLUMN (
  access_level VARCHAR(10) DEFAULT 'public',  -- 'public' | 'private' | 'org'
  owner_id UUID,  -- 建立者 ID (users.id)
  enterprise_id UUID  -- 所屬企業 ID（如果是 org 級別）
);

CREATE INDEX idx_access_level ON questions(access_level);
CREATE INDEX idx_owner_id ON questions(owner_id);
CREATE INDEX idx_enterprise_id ON questions(enterprise_id);
```

### 2. 查詢邏輯（存取控制）

修改 useBankEditor.js 的 `buildQuery()` 函數：

```javascript
function buildQuery() {
  let query = supabase.from('questions').select('*', { count: 'exact' })
  
  // ── Permission filter ─────────────────────────────────────
  const userId = auth.user?.id
  const enterpriseId = auth.user?.enterprise_id  // 從 auth store 取得
  
  query = query.or(
    `access_level.eq.public,` +
    `and(access_level.eq.private,owner_id.eq.${userId}),` +
    `and(access_level.eq.org,enterprise_id.eq.${enterpriseId})`
  )
  
  // ── Other filters ─────────────────────────────────────────
  // ... (existing filters: subject_id, topic_id, etc.)
}
```

### 3. 編輯時的權限控制

修改 BankEditorPage.vue：

**編輯權限**：
- 僅**建立者和管理員**可編輯題目
- 編輯模態框添加「存取權限」下拉菜單
- 管理員可修改題目的 `access_level`、`owner_id`、`enterprise_id`
- 普通使用者只能編輯自己建立的題目

**刪除權限**：
- 僅**建立者和管理員**可刪除題目

### 4. 匯入時的權限分配

修改 useBankImport.js：

```javascript
async function importRows(rows) {
  const userId = auth.user?.id
  const isAdmin = auth.user?.role === 'admin'
  
  // Admin 匯入 → questions 預設為 public
  // 普通使用者匯入 → 預設為 private（僅自己可見）
  const accessLevel = isAdmin ? 'public' : 'private'
  
  const enrichedRows = rows.map(row => ({
    ...row,
    access_level: accessLevel,
    owner_id: userId,
    enterprise_id: auth.user?.enterprise_id
  }))
  
  // ... insert enrichedRows
}
```

### 5. 表格顯示

在 BankEditorPage 的表格中添加「存取權限」列：

```
| # | 科目 | 主題 | 難度 | 來源 | 存取 | 題目預覽 | 操作 |
|---|------|------|------|------|------|---------|------|
| 1 | AI基礎 | AI定義 | 中 | official | public | AI的定義... | ✎ ✕ |
```

權限圖示：
- 🔓 public — 所有使用者
- 🔒 private — 僅所有者
- 🏢 org — 企業內部

### 6. 編輯模態框權限欄位

```
存取權限: [public v]  （僅管理員可修改）
  - public 所有已登入使用者可查看
  - private 僅所有者和管理員可查看
  - org 限定企業內使用者
  
所有者: [user-xxx]  （唯讀）
所屬企業: [org-yyy]  （如果適用，管理員可修改）
```

---

## 完成條件

- [ ] Supabase `questions` 表添加 `access_level`, `owner_id`, `enterprise_id` 欄位
- [ ] 資料庫索引建立完成
- [ ] useBankEditor.js 的查詢邏輯整合權限篩選
- [ ] 新增 useAuth 或擴展 authStore，提供 `userId` 和 `enterpriseId`
- [ ] BankEditorPage 表格显示「存取權限」列
- [ ] 編輯模態框显示「存取權限」、「所有者」、「所屬企業」欄位
- [ ] 編輯權限控制：非建立者無法編輯（按鈕 disabled 或不顯示）
- [ ] 刪除權限控制：非建立者無法刪除（確認對話提示無權限）
- [ ] useBankImport.js 匯入時自動設置 `access_level` 和 `owner_id`
- [ ] 刷題頁面 (QuizPage) 也整合權限篩選（僅顯示有權限的題目）
- [ ] 統計頁面 (AnalyticsPage) 只統計使用者有權限查看的題目
- [ ] 單位測試涵蓋權限檢驗邏輯
- [ ] 權限切換後，題目列表自動更新

---

## 實施建議

由於 MVP 階段很多組織功能還未完成，可採取**漸進式實施**：

**Phase 1（本 Task）**：
- 添加欄位和基本查詢邏輯
- 實作 public / private 權限
- admin 可強制查看所有題目

**Phase 2（後續迭代）**：
- 完成 org 級別權限
- 從 authStore 讀取 enterprise_id
- 企業管理面板管理權限

---

## 下一步

完成後推進至 Task #30：建立 AnalyticsPage.vue — 個人統計頁面。

