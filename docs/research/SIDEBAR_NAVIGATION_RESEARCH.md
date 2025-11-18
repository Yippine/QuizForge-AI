# QuizForge-AI 側邊欄、導航和響應式設計研究報告

## 執行摘要

本報告詳細分析了 QuizForge-AI 專案中現有的側邊欄實現、導航模式和響應式設計方式。專案目前並未使用第三方 UI 庫（如 Headless UI、Radix UI），而是採用純 Tailwind CSS 和 Vue 3 原生實現。已發現多個可複用的設計模式和最佳實踐。

---

## 1. 現有側邊欄實現分析

### 1.1 ResourceDetail.vue 的右側欄（相關資源）

**檔案位置**：`/src/views/ResourceDetail.vue` (行 239-260)

**實現方式**：
```vue
<!-- Sidebar: Related Resources -->
<div v-if="relatedResources.length > 0" class="lg:w-80">
  <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
    <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-primary-600">...</svg>
      相關資源
    </h3>
    <div class="space-y-3 max-h-96 overflow-y-auto">
      <!-- 相關項目列表 -->
    </div>
  </div>
</div>
```

**關鍵特性**：
- **響應式隱藏**：只在 lg 以上屏幕顯示（`lg:w-80`）
- **粘性定位**：使用 `sticky top-4` 使側邊欄跟隨滾動
- **寬度控制**：固定寬度 80 單位（320px）
- **滾動優化**：側邊欄內部可滾動（`max-h-96 overflow-y-auto`）
- **卡片樣式**：白色背景、圓角、陰影、內邊距

**複用模式**：
```
組織結構 = [固定容器] + [粘性卡片] + [可滾動內容列表]
版式公式 = lg:w-80 (寬度) + sticky top-4 (定位) + max-h-96 (高度限制)
```

### 1.2 MobileNavigation.vue（底部導航）

**檔案位置**：`/src/components/MobileNavigation.vue`

**實現方式**：
```vue
<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50">
  <div class="grid grid-cols-4 gap-3 p-4">
    <!-- 四個導航按鈕 -->
  </div>
</nav>
```

**特性分析**：
- **條件隱藏**：`md:hidden` - 只在小屏幕顯示
- **固定定位**：`fixed bottom-0 left-0 right-0` - 底部全寬度
- **網格佈局**：4 列均勻分佈
- **觸摸友好**：每個按鈕高度 >= 44px（最小觸摸目標）

---

## 2. 響應式設計模式

### 2.1 Tailwind CSS 斷點使用

專案使用標準 Tailwind 斷點（無自定義斷點）：

| 前綴 | 屏幕寬度 | 使用場景 |
|------|--------|---------|
| `sm:` | >= 640px | 小平板 |
| `md:` | >= 768px | 平板/小筆電 |
| `lg:` | >= 1024px | 桌面 |
| `xl:` | >= 1280px | 大屏桌面 |

**實際使用統計**：
- `md:` - 最常用（區分手機和非手機）
- `lg:` - 用於側邊欄、多列布局
- `sm:` - 較少使用
- `xl:` - 罕見

### 2.2 響應式佈局模式

#### 模式 1：隱藏/顯示（Hide/Show）
```vue
<!-- 只在 lg+ 顯示側邊欄 -->
<div class="lg:w-80">...</div>

<!-- 只在 md+ 隱藏，mobile 顯示 -->
<nav class="md:hidden">...</nav>

<!-- 只在 md+ 顯示 -->
<div class="hidden md:block">...</div>
```

#### 模式 2：網格列數變化
```vue
<!-- 手機：1列，平板：2列，桌面：3列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- 卡片 -->
</div>
```

**範例位置**：
- `SubjectLectures.vue`（行 77）：`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- `StatisticsPanel.vue`：`grid-cols-1 md:grid-cols-2 lg:grid-cols-5`
- `HomePage.vue`：`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

#### 模式 3：佈局切換（堆疊 vs 並排）
```vue
<!-- 手機：垂直堆疊，桌面：水平並排 -->
<div class="flex flex-col md:flex-row gap-8">
  <div class="flex-1">主內容</div>
  <div class="lg:w-80">側邊欄</div>
</div>
```

**範例位置**：
- `ResourceDetail.vue`（行 169）：主內容區 + 右側欄

#### 模式 4：尺寸和間距調整
```vue
<!-- 文本大小 -->
<h1 class="text-base md:text-xl md:text-3xl">標題</h1>

<!-- 邊距調整 -->
<div class="p-5 md:p-7 lg:p-8 mb-5 md:mb-7 lg:mb-8">
  內容
</div>

<!-- 圖標大小 -->
<svg class="w-5 h-5 md:w-6 md:h-6">...</svg>
```

### 2.3 手機版特殊優化

#### 觸摸尺寸標準
```javascript
// tailwind.config.js
minHeight: {
  'touch': '44px',           // iOS 標準
  'touch-comfortable': '48px', // Android 標準
  'touch-large': '56px'      // 舒適尺寸
}
```

**使用**：`min-h-touch`（確保所有互動元素達 44px）

#### 邊緣導航系統（INC-024/025）

位置：`LectureDetail.vue`

**手機版邊緣導航**：
```javascript
// 邏輯流程
1. 用戶在屏幕邊緣輕觸（< 200ms）
2. 系統檢測位置（10% 區域）
3. 顯示邊緣按鈕（動畫滑入）
4. 2.5 秒後自動隱藏
5. 或者滾動/點擊中間隱藏

// 響應式顯示
md:hidden        // 手機專用
mobile-edge-button  // 寬度 40px（優化邊緣點擊）
animate-slide-in-*  // 平滑動畫
```

**桌面版邊緣導航**：
```vue
<!-- 隱藏 md 以下，hover 觸發顯示 -->
<div class="hidden md:block edge-nav-container">
  <!-- 透明觸發區域 -->
  <div class="edge-trigger"></div>
  <!-- 邊緣按鈕 -->
  <button class="edge-nav-button">...</button>
</div>

<!-- CSS 實現 hover 邏輯 -->
.edge-nav-container:has(.edge-trigger:hover) .edge-nav-button {
  opacity: 1;
}
```

---

## 3. 導航組件實現分析

### 3.1 麵包屑導航

**位置**：`LectureDetail.vue`（行 549-567）

**實現方式**：
```vue
<nav class="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap">
  <template v-for="(crumb, index) in breadcrumbs" :key="index">
    <router-link v-if="crumb.clickable && crumb.path" :to="crumb.path">
      {{ crumb.text }}
    </router-link>
    <span v-else>{{ crumb.text }}</span>
    <span v-if="index < breadcrumbs.length - 1">/</span>
  </template>
</nav>
```

**特性**：
- 使用 `<template>` 迴圈避免多餘 DOM 包裝
- 條件式路由連結或純文本
- 分隔符邏輯（最後項目無分隔符）
- 響應式換行（`flex-wrap`）

### 3.2 返回按鈕

**模式**：
```vue
<!-- 簡單返回按鈕 -->
<button @click="goBack" class="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
  <svg class="w-5 h-5">...</svg>
  返回資源列表
</button>
```

**位置範例**：
- `ResourceDetail.vue`（行 174-179）
- `ResourceSubjects.vue`（行 72-77）
- `ResourceCenter.vue`（行 61-66）

### 3.3 前後翻頁按鈕（INC-023）

**位置**：`LectureDetail.vue`

**支持方式**：
1. **鍵盤快捷鍵**：← → 箭頭鍵
2. **邊緣導航**：手機邊緣輕觸，桌面邊緣 hover
3. **底部按鈕**：返回列表時的圓形按鈕

**狀態管理**：
```javascript
// 計算按鈕是否可用
canGoPrevious = 當前索引 > 0
canGoNext = 當前索引 < 總數 - 1

// 按鈕樣式（禁用狀態）
disabled: !canGoPrevious
class: canGoPrevious ? 'active' : 'disabled'
```

---

## 4. UI 組件庫分析

### 4.1 當前技術棧

**實際使用的庫**：
```json
{
  "@heroicons/vue": "^2.2.0",        // 圖標庫（唯一外部 UI 庫）
  "tailwindcss": "^4.1.16",          // Tailwind CSS
  "vue": "^3.5.22",                  // Vue 3
  "vue-router": "^4.6.3",            // 路由
  "pinia": "^3.0.4"                  // 狀態管理
}
```

**沒有使用**：
- ❌ Headless UI
- ❌ Radix UI
- ❌ Vuetify
- ❌ Element Plus
- ❌ 自定義 Drawer/Sheet 組件

### 4.2 Heroicons 使用

**導入方式**：
```javascript
import { ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline'
```

**使用位置**：
- `LectureDetail.vue`（導航箭頭）
- `QuestionCard.vue`（導航和反饋圖標）

**特點**：
- 24x24 outline 風格
- 支援色彩和尺寸定制（class 綁定）

### 4.3 Tailwind CSS 定制

**自定義擴展**（`tailwind.config.js`）：

| 類別 | 定制項目 |
|------|--------|
| 顏色 | primary, secondary, accent, warning |
| 尺寸 | minHeight/minWidth touch*, fontSize 7 級 |
| 邊距 | 8 個自定義單位（4, 8, 12, 16, 20, 24, 32, 40 等） |
| 邊框半徑 | sm, md, lg, xl, 2xl, full |
| 陰影 | sm, md, lg, xl |
| 過渡 | fast, normal, slow |

---

## 5. 可複用的組件和模式

### 5.1 側邊欄模式

**通用側邊欄組件模板**：
```vue
<script setup>
const props = defineProps({
  title: String,
  width: { type: String, default: 'lg:w-80' },
  maxHeight: { type: String, default: 'max-h-96' }
})
</script>

<template>
  <div v-if="$slots.default" :class="width">
    <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      <h3 class="text-lg font-bold text-gray-900 mb-4">
        {{ title }}
      </h3>
      <div :class="`space-y-3 ${maxHeight} overflow-y-auto`">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
```

**使用場景**：
- 相關資源列表
- 側邊欄菜單
- 快捷導航
- 濾選面板

### 5.2 導航集合模式

**桌面 vs 手機不同佈局**：
```vue
<!-- 桌面：水平 -->
<div class="hidden md:flex md:items-center md:gap-3">
  <!-- 按鈕群組 -->
</div>

<!-- 手機：垂直堆疊 -->
<div class="flex flex-col gap-3 md:hidden">
  <!-- 按鈕群組 -->
</div>
```

**位置**：`LectureDetail.vue`（行 651-847）

### 5.3 卡片網格模式

**標準三級響應式網格**：
```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
    <!-- 卡片內容 -->
  </div>
</div>
```

**使用位置**：
- 講義列表（SubjectLectures.vue）
- 科目選擇（ResourceSubjects.vue）
- 資源類型（ResourceTypes.vue）
- 首頁卡片（HomePage.vue）

### 5.4 邊緣觸發模式

**手機邊緣感應**：
```javascript
const handleTouchEnd = (e) => {
  const touchX = e.touches[0].clientX
  const screenWidth = window.innerWidth
  const leftEdgeThreshold = screenWidth * 0.1
  const rightEdgeThreshold = screenWidth * 0.9
  
  const isLeftEdge = touchX < leftEdgeThreshold
  const isRightEdge = touchX > rightEdgeThreshold
  
  if ((isLeftEdge || isRightEdge) && isLightTap()) {
    showEdgeButtons()
  }
}
```

**桌面懸停觸發**：
```css
.container:has(.trigger:hover) .button {
  opacity: 1;
}
```

---

## 6. 最佳實踐和設計模式

### 6.1 響應式設計策略

1. **Mobile First**：先設計手機版，然後用 `md:`, `lg:` 覆蓋桌面
2. **隱藏 vs 更改**：優先隱藏（`hidden md:block`）而非重新排列
3. **網格優先**：使用網格系統實現響應式佈局
4. **觸摸友好**：所有互動元素 >= 44px

### 6.2 性能優化

**表格滾動優化**（INC-025）：
```javascript
const wrapTables = () => {
  const tables = document.querySelectorAll(".markdown-content table")
  tables.forEach(table => {
    const wrapper = document.createElement("div")
    wrapper.className = "table-wrapper overflow-x-auto"
    table.parentNode?.insertBefore(wrapper, table)
    wrapper.appendChild(table)
  })
}
```

**按需渲染**：
```vue
<div v-if="relatedResources.length > 0">
  <!-- 只有有內容時才渲染 -->
</div>
```

### 6.3 可訪問性（A11y）

```vue
<!-- 語義化 HTML -->
<nav class="...">...</nav>
<article class="...">...</article>

<!-- 標籤和 ARIA -->
:aria-label="'上一個講義'"
:title="'上一個講義 (←)'"

<!-- 按鍵盤導航 -->
@keydown.arrow-left="navigatePrevious"
@keydown.arrow-right="navigateNext"
```

### 6.4 動畫和過渡

**標準過渡**：
```vue
class="transition-all duration-300"
class="hover:shadow-xl hover:border-primary-500 transition-all duration-300"

<!-- 或使用自定義 -->
class="transition-opacity duration-300"
```

**自定義動畫**：
```css
@keyframes slide-in-left {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s ease-out;
}
```

---

## 7. 現有組件清單

| 組件 | 位置 | 用途 | 響應式特性 |
|------|------|------|----------|
| MobileNavigation | `/components/` | 底部導航 | `md:hidden` |
| QuestionCard | `/components/` | 題目卡片 | 多級響應式尺寸 |
| StatisticsPanel | `/components/` | 統計面板 | 網格 1-2-5 |
| ResourceCard | `/components/` | 資源卡片 | 基本卡片 |
| WrongQuestionsPanel | `/components/` | 錯題面板 | 可滾動列表 |
| LectureDetail | `/views/` | 講義詳情 | 邊緣導航系統 |
| ResourceDetail | `/views/` | 資源詳情 | 側邊欄（lg+） |

---

## 8. 實現建議

### 8.1 新建側邊欄組件

創建 `BaseSidebar.vue`：
```vue
<template>
  <div :class="['lg:w-80', responsiveClass]">
    <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      <h3 class="text-lg font-bold text-gray-900 mb-4">
        {{ title }}
      </h3>
      <div :class="`space-y-3 overflow-y-auto`" :style="{ maxHeight }">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
```

### 8.2 新建導航組件

創建 `ResponsiveNavigation.vue`：
```vue
<!-- 自動根據屏幕尺寸調整佈局 -->
<template>
  <div class="hidden md:flex md:items-center md:gap-3">
    <slot name="desktop"></slot>
  </div>
  <div class="flex flex-col gap-3 md:hidden">
    <slot name="mobile"></slot>
  </div>
</template>
```

### 8.3 重用邊緣導航系統

在其他頁面複用 INC-024/025 邏輯實現邊緣導航。

---

## 9. 總結

### 主要發現

1. **無第三方 UI 庫**：完全依賴 Tailwind CSS 和原生 Vue 實現
2. **成熟的響應式模式**：已建立明確的 md:, lg: 使用規範
3. **側邊欄實現簡潔**：使用 sticky + 寬度限制的經典模式
4. **邊緣導航創新**：INC-024/025 提供了優秀的手機端導航解決方案
5. **組件複用性高**：卡片、網格、按鈕模式高度規範化

### 推薦方向

- 從 ResourceDetail 的側邊欄模式提取通用組件
- 從 LectureDetail 的邊緣導航提取可複用邏輯
- 標準化網格響應式規則（1-2-3 或 1-2-5）
- 建立響應式導航組件庫

---

**報告日期**：2025-11-13  
**分析範圍**：QuizForge-AI 主要視圖和組件  
**技術棧**：Vue 3 + Tailwind CSS 4.1 + Vue Router 4.6
