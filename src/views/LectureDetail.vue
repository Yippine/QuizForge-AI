<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import MarkdownIt from "markdown-it";
import { katex } from "@mdit/plugin-katex";
import "katex/dist/katex.min.css";

/**
 * LectureDetail Component
 * Formula: LectureDetail = MarkdownRenderer + Navigation + KeyboardShortcuts + ResponsiveLayout + MobileTouchNav
 * INC-022: Security vulnerability resolution with @mdit/plugin-katex
 * INC-023: Enhanced navigation with prev/next buttons and keyboard shortcuts
 * INC-024: Mobile touch navigation with smart edge detection
 *
 * Security Note (INC-022): npm Security Vulnerability Resolution
 *
 * Previous Issue: markdown-it-katex had a High severity XSS vulnerability (GHSA-5ff8-jcf9-fw62)
 *
 * Resolution (2025-11-09):
 * - Migrated from markdown-it-katex to @mdit/plugin-katex (v0.23.1)
 * - Actively maintained package with no known vulnerabilities
 * - Full feature compatibility maintained
 * - npm audit: 0 vulnerabilities
 *
 * Package Details:
 * - @mdit/plugin-katex: Modern, actively maintained KaTeX plugin
 * - Last updated: 2 months ago (as of 2025-11)
 * - Part of the mdit-plugins ecosystem
 */

const router = useRouter();
const route = useRoute();

// INC-024: Mobile Touch Navigation State Layer
// Formula: StateLayer = VueReactive({8 state variables for touch interaction})
const showLeftButton = ref(false);
const showRightButton = ref(false);
const showFirstTimeHint = ref(false);
const buttonHideTimer = ref(null);
const touchStartTime = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);
const isTouchMove = ref(false);

// INC-023 FIX: 使用 computed 而非 ref，確保路由變化時自動更新
const subjectId = computed(() => route.params.subjectId);
const lectureId = computed(() => route.params.lectureId);
const markdownContent = ref("");
const renderedHTML = ref("");
const loading = ref(true);
const error = ref(null);
const lectureTitle = ref("");
const lectureFilesMap = ref({});

const subjectName = computed(() => {
  return subjectId.value === "L21"
    ? "Subject 1 - AI Application Planning"
    : "Subject 3 - AI Core Technology";
});

const breadcrumbs = computed(() => [
  { text: "Home", path: "/", clickable: true },
  { text: "Lectures", path: "/lectures", clickable: true },
  {
    text: subjectName.value,
    path: `/lectures/${subjectId.value}`,
    clickable: true,
  },
  { text: lectureTitle.value || "Loading...", path: "", clickable: false },
]);

/**
 * INC-023: Navigation Logic
 * Formula: NavigationState = CurrentIndex + TotalLectures + (CanPrevious | CanNext)
 */

// 計算當前講義在列表中的索引
const currentLectureIndex = computed(() => {
  const fileList = lectureFilesMap.value[subjectId.value] || [];
  return fileList.findIndex((item) => item.id === lectureId.value);
});

// 計算總講義數
const totalLectures = computed(() => {
  const fileList = lectureFilesMap.value[subjectId.value] || [];
  return fileList.length;
});

// 是否可以前往上一個講義
const canGoPrevious = computed(() => currentLectureIndex.value > 0);

// 是否可以前往下一個講義
const canGoNext = computed(() =>
  currentLectureIndex.value >= 0 &&
  currentLectureIndex.value < totalLectures.value - 1
);

// 獲取上一個講義的 ID
const previousLectureId = computed(() => {
  if (!canGoPrevious.value) return null;
  const fileList = lectureFilesMap.value[subjectId.value] || [];
  return fileList[currentLectureIndex.value - 1]?.id || null;
});

// 獲取下一個講義的 ID
const nextLectureId = computed(() => {
  if (!canGoNext.value) return null;
  const fileList = lectureFilesMap.value[subjectId.value] || [];
  return fileList[currentLectureIndex.value + 1]?.id || null;
});

/**
 * INC-023: Navigation Methods
 * Formula: Navigation = RouterPush(subjectId, lectureId) & StateReset
 */

// 前往上一個講義
const navigateToPrevious = () => {
  if (canGoPrevious.value && previousLectureId.value) {
    router.push(`/lectures/${subjectId.value}/${previousLectureId.value}`);
  }
};

// 前往下一個講義
const navigateToNext = () => {
  if (canGoNext.value && nextLectureId.value) {
    router.push(`/lectures/${subjectId.value}/${nextLectureId.value}`);
  }
};

/**
 * INC-023: Keyboard Shortcuts Handler
 * Formula: KeyboardHandler = (ArrowLeft -> Previous) | (ArrowRight -> Next) & SafetyCheck
 */
const handleKeyPress = (e) => {
  // 防止在輸入框、文字區域中觸發
  if (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA' ||
    e.target.isContentEditable
  ) {
    return;
  }

  // 處理左右箭頭鍵
  if (e.key === 'ArrowLeft') {
    e.preventDefault(); // 防止與瀏覽器預設行為衝突
    navigateToPrevious();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    navigateToNext();
  }
};

/**
 * INC-024: Mobile Touch Navigation Event Layer
 * Formula: EventLayer = TouchHandlers(start + move + end) + TimerManagement + ButtonHiding
 */

// 觸控開始：記錄時間和位置
const handleTouchStart = (e) => {
  touchStartTime.value = Date.now();
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
  isTouchMove.value = false;
};

// 觸控移動：標記為移動操作
const handleTouchMove = (e) => {
  const moveX = Math.abs(e.touches[0].clientX - touchStartX.value);
  const moveY = Math.abs(e.touches[0].clientY - touchStartY.value);
  if (moveX > 10 || moveY > 10) {
    isTouchMove.value = true;
  }
};

// 觸控結束：評估是否為輕觸並顯示按鈕
const handleTouchEnd = (e) => {
  const touchDuration = Date.now() - touchStartTime.value;
  const touchX = touchStartX.value;
  const screenWidth = window.innerWidth;
  const leftEdgeThreshold = screenWidth * 0.1;
  const rightEdgeThreshold = screenWidth * 0.9;

  // 長按不觸發 (> 500ms)，優先保留文字選取
  if (touchDuration > 500) {
    return;
  }

  // 輕觸判斷: < 200ms 且無移動
  if (touchDuration < 200 && !isTouchMove.value) {
    if (touchX < leftEdgeThreshold && canGoPrevious.value) {
      showLeftButton.value = true;
      startHideTimer();
    } else if (touchX > rightEdgeThreshold && canGoNext.value) {
      showRightButton.value = true;
      startHideTimer();
    }
  }
};

// 滾動時隱藏按鈕
const handleScroll = () => {
  hideButtons();
};

// 點擊中間區域隱藏按鈕
const handleMiddleAreaClick = (e) => {
  const clickX = e.clientX;
  const screenWidth = window.innerWidth;
  const leftEdgeThreshold = screenWidth * 0.1;
  const rightEdgeThreshold = screenWidth * 0.9;

  // 點擊中間 80% 區域時隱藏按鈕
  if (clickX > leftEdgeThreshold && clickX < rightEdgeThreshold) {
    hideButtons();
  }
};

// 啟動 2.5 秒自動隱藏計時器
const startHideTimer = () => {
  if (buttonHideTimer.value) {
    clearTimeout(buttonHideTimer.value);
  }
  buttonHideTimer.value = setTimeout(() => {
    hideButtons();
  }, 2500);
};

// 隱藏按鈕並清除計時器
const hideButtons = () => {
  if (buttonHideTimer.value) {
    clearTimeout(buttonHideTimer.value);
    buttonHideTimer.value = null;
  }
  showLeftButton.value = false;
  showRightButton.value = false;
};

// 按鈕點擊：導航並隱藏
const handleButtonClick = (direction) => {
  if (direction === 'previous') {
    navigateToPrevious();
  } else {
    navigateToNext();
  }
  hideButtons();
};

let md = null;

const initMarkdownRenderer = () => {
  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
  });

  md.use(katex, {
    logger: (error) => {
      console.error("[KaTeX Rendering Error]:", error);
    }
  });
};

const loadFileMap = async () => {
  const response = await fetch("/lectureFilesMap.json");
  lectureFilesMap.value = await response.json();
};

const loadLectureContent = async () => {
  try {
    loading.value = true;
    error.value = null;

    await loadFileMap();

    const fileList = lectureFilesMap.value[subjectId.value] || [];
    const fileInfo = fileList.find((item) => item.id === lectureId.value);

    if (!fileInfo) {
      throw new Error(
        "Lecture file not found. Please check the route parameters."
      );
    }

    const response = await fetch(fileInfo.file);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    markdownContent.value = content;

    extractTitle();
    parseMarkdown();
  } catch (err) {
    console.error("[LectureDetail] Load error:", err);
    error.value =
      err.message || "Failed to load lecture content. Please try again later.";
  } finally {
    loading.value = false;
  }
};

const extractTitle = () => {
  const titleMatch = markdownContent.value.match(/^#\s+(.+)$/m);
  lectureTitle.value = titleMatch ? titleMatch[1] : lectureId.value;
};

const parseMarkdown = () => {
  if (!md) {
    console.error("[LectureDetail] Markdown renderer not initialized");
    return;
  }
  renderedHTML.value = md.render(markdownContent.value);
};

const navigateBack = () => {
  router.push(`/lectures/${subjectId.value}`);
};

const navigateToSubjects = () => {
  router.push("/lectures");
};

const navigateToHome = () => {
  router.push("/");
};

onMounted(async () => {
  initMarkdownRenderer();
  await loadLectureContent();

  // INC-023: 註冊鍵盤快捷鍵監聽器
  window.addEventListener('keydown', handleKeyPress);

  // INC-024: Storage Layer - 首次提示機制 & 觸控事件監聽器 (僅手機版)
  // Formula: StorageLayer = LocalStorage.check() -> ShowHint | SkipHint & EventRegistration(mobile<768px)
  if (window.innerWidth < 768) {
    // 檢查是否已顯示過首次提示
    const hintShown = localStorage.getItem('lecture_nav_hint_shown');
    if (!hintShown) {
      showFirstTimeHint.value = true;
      setTimeout(() => {
        showFirstTimeHint.value = false;
        localStorage.setItem('lecture_nav_hint_shown', 'true');
      }, 3000);
    }

    // 註冊觸控事件監聽器 (僅手機版)
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleMiddleAreaClick);
  }
});

onUnmounted(() => {
  // INC-023: 清理鍵盤快捷鍵監聽器
  window.removeEventListener('keydown', handleKeyPress);

  // INC-024: 清理觸控事件監聽器和計時器
  if (window.innerWidth < 768) {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleMiddleAreaClick);
  }
  if (buttonHideTimer.value) {
    clearTimeout(buttonHideTimer.value);
  }
});

/**
 * INC-023 FIX: 監聽路由變化，重新載入內容
 * 當使用者透過導覽按鈕或鍵盤快捷鍵切換講義時，
 * Vue Router 會複用同一個元件實例，因此需要 watch 路由變化並重新載入
 */
watch(
  () => route.params.lectureId,
  async (newLectureId, oldLectureId) => {
    if (newLectureId && newLectureId !== oldLectureId) {
      await loadLectureContent();
    }
  }
);
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
  >
    <div class="max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20"
      >
        <div
          class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"
        ></div>
        <p class="text-gray-600">Loading lecture content...</p>
      </div>

      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 rounded-xl p-6 mb-8"
      >
        <div class="flex items-start gap-3">
          <svg
            class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 class="text-red-900 font-semibold mb-1">Loading Failed</h3>
            <p class="text-red-700">{{ error }}</p>
          </div>
        </div>
        <div class="mt-4 flex gap-3">
          <button
            @click="loadLectureContent"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
          <button
            @click="navigateBack"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>

      <div v-else>
        <nav
          class="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap"
        >
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <router-link
              v-if="crumb.clickable && crumb.path"
              :to="crumb.path"
              class="hover:text-blue-600 transition-colors"
            >
              {{ crumb.text }}
            </router-link>
            <span v-else class="text-gray-800 font-medium">{{
              crumb.text
            }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="text-gray-400"
              >/</span
            >
          </template>
        </nav>

        <!-- INC-024: Mobile Touch Navigation - First Time Hint Toast (Mobile Only, <768px) -->
        <div
          v-if="showFirstTimeHint"
          class="md:hidden fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-xl z-30 text-sm font-medium transition-opacity duration-300"
        >
          小提示：輕觸左右邊緣可快速切換講義
        </div>

        <!-- INC-024: Mobile Touch Navigation - Dynamic Edge Buttons (Mobile Only, <768px) -->
        <!-- Left Button -->
        <button
          v-show="showLeftButton"
          @click="handleButtonClick('previous')"
          class="md:hidden fixed left-0 top-1/2 -translate-y-1/2 w-20 h-24 bg-gray-800/70 flex items-center justify-center z-20 rounded-r-lg transition-all duration-300 animate-slide-in-left"
          :aria-label="'上一個講義'"
        >
          <ChevronLeftIcon class="w-8 h-8 text-white" />
        </button>

        <!-- Right Button -->
        <button
          v-show="showRightButton"
          @click="handleButtonClick('next')"
          class="md:hidden fixed right-0 top-1/2 -translate-y-1/2 w-20 h-24 bg-gray-800/70 flex items-center justify-center z-20 rounded-l-lg transition-all duration-300 animate-slide-in-right"
          :aria-label="'下一個講義'"
        >
          <ChevronRightIcon class="w-8 h-8 text-white" />
        </button>

        <!-- Edge Navigation Buttons (Desktop Only, ≥768px) -->
        <!-- Left Edge Button: Previous Lecture -->
        <button
          v-if="canGoPrevious"
          @click="navigateToPrevious"
          class="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 h-24 w-12 bg-gray-800/30 hover:bg-gray-800/80 items-center justify-center transition-all duration-300 z-10 rounded-r-lg"
          :aria-label="'上一個講義'"
          :title="'上一個講義 (←)'"
        >
          <ChevronLeftIcon class="w-8 h-8 text-white" />
        </button>

        <!-- Right Edge Button: Next Lecture -->
        <button
          v-if="canGoNext"
          @click="navigateToNext"
          class="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 h-24 w-12 bg-gray-800/30 hover:bg-gray-800/80 items-center justify-center transition-all duration-300 z-10 rounded-l-lg"
          :aria-label="'下一個講義'"
          :title="'下一個講義 (→)'"
        >
          <ChevronRightIcon class="w-8 h-8 text-white" />
        </button>

        <h1
          class="text-4xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-200"
        >
          {{ lectureTitle }}
        </h1>

        <article
          class="markdown-content prose prose-lg max-w-none"
          v-html="renderedHTML"
        ></article>

        <!-- INC-023: Navigation and Action Buttons Section -->
        <div class="mt-12 pt-8 border-t border-gray-200">
          <!-- Desktop/Tablet Layout (≥ md: 768px): Horizontal with circular nav buttons -->
          <div class="hidden md:flex md:items-center md:gap-3">
            <!-- Previous Lecture Button (Circular) -->
            <button
              v-if="canGoPrevious"
              @click="navigateToPrevious"
              :disabled="!canGoPrevious"
              :class="[
                'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                canGoPrevious
                  ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
              :aria-label="canGoPrevious ? '上一個講義' : '已是第一個講義'"
              :title="canGoPrevious ? '上一個講義 (←)' : '已是第一個講義'"
            >
              <ChevronLeftIcon class="w-6 h-6" />
            </button>

            <!-- Return Buttons Group -->
            <button
              @click="navigateBack"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-xl shadow-lg hover:shadow-xl hover:border-primary-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              返回主題
            </button>

            <button
              @click="navigateToSubjects"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-accent-600 rounded-xl shadow-lg hover:shadow-xl hover:border-accent-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            >
              <svg
                class="w-5 h-5"
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
              返回科目
            </button>

            <button
              @click="navigateToHome"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              返回首頁
            </button>

            <!-- Next Lecture Button (Circular) -->
            <button
              v-if="canGoNext"
              @click="navigateToNext"
              :disabled="!canGoNext"
              :class="[
                'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                canGoNext
                  ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              ]"
              :aria-label="canGoNext ? '下一個講義' : '已是最後一個講義'"
              :title="canGoNext ? '下一個講義 (→)' : '已是最後一個講義'"
            >
              <ChevronRightIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- Mobile Layout (< 768px): Vertical stack -->
          <div class="flex flex-col gap-4 md:hidden">
            <!-- Return Buttons (Vertical Stack) -->
            <button
              @click="navigateBack"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-xl shadow-lg hover:shadow-xl hover:border-primary-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              返回主題列表
            </button>

            <button
              @click="navigateToSubjects"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-accent-600 rounded-xl shadow-lg hover:shadow-xl hover:border-accent-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            >
              <svg
                class="w-5 h-5"
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
              返回科目
            </button>

            <button
              @click="navigateToHome"
              class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-xl shadow-lg hover:shadow-xl hover:border-gray-500 transition-all duration-300 border-2 border-transparent font-semibold active:scale-95"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              返回首頁
            </button>

            <!-- Navigation Buttons (Horizontal, Bottom) -->
            <div class="flex gap-3">
              <button
                v-if="canGoPrevious"
                @click="navigateToPrevious"
                :disabled="!canGoPrevious"
                :class="[
                  'flex-1 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                  canGoPrevious
                    ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                ]"
                :aria-label="canGoPrevious ? '上一個講義' : '已是第一個講義'"
                :title="canGoPrevious ? '上一個講義 (←)' : '已是第一個講義'"
              >
                <ChevronLeftIcon class="w-6 h-6" />
              </button>

              <button
                v-if="canGoNext"
                @click="navigateToNext"
                :disabled="!canGoNext"
                :class="[
                  'flex-1 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95',
                  canGoNext
                    ? 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                ]"
                :aria-label="canGoNext ? '下一個講義' : '已是最後一個講義'"
                :title="canGoNext ? '下一個講義 (→)' : '已是最後一個講義'"
              >
                <ChevronRightIcon class="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <!-- INC-023: Keyboard Shortcuts Hint -->
        <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="text-xs text-blue-800">
            <span class="font-semibold">鍵盤快捷鍵:</span>
            <span class="ml-2">← → - 切換講義</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* INC-024: Mobile Touch Navigation Animations */
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

.markdown-content :deep(h4) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
  color: #374151;
}

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

.markdown-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  font-size: 0.875rem;
  font-family: "Monaco", "Menlo", "Courier New", monospace;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
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

.markdown-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  background-color: #eff6ff;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  border-radius: 0 0.5rem 0.5rem 0;
  font-style: italic;
  color: #1e40af;
}

.markdown-content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
  transition: color 0.2s;
}

.markdown-content :deep(a:hover) {
  color: #1d4ed8;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2rem 0;
}

.markdown-content :deep(.katex) {
  font-size: 1.1em;
}

.markdown-content :deep(.katex-display) {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.markdown-content :deep(em) {
  font-style: italic;
}
</style>
