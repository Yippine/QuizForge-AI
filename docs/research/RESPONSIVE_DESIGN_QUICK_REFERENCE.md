# QuizForge-AI 響應式設計快速參考指南

## 斷點速查表

| 設備 | 斷點 | 寬度範圍 | 使用場景 |
|------|------|--------|---------|
| 手機 | 無 | 0-639px | `default` 樣式 |
| 平板 | `sm:` | 640px+ | 小平板 |
| 平板 | `md:` | 768px+ | 標準平板/小筆電 |
| 桌面 | `lg:` | 1024px+ | 標準桌面 |
| 寬屏 | `xl:` | 1280px+ | 超寬桌面 |

## 常用響應式模式

### 隱藏/顯示
```vue
<!-- 只在 lg+ 顯示 -->
<div class="lg:block hidden">...</div>

<!-- 只在 md+ 隱藏，mobile 顯示 -->
<div class="md:hidden">...</div>

<!-- 只在 md- 隱藏，md+ 顯示 -->
<div class="hidden md:block">...</div>
```

### 網格列數變化
```vue
<!-- 1-2-3 網格（最常用） -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- 1-2-4 網格 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

<!-- 1-2-5 網格（統計卡片） -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
```

### 佈局切換
```vue
<!-- 手機垂直，桌面水平 -->
<div class="flex flex-col md:flex-row gap-8">
  <div class="flex-1">主內容</div>
  <div class="lg:w-80">側邊欄</div>
</div>
```

### 尺寸調整
```vue
<!-- 字體大小 -->
<h1 class="text-base md:text-xl lg:text-3xl">標題</h1>

<!-- 間距 -->
<div class="p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8">

<!-- 圖標 -->
<svg class="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6">
```

## 組件模式

### 側邊欄模式
```vue
<!-- 用於相關資源、側菜單等 -->
<div class="lg:w-80">
  <div class="sticky top-4 bg-white rounded-xl shadow-lg p-6">
    <h3>{{ title }}</h3>
    <div class="max-h-96 overflow-y-auto space-y-3">
      <!-- 內容 -->
    </div>
  </div>
</div>
```

### 底部導航（手機）
```vue
<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl z-50">
  <div class="grid grid-cols-4 gap-3 p-4">
    <!-- 按鈕 -->
  </div>
</nav>
```

### 響應式按鈕組
```vue
<!-- 桌面水平 -->
<div class="hidden md:flex gap-3 items-center">
  <!-- 按鈕 -->
</div>

<!-- 手機垂直 -->
<div class="flex flex-col gap-3 md:hidden">
  <!-- 按鈕 -->
</div>
```

## Tailwind 類速查

### 尺寸
```
w-* (寬度): w-4, w-6, w-8, w-12, w-16, w-80, w-96, w-full
h-* (高度): h-4, h-6, h-12, h-16, h-24, h-96, h-full
max-h-* : max-h-96, max-h-screen
```

### 邊距和間距
```
p-* (padding)   : p-4, p-6, p-8
m-* (margin)    : m-4, m-6, m-8
gap-* (flex/grid) : gap-3, gap-4, gap-6, gap-8
```

### 顯示
```
flex         : 彈性盒
grid         : 網格
hidden       : 隱藏
block        : 塊級
inline       : 行內
```

### 圓角
```
rounded-lg   : 12px
rounded-xl   : 16px
rounded-2xl  : 24px
rounded-full : 9999px
```

### 陰影
```
shadow-lg    : 較大陰影
shadow-xl    : 超大陰影
```

## 觸摸友好尺寸

```vue
<!-- 最小按鈕高度 44px (iOS 標準) -->
<button class="min-h-touch">...</button>

<!-- 或手動設置 -->
<button class="h-12 md:h-11">...</button>
```

## 邊緣導航系統

### 手機（md:hidden）
```javascript
// 檢測邊緣輕觸
const screenWidth = window.innerWidth
const leftEdge = screenWidth * 0.1
const rightEdge = screenWidth * 0.9

if (touchX < leftEdge) {
  // 顯示左邊按鈕
}
```

### 桌面（hidden md:block）
```css
/* Hover 觸發 */
.edge-nav-container:has(.edge-trigger:hover) .edge-nav-button {
  opacity: 1;
}
```

## 日常開發檢查清單

- [ ] 手機版 (< md) 版式
  - [ ] 導航是否垂直堆疊？
  - [ ] 按鈕是否全寬且 >= 44px 高？
  - [ ] 文本是否可讀（字大小適當）？
  - [ ] 側邊欄是否隱藏？

- [ ] 平板版 (md - lg)
  - [ ] 網格是 2 列嗎？
  - [ ] 間距是否均衡？
  - [ ] 按鈕排列是否合理？

- [ ] 桌面版 (lg+)
  - [ ] 側邊欄是否顯示？
  - [ ] 網格是 3 列（或預設）嗎？
  - [ ] 最大寬度是否有限（max-w-*）？

## 常見錯誤

❌ **不要**：
```vue
<!-- 直接指定固定寬度 -->
<div class="w-1024">...</div>

<!-- 混合響應式和固定大小 -->
<div class="md:p-8 p-6 lg:p-10">...</div>

<!-- 在 mobile-first 之前添加 lg: -->
<div class="lg:block md:hidden">... <!-- 混亂 -->
```

✅ **應該**：
```vue
<!-- 使用響應式容器 -->
<div class="max-w-7xl mx-auto">...</div>

<!-- 遵循 mobile-first -->
<div class="p-4 md:p-6 lg:p-8">...</div>

<!-- 清晰的隱藏/顯示 -->
<div class="hidden lg:block">...</div>
```

## 文件位置參考

| 目的 | 文件 | 行號 |
|------|------|------|
| 側邊欄實例 | `ResourceDetail.vue` | 239-260 |
| 底部導航 | `MobileNavigation.vue` | 34-92 |
| 麵包屑 | `LectureDetail.vue` | 549-567 |
| 邊緣導航 | `LectureDetail.vue` | 577-636 |
| Tailwind 配置 | `tailwind.config.js` | 1-123 |
| 響應式卡片 | `SubjectLectures.vue` | 77-100 |

## 快速複製片段

### 基本頁面結構
```vue
<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 麵包屑 -->
      
      <!-- 主內容 + 側邊欄 -->
      <div class="flex flex-col lg:flex-row gap-8">
        <div class="flex-1">
          <!-- 主內容 -->
        </div>
        
        <!-- 側邊欄 (lg+) -->
        <div class="lg:w-80">
          <!-- 側邊欄內容 -->
        </div>
      </div>
      
      <!-- 導航 -->
    </div>
  </div>
</template>
```

### 響應式卡片網格
```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div v-for="item in items" :key="item.id" 
       class="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
    <h3>{{ item.title }}</h3>
  </div>
</div>
```

### 回到頂部按鈕
```vue
<button @click="goBack" 
        class="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
  <svg class="w-5 h-5">← 返回</svg>
</button>
```

---

**最後更新**：2025-11-13  
**技術棧**：Vue 3 + Tailwind CSS 4.1 + Vue Router 4.6
