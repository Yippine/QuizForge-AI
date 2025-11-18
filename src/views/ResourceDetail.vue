<script setup>
/**
 * ResourceDetail Component
 * Formula: ResourceDetail = MarkdownRenderer + BackNavigation + RelatedResources + MermaidRenderer + KaTeX
 * Responsibility: 資源詳情頁面 (顯示 Markdown 內容)
 *
 * Note: 複用 LectureDetail.vue 的 Markdown 渲染邏輯 (MarkdownIt + KaTeX + Mermaid)
 */
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResourcesMap } from '../composables/useResourcesMap'
import MarkdownIt from 'markdown-it'
import { katex } from '@mdit/plugin-katex'
import 'katex/dist/katex.min.css'
import mermaid from 'mermaid'

const router = useRouter()
const route = useRoute()
const { loading: mapLoading, error: mapError, loadResourcesMap, getCertificationById, getSubjectById, getResourcesByType, getResourceItemById, getCategoryById, getLevelById } = useResourcesMap()

/**
 * State
 */
const markdownContent = ref('')
const renderedHTML = ref('')
const loading = ref(true)
const error = ref(null)

/**
 * Computed
 */
const certificationId = computed(() => route.params.certificationId)
const levelId = computed(() => route.params.levelId)
const subjectId = computed(() => route.params.subjectId)
const resourceType = computed(() => route.params.resourceType)
const resourceId = computed(() => route.params.resourceId)
const isNewStructure = computed(() => route.name === 'subject-resource-detail')

// INC-031: New computed properties for hierarchical breadcrumb
const categoryId = computed(() => isNewStructure.value ? 'ipas' : null)
const level = computed(() => isNewStructure.value ? getLevelById(categoryId.value, certificationId.value, levelId.value) : null)

const certification = computed(() => {
  if (isNewStructure.value) {
    return getCertificationById(levelId.value)
  } else {
    return getCertificationById(certificationId.value)
  }
})

const subject = computed(() => {
  if (isNewStructure.value) {
    return getSubjectById(levelId.value, subjectId.value)
  } else {
    return getSubjectById(certificationId.value, subjectId.value)
  }
})

const resource = computed(() => {
  if (isNewStructure.value) {
    return getResourcesByType(levelId.value, subjectId.value, resourceType.value)
  } else {
    return getResourcesByType(certificationId.value, subjectId.value, resourceType.value)
  }
})

const resourceItem = computed(() => {
  if (isNewStructure.value) {
    return getResourceItemById(levelId.value, subjectId.value, resourceType.value, resourceId.value)
  } else {
    return getResourceItemById(certificationId.value, subjectId.value, resourceType.value, resourceId.value)
  }
})

/**
 * Resource Type Metadata (INC-031: For breadcrumb display)
 */
const resourceTypeMetadata = {
  handouts: {
    title: '學習指引',
    icon: 'document',
    color: 'blue'
  },
  formulas: {
    title: '公式化講義',
    icon: 'calculator',
    color: 'green'
  },
  diagrams: {
    title: '架構圖與流程圖',
    icon: 'chart',
    color: 'purple'
  },
  exercises: {
    title: '練習題',
    icon: 'clipboard',
    color: 'orange'
  }
}

const currentMetadata = computed(() => resourceTypeMetadata[resourceType.value] || {
  title: '學習資源',
  icon: 'document',
  color: 'gray'
})

/**
 * Related Resources (同類型的其他資源)
 */
const relatedResources = computed(() => {
  if (!resource.value) return []
  return resource.value.items.filter(item => item.id !== resourceId.value)
})

/**
 * Markdown Renderer - Initialized dynamically
 * INC-027: Changed to function-based initialization with breaks: false
 */
let md = null

const initMarkdownRenderer = () => {
  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false // INC-027: Match LectureDetail.vue for proper paragraph spacing
  })

  md.use(katex, {
    throwOnError: false,
    errorColor: '#cc0000'
  })
}

/**
 * Initialize Mermaid (複用 LectureDetail 邏輯)
 */
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
})

/**
 * INC-027: Render Mermaid Diagrams
 * Formula: renderMermaid = QueryMermaidBlocks -> mermaid.run() -> ErrorHandling
 * Reference: LectureDetail.vue lines 362-392
 */
const renderMermaid = async () => {
  try {
    const mermaidElements = document.querySelectorAll('.markdown-content pre code.language-mermaid')

    if (mermaidElements.length === 0) {
      return // No Mermaid diagrams to render
    }

    // Convert code blocks to mermaid divs
    mermaidElements.forEach((element, index) => {
      const mermaidCode = element.textContent
      const mermaidDiv = document.createElement('div')
      mermaidDiv.className = 'mermaid'
      mermaidDiv.textContent = mermaidCode
      mermaidDiv.setAttribute('data-mermaid-index', index)

      // Replace pre > code with mermaid div
      const preElement = element.closest('pre')
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(mermaidDiv, preElement)
      }
    })

    // Run Mermaid rendering (INC-027: Use mermaid.run() not render())
    await mermaid.run({
      querySelector: '.markdown-content .mermaid',
    })
  } catch (error) {
    console.error('[ResourceDetail] Mermaid rendering error:', error)
  }
}

/**
 * INC-027: Table Scroll Optimization
 * Formula: wrapTables = QueryAllTables -> WrapEachTable(div.table-wrapper + overflow-x-auto)
 * Reference: LectureDetail.vue lines 399-416
 */
const wrapTables = () => {
  const tables = document.querySelectorAll('.markdown-content table')

  tables.forEach((table) => {
    // 檢查表格是否已經被包裝過
    if (table.parentElement?.classList.contains('table-wrapper')) {
      return
    }

    // 創建包裝容器
    const wrapper = document.createElement('div')
    wrapper.className = 'table-wrapper'

    // 將表格插入包裝容器
    table.parentNode?.insertBefore(wrapper, table)
    wrapper.appendChild(table)
  })
}

/**
 * Load Markdown Content
 * INC-027: Updated to use wrapTables() and renderMermaid() helpers
 */
const loadMarkdownContent = async () => {
  if (!resourceItem.value) {
    error.value = '找不到資源項目'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null

    const response = await fetch(resourceItem.value.file)
    if (!response.ok) {
      throw new Error(`Failed to load resource: ${response.statusText}`)
    }

    const text = await response.text()
    markdownContent.value = text

    // Render Markdown (INC-027: Check md is initialized)
    if (!md) {
      console.error('[ResourceDetail] Markdown renderer not initialized')
      return
    }
    renderedHTML.value = md.render(text)

    // INC-027: Execute table wrapping and Mermaid rendering after DOM update
    await nextTick()
    wrapTables()
    await renderMermaid()

    loading.value = false
  } catch (err) {
    console.error('[ResourceDetail] Load error:', err)
    error.value = err.message
    loading.value = false
  }
}

/**
 * Actions
 */
const goBack = () => {
  if (isNewStructure.value) {
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials/${resourceType.value}`)
  } else {
    router.push(`/resources/${certificationId.value}/${subjectId.value}/${resourceType.value}`)
  }
}

const viewRelatedResource = (relatedItemId) => {
  if (isNewStructure.value) {
    router.push(`/resources/ipas/${certificationId.value}/${levelId.value}/${subjectId.value}/materials/${resourceType.value}/${relatedItemId}`)
  } else {
    router.push(`/resources/${certificationId.value}/${subjectId.value}/${resourceType.value}/${relatedItemId}`)
  }
}

/**
 * Lifecycle
 * INC-027: Initialize markdown renderer before loading content
 */
onMounted(async () => {
  initMarkdownRenderer() // INC-027: Initialize renderer first
  await loadResourcesMap()
  if (!mapLoading.value && !mapError.value) {
    await loadMarkdownContent()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4">
    <!-- Loading State -->
    <div v-if="loading || mapLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
        <p class="text-gray-600 text-lg">載入資源內容...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error || mapError" class="max-w-2xl mx-auto">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-xl font-bold text-red-900 mb-2">載入失敗</h3>
        <p class="text-red-700 mb-4">{{ error || mapError }}</p>
        <button @click="goBack" class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors">
          返回資源列表
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="resourceItem && subject && certification" class="max-w-7xl mx-auto">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Main Content Area -->
        <div class="flex-1">
          <!-- Header -->
          <div class="mb-8">
            <button @click="goBack" class="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              返回資源列表
            </button>

            <!-- Breadcrumb (INC-031: Conditional rendering based on structure) -->
            <div v-if="!isNewStructure" class="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
              <span>{{ certification.name }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>{{ subject.name }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>{{ resource.title }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="font-semibold text-gray-900">{{ resourceItem.title }}</span>
            </div>
            <!-- INC-031: New hierarchical breadcrumb matching ResourceTypes.vue format -->
            <div v-else class="flex items-center gap-2 text-sm text-gray-600 mb-4 flex-wrap">
              <span class="hover:text-primary-600 cursor-pointer" @click="() => router.push('/resources/ipas')">iPAS</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="hover:text-primary-600 cursor-pointer" @click="() => router.push(`/resources/ipas/${certificationId}`)">{{ certificationId === 'ai-planning' ? 'AI 應用規劃師' : certificationId }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="hover:text-primary-600 cursor-pointer" @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}`)">{{ level?.name || levelId }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="hover:text-primary-600 cursor-pointer" @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}/${subjectId}`)">{{ subject.code }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="hover:text-primary-600 cursor-pointer" @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}/${subjectId}/materials`)">講義區</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="hover:text-primary-600 cursor-pointer" @click="() => router.push(`/resources/ipas/${certificationId}/${levelId}/${subjectId}/materials/${resourceType}`)">{{ currentMetadata.title }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="font-semibold text-gray-900">{{ resourceItem.title }}</span>
            </div>

            <!-- Title -->
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{{ resourceItem.title }}</h1>
            <div class="flex items-center gap-3">
              <span class="text-sm font-mono px-3 py-1 rounded"
                    :class="{
                      'bg-blue-100 text-blue-700': resourceType === 'handouts',
                      'bg-green-100 text-green-700': resourceType === 'formulas',
                      'bg-purple-100 text-purple-700': resourceType === 'diagrams',
                      'bg-orange-100 text-orange-700': resourceType === 'exercises'
                    }">
                {{ resourceItem.id }}
              </span>
              <span class="text-sm text-gray-500">{{ resourceItem.metadata?.fileType?.toUpperCase() || 'MARKDOWN' }}</span>
            </div>
          </div>

          <!-- Markdown Content -->
          <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <article
              class="markdown-content prose prose-lg max-w-none
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
          </div>
        </div>

        <!-- Sidebar: Related Resources -->
        <div v-if="relatedResources.length > 0" class="lg:w-80">
          <div class="bg-white rounded-xl shadow-lg p-6 sticky top-4">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              相關資源
            </h3>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="relatedItem in relatedResources.slice(0, 10)"
                :key="relatedItem.id"
                @click="viewRelatedResource(relatedItem.id)"
                class="p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-all duration-200"
              >
                <div class="text-xs font-mono text-gray-500 mb-1">{{ relatedItem.id }}</div>
                <div class="text-sm font-medium text-gray-900 line-clamp-2">{{ relatedItem.title }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* INC-027: KaTeX Styles - Enhanced math rendering */
:deep(.katex) {
  font-size: 1.1em;
}

:deep(.katex-display) {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* INC-027: Mermaid Diagram Styles - Enhanced with background and shadow */
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

/* Mobile responsive for Mermaid */
@media (max-width: 767px) {
  :deep(.mermaid) {
    padding: 0.5rem;
    margin: 1rem 0;
  }

  :deep(.mermaid svg) {
    font-size: 12px;
  }
}

/* INC-027: Code Block Dark Theme (matching LectureDetail.vue) */
:deep(pre) {
  background-color: #1f2937 !important;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

:deep(pre code) {
  background-color: transparent !important;
  color: inherit;
  padding: 0;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

/* INC-027: Table Wrapper for Horizontal Scrolling */
:deep(.table-wrapper) {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0; /* Remove margin, controlled by wrapper */
  box-shadow: none; /* Remove shadow, controlled by wrapper */
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

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
