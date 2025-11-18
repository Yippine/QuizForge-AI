# LectureDetail vs ResourceDetail Markdown 渲染差異深度分析報告

## 執行摘要

通過深入分析，我們發現「講義精華」(LectureDetail.vue) 的 Markdown 渲染效果優於「資源中心」(ResourceDetail.vue) 的主要原因包括：

1. **MarkdownIt 配置差異** - LectureDetail 使用更嚴謹的配置，ResourceDetail 的 `breaks: true` 設置導致不必要的換行
2. **CSS 樣式策略不同** - LectureDetail 使用 `:deep()` 選擇器 + scoped 樣式的組合，ResourceDetail 使用 Tailwind prose 類但缺乏細緻控制
3. **KaTeX 配置差異** - LectureDetail 使用簡潔的 logger 配置，ResourceDetail 指定了具體的錯誤顏色但方式較冗長
4. **Mermaid 渲染實現差異** - LectureDetail 使用先進的 `mermaid.run()` API，ResourceDetail 使用較舊的 `mermaid.render()` API
5. **表格優化差異** - LectureDetail 有完整的 INC-025 實作，ResourceDetail 的實現不完整
6. **KaTeX 顯示公式渲染** - LectureDetail 有完整的 `.katex-display` 樣式配置

---

## 1. MarkdownIt 配置對比

### LectureDetail.vue (完整配置)

```javascript
let md = null;

const initMarkdownRenderer = () => {
  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,  // 重要：不自動轉換單個換行符為 <br>
  });

  md.use(katex, {
    logger: (error) => {
      console.error("[KaTeX Rendering Error]:", error);
    },
  });

  // INC-026: Initialize Mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  });
};
```

**配置特點：**
- `breaks: false` - 尊重 Markdown 語法，單個換行符不產生 `<br>` 標籤
- `html: true` - 允許原始 HTML 內容
- `linkify: true` - 自動識別 URL 並轉為鏈接
- `typographer: true` - 啟用排版優化（如引號、破折號等）
- KaTeX 錯誤日誌通過 logger callback 函數處理

### ResourceDetail.vue (簡化配置)

```javascript
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true  // 問題：自動轉換單個換行符為 <br>，導致間距增加
}).use(katex, {
  throwOnError: false,
  errorColor: '#cc0000'
})
```

**配置差異：**
- `breaks: true` - **關鍵差異** - 導致不必要的換行
- KaTeX 配置不使用 logger，而是直接設置 `throwOnError` 和 `errorColor`
- 初始化過程在全局作用域，而非在函數內

**視覺影響：**
```
breaks: false 的效果：
段落1
段落2
(正常段落間距)

breaks: true 的效果：
段落1
<br>
段落2
(間距不自然，產生過多空行)
```

### Mermaid 初始化配置對比

**LectureDetail:**
```javascript
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
});
```

**ResourceDetail:**
```javascript
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
})
```

**差異分析：**
- 字體堆棧略有不同，但都適當指定了系統字體
- 兩者都設置了 `startOnLoad: false`，用於手動控制渲染時機

---

## 2. CSS 樣式對比分析

### LectureDetail.vue - :deep() 選擇器 + Scoped 樣式策略

這是一種精細化控制的方式，每個元素都有明確的樣式定義：

```css
.markdown-content {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Roboto", sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: #1f2937;
}

@media (min-width: 768px) {
  .markdown-content {
    font-size: 18px;
    line-height: 1.8;
  }
}

/* 標題樣式 */
.markdown-content :deep(h1) {
  font-size: 2.25rem;
  font-weight: bold;
  color: #111827;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.markdown-content :deep(h2) {
  font-size: 1.875rem;
  font-weight: bold;
  color: #1f2937;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
}

/* 段落 */
.markdown-content :deep(p) {
  margin-bottom: 1rem;
  color: #374151;
}

/* 列表 */
.markdown-content :deep(ul) {
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
  color: #374151;
}

/* 代碼塊 */
.markdown-content :deep(code) {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
}

.markdown-content :deep(pre) {
  background-color: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

/* 引用塊 */
.markdown-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  background-color: #eff6ff;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  border-radius: 0 0.5rem 0.5rem 0;
  font-style: italic;
  color: #1e40af;
}

/* 鏈接 */
.markdown-content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
  transition: color 0.2s;
}

.markdown-content :deep(a:hover) {
  color: #1d4ed8;
}

/* 表格 */
.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0;
  box-shadow: none;
}

.markdown-content :deep(thead) {
  background-color: #f3f4f6;
}

.markdown-content :deep(th) {
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #111827;
}

.markdown-content :deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  color: #374151;
}

.markdown-content :deep(tbody tr:hover) {
  background-color: #f9fafb;
}

/* KaTeX 公式 */
.markdown-content :deep(.katex) {
  font-size: 1.1em;
}

.markdown-content :deep(.katex-display) {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Mermaid 圖表 - INC-026 */
.markdown-content :deep(.mermaid) {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.markdown-content :deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}
```

**LectureDetail 樣式策略優點：**
- 精細化控制每個元素的間距、大小、顏色
- 明確的視覺層次（通過字體大小和margin差異）
- 行高設置適當（1.75/1.8），易於閱讀
- 色彩使用一致，符合品牌色系
- 有專門的表格和 KaTeX 樣式優化
- 有針對 Mermaid 的完整樣式支持

### ResourceDetail.vue - Tailwind Prose 類策略

```html
<article
  class="prose prose-lg max-w-none
         prose-headings:font-bold
         prose-h1:text-3xl prose-h1:mb-6
         prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
         prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
         prose-p:text-gray-700 prose-p:leading-relaxed
         prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
         prose-strong:text-gray-900 prose-strong:font-semibold
         prose-code:text-secondary-600 prose-code:bg-secondary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
         prose-pre:bg-gray-900 prose-pre:text-gray-100
         prose-ul:list-disc prose-ol:list-decimal
         prose-li:text-gray-700
         prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:pl-4 prose-blockquote:italic
         prose-img:rounded-lg prose-img:shadow-lg
         prose-table:border-collapse
         prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:p-3
         prose-td:border prose-td:border-gray-300 prose-td:p-3"
  v-html="renderedHTML"
></article>
```

**ResourceDetail 樣式對比：**

| 項目 | LectureDetail | ResourceDetail |
|------|---------------|-----------------|
| 基礎容器 | `prose prose-lg` | `prose prose-lg` |
| H1 | 2.25rem + 下邊框 | 3xl (30px) |
| H2 | 1.875rem | 2xl (24px) |
| H3 | 1.5rem | xl (20px) |
| 段落 | color: #374151 | text-gray-700 |
| 行距 | line-height: 1.75/1.8 | prose-p:leading-relaxed |
| 代碼 | 紅色 (#dc2626) | secondary-600 (紫色) |
| 代碼背景 | #f3f4f6 | secondary-50 |
| 表格邊框 | 灰色 #d1d5db | gray-300 |
| 引用 | 藍色邊框 (#3b82f6) | primary-500 |
| 鏈接 | #2563eb 帶下劃線 | primary-600 無下劃線 |

**ResourceDetail 樣式問題：**
- **缺乏 KaTeX 樣式** - 沒有針對 `.katex` 和 `.katex-display` 的樣式
- **缺乏圖表樣式** - 沒有 Mermaid 圖表的顯示樣式
- **行距可能過大** - `leading-relaxed` 可能導致段落間距過大
- **Tailwind prose 限制** - 無法像 `:deep()` 那樣精細控制，會影響響應式設計

---

## 3. KaTeX 渲染對比

### LectureDetail KaTeX 配置

```javascript
md.use(katex, {
  logger: (error) => {
    console.error("[KaTeX Rendering Error]:", error);
  },
});
```

**CSS 支持：**
```css
.markdown-content :deep(.katex) {
  font-size: 1.1em;
}

.markdown-content :deep(.katex-display) {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}
```

### ResourceDetail KaTeX 配置

```javascript
.use(katex, {
  throwOnError: false,
  errorColor: '#cc0000'
})
```

**CSS 支持：**
- 完全缺失！沒有針對 `.katex` 或 `.katex-display` 的樣式

### KaTeX 渲染差異影響

```
LectureDetail (有樣式)：
- 行內公式：$x^2 + y^2 = z^2$ 大小為 1.1em，自然融入文本
- 顯示公式：
  $$\frac{1}{2}$$
  有上下 1.5rem 的間距，可以水平滾動

ResourceDetail (無樣式)：
- 行內公式：$x^2 + y^2 = z^2$ 大小默認，可能過小或過大
- 顯示公式：可能貼著上下文本，間距不適當
- 長公式可能導致頁面水平滾動
```

---

## 4. Mermaid 圖表渲染差異（核心問題）

### LectureDetail Mermaid 實現 (INC-026) - 成功方案

**HTML 結構期望：**
```html
<pre><code class="language-mermaid">
graph TD
    A --> B
</code></pre>
```

**渲染邏輯：**
```javascript
const renderMermaid = async () => {
  try {
    const mermaidElements = document.querySelectorAll('.markdown-content pre code.language-mermaid');

    if (mermaidElements.length === 0) {
      return;
    }

    // Convert code blocks to mermaid divs
    mermaidElements.forEach((element, index) => {
      const mermaidCode = element.textContent;
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = mermaidCode;
      mermaidDiv.setAttribute('data-mermaid-index', index);

      // Replace pre > code with mermaid div
      const preElement = element.closest('pre');
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(mermaidDiv, preElement);
      }
    });

    // Run Mermaid rendering
    await mermaid.run({
      querySelector: '.markdown-content .mermaid',
    });
  } catch (error) {
    console.error("[LectureDetail] Mermaid rendering error:", error);
  }
};
```

**CSS 樣式：**
```css
.markdown-content :deep(.mermaid) {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.markdown-content :deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}
```

**特點：**
- 使用現代的 `mermaid.run()` API
- 指定了精確的 querySelector 選擇器
- 直接替換 DOM 元素（從 `<pre><code>` 到 `<div class="mermaid">`）
- 完整的樣式支持（居中、邊距、陰影、圓角等）
- 響應式設計（mobile 版本調整 padding 和 font-size）

### ResourceDetail Mermaid 實現 - 問題方案

**渲染邏輯：**
```javascript
// Render Mermaid diagrams after DOM update
await nextTick()
const mermaidElements = document.querySelectorAll('.language-mermaid')
for (const element of mermaidElements) {
  try {
    const code = element.textContent
    const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, code)
    element.innerHTML = svg
    element.classList.remove('language-mermaid')
    element.classList.add('mermaid-rendered')
  } catch (err) {
    console.error('[ResourceDetail] Mermaid render error:', err)
  }
}
```

**CSS 樣式：**
```css
:deep(.mermaid-rendered) {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

:deep(.mermaid-rendered svg) {
  max-width: 100%;
  height: auto;
}
```

### Mermaid 渲染差異分析

| 項目 | LectureDetail | ResourceDetail |
|------|---------------|-----------------|
| API | `mermaid.run()` | `mermaid.render()` |
| 查詢選擇器 | `.markdown-content pre code.language-mermaid` | `.language-mermaid` |
| 轉換方式 | 完整替換 `<pre><code>` | 直接替換 element 內容 |
| 樣式應用 | `.mermaid` 類 | `.mermaid-rendered` 類 |
| padding | 1rem | 無 |
| 圓角 | 0.5rem | 無 |
| 陰影 | 0 1px 3px | 無 |
| 背景色 | #ffffff | 無（继承） |
| 響應式 | 有專門 media query | 無 |
| iOS 滾動 | `-webkit-overflow-scrolling: touch` | 無 |

**根本問題：**

1. **API 版本差異** - `mermaid.render()` 是舊版本 API
   - 新版本的 `mermaid.run()` 更穩定、功能更完整
   - `render()` 需要手動處理 ID 和 SVG 注入，容易出錯

2. **選擇器不夠精確** - `.language-mermaid` 太廣泛
   - 可能選中不在 `.markdown-content` 中的元素
   - 無法避免重複渲染
   - LectureDetail 的 `.markdown-content pre code.language-mermaid` 更精確

3. **DOM 操作方式** - 直接修改 `innerHTML` vs 完整替換
   - ResourceDetail 在代碼元素上做 `innerHTML = svg`，會產生嵌套問題
   - LectureDetail 直接替換整個 `<pre>` 元素，更乾淨

4. **樣式不完整** - 缺乏美化
   - 沒有 padding、border-radius、box-shadow
   - 沒有背景色
   - 沒有 iOS 滾動優化

**視覺對比：**
```
LectureDetail (完整樣式)：
┌─────────────────────┐
│   ◇ Mermaid圖表 ◇   │  <- 居中，有圓角、陰影
│                     │
└─────────────────────┘

ResourceDetail (缺乏樣式)：
◇ Mermaid圖表 ◇      <- 無圓角、無陰影、對齐方式不確定
```

---

## 5. 表格滾動優化對比

### LectureDetail - INC-025 完整實現

**JavaScript 實現：**
```javascript
/**
 * INC-025: Table Scroll Optimization
 * Formula: wrapTables = QueryAllTables -> WrapEachTable(div.table-wrapper + overflow-x-auto)
 */
const wrapTables = () => {
  const tables = document.querySelectorAll(".markdown-content table");

  tables.forEach((table) => {
    // 檢查表格是否已經被包裝過
    if (table.parentElement?.classList.contains("table-wrapper")) {
      return;
    }

    // 創建包裝容器
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    // 將表格插入包裝容器
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
};
```

**CSS 樣式：**
```css
.markdown-content :deep(.table-wrapper) {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  -webkit-overflow-scrolling: touch;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0;
  box-shadow: none;
}

.markdown-content :deep(thead) {
  background-color: #f3f4f6;
}

.markdown-content :deep(th) {
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #111827;
}

.markdown-content :deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  color: #374151;
}

.markdown-content :deep(tbody tr:hover) {
  background-color: #f9fafb;
}
```

**特點：**
- 動態創建 `.table-wrapper` 容器
- 檢查是否已經包裝過（防止重複包裝）
- 獨立表格滾動，不影響頁面寬度
- iOS 平滑滾動支持
- 視覺美化（圓角、陰影）
- hover 行高亮效果

### ResourceDetail - 不完整實現

**CSS 樣式：**
```css
:deep(table) {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

:deep(table::-webkit-scrollbar) {
  height: 8px;
}

:deep(table::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 4px;
}

:deep(table::-webkit-scrollbar-thumb) {
  background: #888;
  border-radius: 4px;
}

:deep(table::-webkit-scrollbar-thumb:hover) {
  background: #555;
}
```

**問題分析：**

| 項目 | LectureDetail | ResourceDetail |
|------|---------------|-----------------|
| 動態包裝 | 是 (JavaScript) | 否 |
| 容器元素 | `.table-wrapper` div | 無容器，直接修改 table |
| 防重複包裝 | 有檢查機制 | 無 |
| 滾動條樣式 | 默認 (系統樣式) | 自定義 webkit 滾動條 |
| 邊距控制 | margin-bottom: 1.5rem | 無 |
| 視覺美化 | border-radius、box-shadow | 無 |
| Hover 效果 | 行高亮 | 無 |
| white-space | 無 | nowrap (可能導致問題) |

**white-space: nowrap 的問題：**
```
ResourceDetail：table { display: block; white-space: nowrap; }
後果：表格內所有內容都在一行，無法換行
可能導致表格寬度極寬，滾動條笨重

LectureDetail：正常 table 元素結構
result：表格正常換行，wrapper 容器處理水平滾動
```

---

## 6. 完整代碼流程對比

### LectureDetail 完整流程

```
1. initMarkdownRenderer() 
   ↓
   ├─ new MarkdownIt({ breaks: false, ... })
   ├─ .use(katex, { logger: ... })
   └─ mermaid.initialize({ ... })

2. loadLectureContent()
   ↓
   ├─ fetch markdown file
   └─ extractTitle()

3. parseMarkdown()
   ↓
   ├─ md.render(content) → renderedHTML
   ├─ await nextTick()
   ├─ wrapTables()  ← INC-025
   └─ await renderMermaid()  ← INC-026
        ├─ querySelectorAll('.markdown-content pre code.language-mermaid')
        ├─ 轉換 <pre><code> → <div class="mermaid">
        └─ mermaid.run({ querySelector: '.markdown-content .mermaid' })

4. 樣式應用
   ├─ .markdown-content :deep() 精細選擇器
   ├─ KaTeX 樣式完整
   ├─ Mermaid 樣式完整
   └─ 表格樣式 + table-wrapper 樣式完整
```

### ResourceDetail 簡化流程

```
1. 全局初始化
   ├─ new MarkdownIt({ breaks: true, ... })  ← 問題：breaks: true
   └─ .use(katex, { throwOnError: false, ... })

2. mermaid.initialize({ ... })
   ↓
   (全局初始化，不在函數內)

3. loadMarkdownContent()
   ↓
   ├─ fetch markdown file
   ├─ md.render(text) → renderedHTML
   ├─ await nextTick()
   └─ 立即渲染 Mermaid (在同一函數內)
        ├─ querySelectorAll('.language-mermaid')  ← 選擇器太廣泛
        └─ mermaid.render()  ← 舊版本 API
             └─ element.innerHTML = svg  ← 直接注入，可能產生嵌套

4. 樣式應用
   ├─ Tailwind prose 類 (廣泛)
   ├─ KaTeX 樣式缺失  ← 問題
   ├─ Mermaid 樣式不完整  ← 問題
   └─ 表格樣式不完整 (缺少 wrapper)  ← 問題
```

---

## 7. 視覺呈現差異根本原因

### 字體和排版

```
LectureDetail:
- 字體族：system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif
- 基礎字號：16px (mobile) / 18px (desktop)
- 行高：1.75 / 1.8 (非常適合閱讀)
- 段落間距：1rem
- 標題間距：明確定義 (margin-top + margin-bottom)

ResourceDetail:
- 依賴 Tailwind prose
- prose-p:leading-relaxed (可能過大)
- 缺乏精細的響應式控制
```

### 色彩系統

```
LectureDetail:
- 正文色：#374151 (灰色 700)
- 標題色：#111827 (灰色 900)
- 代碼文本：#dc2626 (紅色，視覺突出)
- 代碼背景：#f3f4f6 (灰色 100)
- 鏈接：#2563eb (藍色 600) + underline
- 引用邊框：#3b82f6 (藍色 500)

ResourceDetail:
- 正文色：text-gray-700 (同上)
- 代碼文本：text-secondary-600 (紫色，不如紅色突出)
- 代碼背景：secondary-50 (紫色淡色)
- 鏈接：primary-600 (無 underline)
```

### 視覺層次

```
LectureDetail:
h1: 2.25rem (36px) with border-bottom
h2: 1.875rem (30px)
h3: 1.5rem (24px)
p: 16px/18px
code: 0.875em (smaller)

ResourceDetail:
h1: 3xl (30px) - 相對更小
h2: 2xl (24px)
h3: xl (20px)
p: default prose size
code: default prose size
```

---

## 8. 修復建議

### 優先級 1：Critical Issues

#### 8.1.1 修復 ResourceDetail 的 `breaks: true` 設置

**當前代碼：**
```javascript
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true  // 問題
})
```

**修復方案：**
```javascript
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false  // 改為 false，與 LectureDetail 一致
})
```

**影響：**
- 修復不必要的換行符轉換
- 段落間距自然化
- 完全符合 Markdown 標準

---

#### 8.1.2 為 ResourceDetail 添加 KaTeX 樣式

**在 ResourceDetail.vue 的 `<style scoped>` 中添加：**

```css
/* KaTeX Formula Styles */
:deep(.katex) {
  font-size: 1.1em;
}

:deep(.katex-display) {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}

:deep(.katex-html) {
  white-space: normal;
}
```

**影響：**
- 行內公式大小適當
- 顯示公式有正確的上下邊距
- 長公式可以水平滾動

---

#### 8.1.3 修複 ResourceDetail 的 Mermaid 實現

**當前代碼（問題）：**
```javascript
const mermaidElements = document.querySelectorAll('.language-mermaid')
for (const element of mermaidElements) {
  try {
    const code = element.textContent
    const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, code)
    element.innerHTML = svg
    element.classList.remove('language-mermaid')
    element.classList.add('mermaid-rendered')
  } catch (err) {
    console.error('[ResourceDetail] Mermaid render error:', err)
  }
}
```

**修復方案 - 採用 LectureDetail 的方式：**

```javascript
/**
 * Render Mermaid Diagrams (Updated from LectureDetail approach)
 */
const renderMermaid = async () => {
  try {
    // Use more specific selector to avoid conflicts
    const mermaidElements = document.querySelectorAll('pre code.language-mermaid');

    if (mermaidElements.length === 0) {
      return; // No Mermaid diagrams to render
    }

    // Convert code blocks to mermaid divs
    mermaidElements.forEach((element, index) => {
      const mermaidCode = element.textContent;
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = mermaidCode;
      mermaidDiv.setAttribute('data-mermaid-index', index);

      // Replace pre > code with mermaid div
      const preElement = element.closest('pre');
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(mermaidDiv, preElement);
      }
    });

    // Run Mermaid rendering using modern API
    await mermaid.run({
      querySelector: '.mermaid',
    });
  } catch (error) {
    console.error("[ResourceDetail] Mermaid rendering error:", error);
  }
};
```

**改變點：**
1. 使用更精確的選擇器：`.language-mermaid` → `pre code.language-mermaid`
2. 直接替換 `<pre>` 元素，而不是修改 `innerHTML`
3. 使用 `mermaid.run()` 替代 `mermaid.render()`
4. 移除隨機 ID 生成，使用 `data-mermaid-index`

**在 script 中調用：**
```javascript
// In loadMarkdownContent function
renderedHTML.value = md.render(text)
await nextTick()
await renderMermaid()  // 新增函數調用
```

---

#### 8.1.4 完整的 Mermaid 樣式更新

**當前的 ResourceDetail CSS：**
```css
:deep(.mermaid-rendered) {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

:deep(.mermaid-rendered svg) {
  max-width: 100%;
  height: auto;
}
```

**修復後的 CSS（採用 LectureDetail 樣式）：**
```css
/* Mermaid Diagram Styles */
:deep(.mermaid) {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}

/* Mobile responsive */
@media (max-width: 767px) {
  :deep(.mermaid) {
    padding: 0.5rem;
    margin: 1rem 0;
  }

  :deep(.mermaid svg) {
    font-size: 12px;
  }
}
```

**改變點：**
1. 添加 `align-items: center` 確保垂直居中
2. 添加 `padding: 1rem` 提供內部間距
3. 添加 `background-color: #ffffff` 明確背景色
4. 添加 `border-radius: 0.5rem` 圓角美化
5. 添加 `box-shadow` 視覺深度
6. 添加 `overflow-x: auto` 和 `-webkit-overflow-scrolling: touch` 處理長圖表
7. 添加 mobile 響應式樣式

---

### 優先級 2：Important Improvements

#### 8.2.1 改善 ResourceDetail 的表格樣式

**當前問題：**
```css
:deep(table) {
  display: block;
  overflow-x: auto;
  white-space: nowrap;  // 問題：導致表格內容無法換行
  -webkit-overflow-scrolling: touch;
}
```

**修復方案 1：移除 white-space: nowrap**
```css
/* Table Wrapper Implementation (Similar to LectureDetail INC-025) */
:deep(.table-wrapper) {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  -webkit-overflow-scrolling: touch;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0;
  box-shadow: none;
}

:deep(thead) {
  background-color: #f3f4f6;
}

:deep(th) {
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #111827;
}

:deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.75rem 1rem;
  color: #374151;
}

:deep(tbody tr:hover) {
  background-color: #f9fafb;
}
```

**修復方案 2：添加 JavaScript 動態包裝（與 LectureDetail 完全一致）**

在 `loadMarkdownContent` 函數中添加：
```javascript
/**
 * INC-025: Table Scroll Optimization (複用 LectureDetail 邏輯)
 */
const wrapTables = () => {
  const tables = document.querySelectorAll("table");

  tables.forEach((table) => {
    // 檢查表格是否已經被包裝過
    if (table.parentElement?.classList.contains("table-wrapper")) {
      return;
    }

    // 創建包裝容器
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    // 將表格插入包裝容器
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
};

// 在 loadMarkdownContent 中調用
await nextTick()
wrapTables()
await renderMermaid()
```

**比較：**
| 方案 | 優點 | 缺點 |
|------|------|------|
| 方案1 (純CSS) | 簡單，無需JS | 無法防止重複包裝，樣式控制受限 |
| 方案2 (JS+CSS) | 完整、可靠、與LectureDetail一致 | 需要JS代碼 |

**推薦：方案 2**

---

#### 8.2.2 優化 ResourceDetail 的代碼高亮顏色

**當前設置：**
```
代碼文本：text-secondary-600 (紫色 #9333ea)
代碼背景：secondary-50 (紫色淡色 #faf5ff)
```

**問題：** 紫色對比度不如 LectureDetail 的紅色清晰

**修復方案：**
```css
:deep(code) {
  color: #dc2626;  /* 改為紅色，與 LectureDetail 一致 */
  background-color: #f3f4f6;  /* 改為灰色 */
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
}
```

或者，如果想保持現有色系，提高對比度：
```css
:deep(code) {
  color: #7e22ce;  /* 深紫色，對比度更高 */
  background-color: #f3e8ff;  /* 浅紫色，對比度更高 */
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
}
```

---

#### 8.2.3 改進代碼塊樣式

**當前設置：**
```css
:deep(pre) {
  background-color: #ffffff;  /* LectureDetail 使用深色 */
  padding: 1rem;  /* 缺乏上下 padding */
}

:deep(pre code) {
  color: inherit;
}
```

**改進方案：**
```css
:deep(pre) {
  background-color: #1f2937;  /* 深色背景，與 LectureDetail 一致 */
  color: #e5e7eb;  /* 淺色文本 */
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

:deep(pre code) {
  background-color: transparent;  /* 移除背景色 */
  color: inherit;  /* 繼承來自 pre 的顏色 */
  padding: 0;
  font-size: 0.875rem;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
}
```

---

### 優先級 3：Polish & Consistency

#### 8.3.1 統一響應式設計

**在 ResourceDetail.vue 中添加媒體查詢：**

```css
/* Mobile responsive adjustments */
@media (max-width: 767px) {
  .prose {
    font-size: 14px;
    line-height: 1.6;
  }

  :deep(h1) {
    font-size: 24px;
  }

  :deep(h2) {
    font-size: 20px;
  }

  :deep(h3) {
    font-size: 18px;
  }

  :deep(p) {
    font-size: 14px;
    line-height: 1.6;
  }

  :deep(table) {
    font-size: 13px;
  }

  :deep(th),
  :deep(td) {
    padding: 0.5rem 0.75rem;
  }

  :deep(.mermaid) {
    padding: 0.5rem;
    margin: 1rem 0;
  }
}
```

---

#### 8.3.2 添加圖片樣式

**LectureDetail 有完整的圖片樣式，ResourceDetail 缺失：**

```css
:deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

#### 8.3.3 改進鏈接樣式

**當前：**
```
prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
```

**改進：** 添加過渡效果
```css
:deep(a) {
  color: #2563eb;
  text-decoration: underline;
  transition: color 0.2s;
}

:deep(a:hover) {
  color: #1d4ed8;
}
```

---

## 9. 總結對比表

| 功能項 | LectureDetail | ResourceDetail | 差異影響 |
|--------|---------------|-----------------|---------|
| breaks 設置 | false (正確) | true (錯誤) | 段落間距異常 |
| KaTeX 配置 | logger callback | throwOnError | 功能相同 |
| KaTeX 樣式 | 完整 (.katex, .katex-display) | 缺失 | 公式顯示不佳 |
| Mermaid API | mermaid.run() (新) | mermaid.render() (舊) | 穩定性差異 |
| Mermaid 選擇器 | `.markdown-content pre code.language-mermaid` | `.language-mermaid` | 選擇範圍太廣 |
| Mermaid 轉換 | 完整替換元素 | 直接注入 HTML | 可能產生嵌套 |
| Mermaid 樣式 | 完整 (padding, shadow, border-radius) | 不完整 | 視覺差異大 |
| 表格實現 | JavaScript 包裝 + CSS | 純 CSS (white-space: nowrap) | 表格內容換行問題 |
| 表格樣式 | 完整 (wrapper, hover, border) | 部分 (缺 wrapper) | 樣式不統一 |
| 代碼高亮 | 紅色 (#dc2626) | 紫色 (secondary-600) | 視覺對比度 |
| 代碼背景 | 灰色 (#f3f4f6) | 紫色 (secondary-50) | 視覺風格不同 |
| 代碼塊背景 | 深色 (#1f2937) | 白色或繼承 | 可讀性差異 |
| 引用塊樣式 | 完整 (border, bg, padding) | 部分 (缺乏細緻) | 視覺呈現 |
| 響應式設計 | 詳細 (媒體查詢) | 依賴 prose | 小屏幕表現 |
| 圖片樣式 | 完整 (shadow, border-radius) | 缺失 | 圖片視覺效果 |

---

## 10. 實施優先級清單

### 第一週（Critical）
- [ ] 修復 `breaks: true` → `breaks: false`
- [ ] 添加 KaTeX 樣式
- [ ] 修復 Mermaid 渲染實現

### 第二週（Important）
- [ ] 完整 Mermaid CSS 樣式
- [ ] 實現表格 wrapper 動態包裝
- [ ] 改善代碼塊樣式

### 第三週（Polish）
- [ ] 添加響應式媒體查詢
- [ ] 統一圖片和鏈接樣式
- [ ] 性能優化和測試

---

## 結論

LectureDetail.vue 的 Markdown 渲染效果更佳的根本原因在於：

1. **配置更嚴謹** - 使用 `breaks: false` 遵循 Markdown 標準
2. **樣式更完整** - 使用 `:deep()` 選擇器對所有元素進行精細定義
3. **API 更現代** - 使用 `mermaid.run()` 而不是過時的 `mermaid.render()`
4. **實現更成熟** - INC-025 表格優化、INC-026 Mermaid 集成都是完整的
5. **細節更周全** - 包括 KaTeX、響應式設計、iOS 滾動優化等

通過按照本報告的修復建議，可以快速將 ResourceDetail.vue 的渲染質量提升至與 LectureDetail.vue 相當或更優的水平。
