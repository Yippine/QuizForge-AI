<script setup>
/**
 * TableOfContents Component
 * Formula: TableOfContents = HeadingExtractor + AnchorGenerator + IntersectionTracker + NavigationUI
 * Responsibility: 章節目錄導航組件 (INC-034)
 *
 * Features:
 * - 自動提取 h2/h3 標題
 * - 生成錨點 ID
 * - IntersectionObserver 追蹤當前章節
 * - 桌面版固定側邊欄
 * - 手機版浮動按鈕 + Bottom Sheet
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  containerSelector: {
    type: String,
    default: '.markdown-content'
  }
})

const emit = defineEmits(['headings', 'navigate'])

/**
 * State
 */
const headings = ref([])
const activeId = ref(null)
const isBottomSheetOpen = ref(false)
let observer = null

/**
 * Computed
 */
const hasHeadings = computed(() => headings.value.length > 0)

/**
 * HeadingExtractor
 * Formula: RegexPattern(h2|h3) + DOMQuery -> HeadingList
 * Output: [{text: string, level: number, id: string}]
 */
const extractHeadings = (content) => {
  const regex = /^#{2,3}\s+(.+)$/gm
  const extracted = []
  const idCounts = {}
  let match

  while ((match = regex.exec(content)) !== null) {
    const text = match[1].trim()
    const level = match[0].startsWith('###') ? 3 : 2
    let id = generateAnchorId(text)

    // 確保唯一性 (重複時加數字後綴)
    if (idCounts[id]) {
      idCounts[id]++
      id = `${id}-${idCounts[id]}`
    } else {
      idCounts[id] = 1
    }

    extracted.push({ text, level, id })
  }

  return extracted
}

/**
 * AnchorGenerator
 * Formula: slugify(text) -> anchor_id
 * Steps: trim -> encodeURIComponent -> replace spaces -> toLowerCase
 */
const generateAnchorId = (text) => {
  return encodeURIComponent(
    text
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
  )
}

/**
 * Add Anchor IDs to DOM Elements
 * Formula: QueryHeadings -> SetIdAttribute
 */
const addAnchorIds = () => {
  const container = document.querySelector(props.containerSelector)
  if (!container) return

  const domHeadings = container.querySelectorAll('h2, h3')
  const idCounts = {}

  domHeadings.forEach((el) => {
    const text = el.textContent.trim()
    let id = generateAnchorId(text)

    // 確保唯一性
    if (idCounts[id]) {
      idCounts[id]++
      id = `${id}-${idCounts[id]}`
    } else {
      idCounts[id] = 1
    }

    el.id = id
  })
}

/**
 * IntersectionTracker
 * Formula: IntersectionObserver(headings, options) -> activeHeadingId
 */
const setupIntersectionObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  const container = document.querySelector(props.containerSelector)
  if (!container) return

  const options = {
    threshold: 0,
    rootMargin: '-20% 0px -60% 0px'
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeId.value = entry.target.id
        // 同步 URL hash (不觸發滾動)
        if (entry.target.id) {
          history.replaceState(null, '', `#${entry.target.id}`)
        }
      }
    })
  }, options)

  // 觀察所有標題元素
  headings.value.forEach((heading) => {
    const el = document.getElementById(heading.id)
    if (el) {
      observer.observe(el)
    }
  })
}

/**
 * NavigationAction
 * Formula: clickHeading -> scrollIntoView -> updateHash
 */
const scrollToHeading = (id) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })

    // 更新 URL hash
    history.replaceState(null, '', `#${id}`)
    activeId.value = id

    // 關閉 Bottom Sheet (手機版)
    isBottomSheetOpen.value = false

    // Emit navigate event
    emit('navigate', id)
  }
}

/**
 * Toggle Bottom Sheet (手機版)
 */
const toggleBottomSheet = () => {
  isBottomSheetOpen.value = !isBottomSheetOpen.value
}

/**
 * Close Bottom Sheet
 */
const closeBottomSheet = () => {
  isBottomSheetOpen.value = false
}

/**
 * Initialize TOC
 */
const initializeTOC = async () => {
  if (!props.content) return

  // 提取標題
  headings.value = extractHeadings(props.content)

  // Emit headings event
  emit('headings', headings.value)

  // 等待 DOM 更新後添加錨點 ID 和設置 Observer
  await nextTick()

  // 延遲一小段時間確保 DOM 完全渲染
  setTimeout(() => {
    addAnchorIds()
    setupIntersectionObserver()

    // 如果 URL 有 hash，滾動到對應位置
    if (window.location.hash) {
      const id = decodeURIComponent(window.location.hash.slice(1))
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          activeId.value = id
        }, 100)
      }
    }
  }, 100)
}

/**
 * Watch content changes
 */
watch(() => props.content, () => {
  initializeTOC()
}, { immediate: false })

/**
 * Lifecycle
 */
onMounted(() => {
  initializeTOC()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <!-- Desktop Sidebar (lg:block) -->
  <aside
    v-if="hasHeadings"
    class="hidden lg:block lg:w-64 flex-shrink-0"
  >
    <nav class="sticky top-4 bg-white rounded-xl shadow-lg p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg
          class="w-4 h-4 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        目錄
      </h3>
      <ul class="space-y-1">
        <li
          v-for="heading in headings"
          :key="heading.id"
        >
          <button
            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200"
            :class="[
              heading.level === 3 ? 'pl-6' : '',
              activeId === heading.id
                ? 'text-primary-600 bg-primary-50 border-l-2 border-primary-600 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="scrollToHeading(heading.id)"
          >
            {{ heading.text }}
          </button>
        </li>
      </ul>
    </nav>
  </aside>

  <!-- Mobile Floating Button + Bottom Sheet -->
  <div
    v-if="hasHeadings"
    class="lg:hidden"
  >
    <!-- Floating Button -->
    <button
      class="fixed bottom-20 right-4 z-40 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
      aria-label="開啟目錄"
      @click="toggleBottomSheet"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 10h16M4 14h16M4 18h16"
        />
      </svg>
    </button>

    <!-- Bottom Sheet Backdrop -->
    <Transition name="fade">
      <div
        v-if="isBottomSheetOpen"
        class="fixed inset-0 bg-black/50 z-40"
        @click="closeBottomSheet"
      ></div>
    </Transition>

    <!-- Bottom Sheet -->
    <Transition name="slide-up">
      <div
        v-if="isBottomSheetOpen"
        class="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[60vh] flex flex-col"
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="px-6 pb-3 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg
              class="w-5 h-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            目錄
          </h3>
          <button
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="關閉目錄"
            @click="closeBottomSheet"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto flex-1 p-4">
          <ul class="space-y-1">
            <li
              v-for="heading in headings"
              :key="heading.id"
            >
              <button
                class="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200"
                :class="[
                  heading.level === 3 ? 'pl-8' : '',
                  activeId === heading.id
                    ? 'text-primary-600 bg-primary-50 border-l-2 border-primary-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                ]"
                @click="scrollToHeading(heading.id)"
              >
                {{ heading.text }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition for bottom sheet */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Scrollbar styling for desktop sidebar */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}
</style>
