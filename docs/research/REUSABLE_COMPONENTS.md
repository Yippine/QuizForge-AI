# 可複用組件實現示例

## 1. BaseSidebar 組件

**文件**：`src/components/BaseSidebar.vue`

```vue
<script setup>
/**
 * BaseSidebar Component
 * Formula: BaseSidebar = StickySidebar + ResponsiveHiding + ScrollableContent
 * 
 * 特性：
 * - lg+ 屏幕顯示，mobile 隱藏
 * - 粘性定位跟隨滾動
 * - 內部可滾動內容
 * - 支援自定義寬度和高度
 */

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  width: {
    type: String,
    default: 'lg:w-80'  // 320px
  },
  maxHeight: {
    type: String,
    default: 'max-h-96'  // 384px
  },
  hideOnMobile: {
    type: Boolean,
    default: true
  }
})

const slots = defineSlots()
</script>

<template>
  <!-- 只有有內容時才渲染 -->
  <div v-if="$slots.default" :class="[width, hideOnMobile ? 'hidden lg:block' : '']">
    <!-- 粘性卡片容器 -->
    <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      <!-- 標題 -->
      <div class="flex items-center gap-2 mb-4">
        <h3 class="text-lg font-bold text-gray-900">{{ title }}</h3>
        <!-- 可選圖標插槽 -->
        <slot name="icon"></slot>
      </div>

      <!-- 可滾動內容區域 -->
      <div :class="`space-y-3 overflow-y-auto ${maxHeight}`">
        <!-- 默認插槽 -->
        <slot></slot>
      </div>

      <!-- 頁腳操作區（可選） -->
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
/* 自定義滾動條樣式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
```

**使用示例**：

```vue
<script setup>
import BaseSidebar from '@/components/BaseSidebar.vue'

const relatedItems = ref([...])
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8">
    <!-- 主內容 -->
    <div class="flex-1">
      <!-- 主內容區 -->
    </div>

    <!-- 側邊欄 -->
    <BaseSidebar title="相關資源">
      <template #icon>
        <svg class="w-5 h-5 text-primary-600">...</svg>
      </template>

      <div v-for="item in relatedItems" :key="item.id" 
           @click="selectItem(item.id)"
           class="p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-all">
        <div class="text-sm font-medium text-gray-900">{{ item.title }}</div>
      </div>
    </BaseSidebar>
  </div>
</template>
```

---

## 2. ResponsiveNavigation 組件

**文件**：`src/components/ResponsiveNavigation.vue`

```vue
<script setup>
/**
 * ResponsiveNavigation Component
 * Formula: ResponsiveNavigation = DesktopLayout + MobileLayout + SlotBased
 * 
 * 在 md: 斷點時自動切換佈局
 * - Desktop (md+): 水平排列，圓形按鈕
 * - Mobile (<md): 垂直堆疊，全寬按鈕
 */

const props = defineProps({
  // 是否顯示邊界分隔符
  showDivider: {
    type: Boolean,
    default: true
  },
  // 間距大小
  gap: {
    type: String,
    default: 'gap-3'  // gap-3, gap-4 等
  },
  // 是否左對齐（默認中心）
  align: {
    type: String,
    enum: ['start', 'center', 'end'],
    default: 'center'
  }
})

const slots = defineSlots()

// 計算對齐 class
const alignClass = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end'
}
</script>

<template>
  <div>
    <!-- 桌面版本: 水平佈局 (md+) -->
    <div class="hidden md:flex" :class="[props.gap, `${alignClass[props.align]}`]">
      <slot name="desktop">
        <!-- 如果沒有命名插槽，使用默認插槽 -->
        <slot></slot>
      </slot>
    </div>

    <!-- 分隔符（可選） -->
    <div v-if="showDivider" class="hidden md:block my-4 border-t border-gray-200"></div>

    <!-- 手機版本: 垂直堆疊 (< md) -->
    <div class="flex flex-col md:hidden" :class="[props.gap]">
      <slot name="mobile">
        <!-- 如果沒有命名插槽，使用默認插槽 -->
        <slot></slot>
      </slot>
    </div>
  </div>
</template>

<style scoped>
/* 按需添加過渡效果 */
.flex {
  transition: all 300ms ease;
}
</style>
```

**使用示例**：

```vue
<script setup>
import ResponsiveNavigation from '@/components/ResponsiveNavigation.vue'

const navigatePrevious = () => { /* ... */ }
const navigateNext = () => { /* ... */ }
</script>

<template>
  <ResponsiveNavigation gap="gap-3" align="center">
    <template #desktop>
      <!-- 桌面: 圓形按鈕，水平排列 -->
      <button @click="navigatePrevious" 
              class="w-11 h-11 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
        <ChevronLeftIcon class="w-6 h-6" />
      </button>
      
      <button class="px-6 py-3 rounded-xl">返回</button>
      
      <button @click="navigateNext" 
              class="w-11 h-11 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
        <ChevronRightIcon class="w-6 h-6" />
      </button>
    </template>

    <template #mobile>
      <!-- 手機: 全寬按鈕，垂直堆疊 -->
      <button class="w-full px-6 py-3 rounded-xl">返回</button>
      
      <div class="flex gap-3">
        <button @click="navigatePrevious" class="flex-1 h-12 rounded-full">
          <ChevronLeftIcon class="w-6 h-6" />
        </button>
        <button @click="navigateNext" class="flex-1 h-12 rounded-full">
          <ChevronRightIcon class="w-6 h-6" />
        </button>
      </div>
    </template>
  </ResponsiveNavigation>
</template>
```

---

## 3. ResponsiveGrid 組件

**文件**：`src/components/ResponsiveGrid.vue`

```vue
<script setup>
/**
 * ResponsiveGrid Component
 * Formula: ResponsiveGrid = ResponsiveColumns + GapManagement + SlotBased
 * 
 * 支援多種預設響應式網格
 * - 1-2-3: 手機 1 列，平板 2 列，桌面 3 列
 * - 1-2-4: 手機 1 列，平板 2 列，桌面 4 列
 * - 1-2-5: 手機 1 列，平板 2 列，桌面 5 列
 */

const props = defineProps({
  // 預設網格類型
  variant: {
    type: String,
    enum: ['1-2-3', '1-2-4', '1-2-5', 'custom'],
    default: '1-2-3'
  },
  // 自定義響應式 class（variant=custom 時使用）
  customClass: {
    type: String,
    default: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  },
  // 間距大小
  gap: {
    type: String,
    default: 'gap-6'
  }
})

// 預設類組合
const variantMap = {
  '1-2-3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '1-2-4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  '1-2-5': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
}

// 計算最終 grid class
const gridClass = computed(() => {
  const cols = props.variant === 'custom' ? props.customClass : variantMap[props.variant]
  return `grid ${cols} ${props.gap}`
})
</script>

<template>
  <div :class="gridClass">
    <slot></slot>
  </div>
</template>
```

**使用示例**：

```vue
<script setup>
import ResponsiveGrid from '@/components/ResponsiveGrid.vue'

const items = ref([...])
</script>

<template>
  <!-- 1-2-3 網格 -->
  <ResponsiveGrid>
    <div v-for="item in items" :key="item.id" 
         class="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
      <h3>{{ item.title }}</h3>
    </div>
  </ResponsiveGrid>

  <!-- 1-2-5 網格（用於統計卡片） -->
  <ResponsiveGrid variant="1-2-5">
    <div v-for="stat in stats" :key="stat.id" 
         class="bg-white rounded-xl shadow p-4">
      <div class="text-2xl font-bold">{{ stat.value }}</div>
    </div>
  </ResponsiveGrid>

  <!-- 自定義網格 -->
  <ResponsiveGrid variant="custom" customClass="grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
    <div>自定義網格</div>
  </ResponsiveGrid>
</template>
```

---

## 4. EdgeNavigationButton 組件

**文件**：`src/components/EdgeNavigationButton.vue`

```vue
<script setup>
/**
 * EdgeNavigationButton Component
 * Formula: EdgeNavigationButton = TouchDetection + HoverDetection + ResponseiveDisplay
 * 
 * INC-024/025 的可複用實現
 * - 手機: 邊緣輕觸顯示，自動隱藏
 * - 桌面: hover 觸發，持續顯示
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 按鈕位置 ('left' | 'right')
  direction: {
    type: String,
    enum: ['left', 'right'],
    required: true
  },
  // 是否顯示（受父組件控制）
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

// 邊緣觸發區域
const triggerArea = ref(null)
const isHovering = ref(false)

// 計算最終顯示狀態
const isVisible = computed(() => {
  return props.show || isHovering.value
})

// 邊緣位置類
const positionClass = computed(() => {
  return props.direction === 'left' 
    ? 'left-0 rounded-r-lg' 
    : 'right-0 rounded-l-lg'
})

// 動畫類
const animationClass = computed(() => {
  return props.direction === 'left'
    ? 'animate-slide-in-left'
    : 'animate-slide-in-right'
})

onMounted(() => {
  if (triggerArea.value) {
    triggerArea.value.addEventListener('mouseenter', () => {
      isHovering.value = true
    })
    triggerArea.value.addEventListener('mouseleave', () => {
      isHovering.value = false
    })
  }
})
</script>

<template>
  <div>
    <!-- 隱形觸發區域（桌面版 hover） -->
    <div ref="triggerArea" 
         :class="[positionClass, 'fixed top-0 h-full w-20 z-10 hidden md:block']"
         style="cursor: pointer;">
    </div>

    <!-- 邊緣按鈕 -->
    <button v-show="isVisible"
            @click="emit('click')"
            :class="[positionClass, animationClass]"
            class="fixed top-1/2 -translate-y-1/2 h-24 w-12 md:w-16 bg-gray-800/70 flex items-center justify-center transition-opacity duration-300 z-20">
      <slot>
        <!-- 默認：使用傳入的圖標 -->
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="direction === 'left'" 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M15 19l-7-7 7-7" />
          <path v-else 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M9 5l7 7-7 7" />
        </svg>
      </slot>
    </button>
  </div>
</template>

<style scoped>
@keyframes slide-in-left {
  from {
    transform: translateX(-100%) translateY(-50%);
    opacity: 0;
  }
  to {
    transform: translateX(0) translateY(-50%);
    opacity: 1;
  }
}

@keyframes slide-in-right {
  from {
    transform: translateX(100%) translateY(-50%);
    opacity: 0;
  }
  to {
    transform: translateX(0) translateY(-50%);
    opacity: 1;
  }
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s ease-out;
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
</style>
```

**使用示例**：

```vue
<script setup>
import EdgeNavigationButton from '@/components/EdgeNavigationButton.vue'

const showLeftButton = ref(false)
const showRightButton = ref(false)

const handleTouchEnd = (e) => {
  // 檢測邊緣並設置狀態
  // ...
}

const handleNavigate = (direction) => {
  if (direction === 'left') navigatePrevious()
  else navigateNext()
}
</script>

<template>
  <div @touchend="handleTouchEnd">
    <EdgeNavigationButton 
      direction="left" 
      :show="showLeftButton"
      @click="handleNavigate('left')" />
    
    <EdgeNavigationButton 
      direction="right" 
      :show="showRightButton"
      @click="handleNavigate('right')" />

    <!-- 頁面內容 -->
  </div>
</template>
```

---

## 5. Breadcrumb 組件

**文件**：`src/components/Breadcrumb.vue`

```vue
<script setup>
/**
 * Breadcrumb Component
 * Formula: Breadcrumb = Items + Links + Separators + Responsive
 */

const props = defineProps({
  // 麵包屑項目
  items: {
    type: Array,
    required: true,
    // 格式: [{ text: '主頁', path: '/', clickable: true }, ...]
  },
  // 分隔符
  separator: {
    type: String,
    default: '/'
  }
})

const slots = defineSlots()
</script>

<template>
  <nav class="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap">
    <template v-for="(item, index) in items" :key="index">
      <!-- 鏈接項 -->
      <router-link v-if="item.clickable && item.path" 
                   :to="item.path"
                   class="hover:text-primary-600 transition-colors">
        {{ item.text }}
      </router-link>

      <!-- 非鏈接項（當前頁面） -->
      <span v-else class="text-gray-800 font-medium">{{ item.text }}</span>

      <!-- 分隔符 -->
      <span v-if="index < items.length - 1" class="text-gray-400">
        {{ separator }}
      </span>
    </template>
  </nav>
</template>
```

**使用示例**：

```vue
<script setup>
import Breadcrumb from '@/components/Breadcrumb.vue'

const breadcrumbItems = computed(() => [
  { text: '首頁', path: '/', clickable: true },
  { text: '資源中心', path: '/resources', clickable: true },
  { text: `${certification.name}`, path: `/resources/${certId}`, clickable: true },
  { text: `${subject.name}`, path: `/resources/${certId}/${subjectId}`, clickable: true },
  { text: resourceItem.title, clickable: false }
])
</script>

<template>
  <Breadcrumb :items="breadcrumbItems" separator="/" />
</template>
```

---

## 使用這些組件的完整示例

```vue
<script setup>
import BaseSidebar from '@/components/BaseSidebar.vue'
import ResponsiveNavigation from '@/components/ResponsiveNavigation.vue'
import ResponsiveGrid from '@/components/ResponsiveGrid.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'

const breadcrumbs = [...] // 麵包屑
const mainContent = [...] // 主內容
const sidebarItems = [...] // 側邊欄內容
const navigationActions = [...] // 導航操作
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- 麵包屑導航 -->
      <Breadcrumb :items="breadcrumbs" />

      <!-- 主內容 + 側邊欄 -->
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- 主內容區 -->
        <div class="flex-1">
          <!-- 響應式網格 -->
          <ResponsiveGrid variant="1-2-3" gap="gap-6">
            <div v-for="item in mainContent" :key="item.id" class="card">
              {{ item.title }}
            </div>
          </ResponsiveGrid>
        </div>

        <!-- 側邊欄 -->
        <BaseSidebar title="相關項目" width="lg:w-80">
          <div v-for="item in sidebarItems" :key="item.id" class="sidebar-item">
            {{ item.name }}
          </div>
        </BaseSidebar>
      </div>

      <!-- 響應式導航 -->
      <ResponsiveNavigation gap="gap-3" class="mt-12">
        <button v-for="action in navigationActions" 
                :key="action.id"
                @click="action.handler"
                class="btn">
          {{ action.label }}
        </button>
      </ResponsiveNavigation>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all;
}

.sidebar-item {
  @apply p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-all;
}

.btn {
  @apply px-6 py-3 bg-white rounded-xl shadow hover:shadow-xl transition-all;
}
</style>
```

---

## 總結

這些可複用組件提供了：

1. **BaseSidebar** - 通用側邊欄，自動響應式隱藏
2. **ResponsiveNavigation** - 自動切換桌面/手機佈局的導航
3. **ResponsiveGrid** - 預設響應式網格（1-2-3, 1-2-4, 1-2-5）
4. **EdgeNavigationButton** - 邊緣導航按鈕，支持手機邊緣感應和桌面 hover
5. **Breadcrumb** - 麵包屑導航，支持條件式連結

所有組件都：
- ✅ 完全響應式（md:, lg: 斷點）
- ✅ 支援 Tailwind CSS 定制
- ✅ 提供清晰的 Props 接口
- ✅ 支援插槽擴展
- ✅ 遵循專案設計規範
