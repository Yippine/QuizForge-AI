/**
 * useKeyboardShortcuts Composable
 * Formula: KeyboardShortcuts = EventCapture × ConflictDetection × Shortcuts × HelpSystem
 *
 * Responsibility: 管理全局鍵盤快捷鍵系統，提供事件捕獲、衝突檢測和幫助系統
 *
 * Supported Shortcuts:
 * - A/B/C/D: 選擇答案選項
 * - Enter: 提交答案/確認操作
 * - Space: 下一題/繼續
 * - Ctrl+H: 顯示快捷鍵幫助
 * - ←/→: 上一題/下一題（導航）
 * - Esc: 關閉模態框/退出當前模式
 * - Ctrl+P: 切換統計頁面
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 鍵盤快捷鍵配置
 */
const SHORTCUTS = {
  // 答案選擇
  'a': { action: 'select-option', param: 0, description: '選擇選項 A', category: 'answer' },
  'b': { action: 'select-option', param: 1, description: '選擇選項 B', category: 'answer' },
  'c': { action: 'select-option', param: 2, description: '選擇選項 C', category: 'answer' },
  'd': { action: 'select-option', param: 3, description: '選擇選項 D', category: 'answer' },

  // 操作控制
  'enter': { action: 'submit', param: null, description: '提交答案/確認', category: 'control' },
  ' ': { action: 'next', param: null, description: '下一題/繼續', category: 'control' },

  // 導航
  'arrowleft': { action: 'previous', param: null, description: '上一題', category: 'navigation' },
  'arrowright': { action: 'next', param: null, description: '下一題', category: 'navigation' },
  'escape': { action: 'escape', param: null, description: '關閉/退出', category: 'navigation' },

  // 功能快捷鍵
  'ctrl+h': { action: 'help', param: null, description: '顯示快捷鍵幫助', category: 'function' },
  'ctrl+p': { action: 'statistics', param: null, description: '切換統計頁面', category: 'function' },
  'ctrl+r': { action: 'restart', param: null, description: '重新開始', category: 'function' }
}

/**
 * 快捷鍵狀態
 */
const isEnabled = ref(true)
const showHelp = ref(false)
const lastAction = ref(null)

/**
 * 事件處理器追蹤
 */
const activeHandlers = new Map()
const conflictWarnings = new Set()

export function useKeyboardShortcuts(options = {}) {
  const {
    enableHelp = true,
    enableConflicts = true,
    preventDefault = true
  } = options

  /**
   * 檢查快捷鍵衝突
   * Formula: checkConflicts(key) -> ConflictDetection
   */
  const checkConflicts = (key, handler) => {
    if (!enableConflicts) return false

    const normalizedKey = key.toLowerCase()
    const existingHandler = activeHandlers.get(normalizedKey)

    if (existingHandler && existingHandler !== handler) {
      const warning = `Key conflict: ${key} already registered by ${existingHandler.name}`
      conflictWarnings.add(warning)
      console.warn(warning)
      return true
    }
    return false
  }

  /**
   * 註冊快捷鍵處理器
   * Formula: registerHandler(key, handler) -> HandlerRegistration
   */
  const registerHandler = (key, handler, options = {}) => {
    const normalizedKey = key.toLowerCase()

    if (!checkConflicts(normalizedKey, handler)) {
      activeHandlers.set(normalizedKey, handler)
    }

    // 返回清理函數
    return () => {
      activeHandlers.delete(normalizedKey)
    }
  }

  /**
   * 統一的鍵盤事件處理
   * Formula: handleKeyEvent(event) -> EventProcessing
   */
  const handleKeyEvent = (event) => {
    if (!isEnabled.value) return

    // 建構鍵盤組合鍵標識符
    const key = event.key.toLowerCase()
    const modifiers = []

    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    if (event.metaKey) modifiers.push('meta')

    const keyIdentifier = modifiers.length > 0 ? `${modifiers.join('+')}${key}` : key

    // 處理特殊情況（Space 鍵）
    if (key === ' ') {
      const spaceHandler = activeHandlers.get('space')
      if (spaceHandler) {
        spaceHandler(event)
        if (preventDefault) event.preventDefault()
        return
      }
    }

    // 處理方向鍵
    if (key.startsWith('arrow')) {
      const arrowHandler = activeHandlers.get(keyIdentifier)
      if (arrowHandler) {
        arrowHandler(event)
        if (preventDefault) event.preventDefault()
        return
      }
    }

    // 處理組合鍵
    if (modifiers.length > 0) {
      const comboHandler = activeHandlers.get(keyIdentifier)
      if (comboHandler) {
        comboHandler(event)
        if (preventDefault) event.preventDefault()
        return
      }
    }

    // 處理單鍵
    const singleKeyHandler = activeHandlers.get(key)
    if (singleKeyHandler) {
      singleKeyHandler(event)
      if (preventDefault) event.preventDefault()
      return
    }

    // 處理 Esc 鍵
    if (key === 'escape') {
      const escapeHandler = activeHandlers.get('escape')
      if (escapeHandler) {
        escapeHandler(event)
        if (preventDefault) event.preventDefault()
        return
      }
    }
  }

  /**
   * 啟用/停用快捷鍵系統
   */
  const enable = () => {
    isEnabled.value = true
  }

  const disable = () => {
    isEnabled.value = false
  }

  /**
   * 切換幫助面板
   */
  const toggleHelp = () => {
    showHelp.value = !showHelp.value
    lastAction.value = 'help'
  }

  /**
   * 獲取快捷鍵幫助信息
   */
  const getShortcutsHelp = (category = null) => {
    const shortcuts = Object.entries(SHORTCUTS)
      .filter(([_, config]) => !category || config.category === category)
      .map(([key, config]) => ({
        key: formatShortcutKey(key),
        description: config.description,
        category: config.category
      }))
      .sort((a, b) => a.category.localeCompare(b.category))

    return {
      shortcuts,
      categories: ['answer', 'control', 'navigation', 'function']
    }
  }

  /**
   * 格式化快捷鍵顯示
   */
  const formatShortcutKey = (key) => {
    if (key === ' ') return 'Space'
    if (key === 'arrowleft') return '←'
    if (key === 'arrowright') return '→'
    if (key === 'escape') return 'Esc'
    if (key === 'enter') return 'Enter'

    return key
      .split('+')
      .map(part => {
        if (part === 'ctrl') return 'Ctrl'
        if (part === 'alt') return 'Alt'
        if (part === 'shift') return 'Shift'
        if (part === 'meta') return 'Cmd'
        return part.toUpperCase()
      })
      .join(' + ')
  }

  /**
   * 註冊預設快捷鍵處理器
   */
  const registerDefaultHandlers = (handlers = {}) => {
    const cleanupFunctions = []

    // 答案選擇處理器
    if (handlers.onSelectOption) {
      ['a', 'b', 'c', 'd'].forEach((key, index) => {
        const cleanup = registerHandler(key, (event) => {
          handlers.onSelectOption(index, event)
          lastAction.value = `select-option-${index}`
        })
        cleanupFunctions.push(cleanup)
      })
    }

    // 操作控制處理器
    if (handlers.onSubmit) {
      cleanupFunctions.push(registerHandler('enter', (event) => {
        handlers.onSubmit(event)
        lastAction.value = 'submit'
      }))
    }

    if (handlers.onNext) {
      cleanupFunctions.push(registerHandler(' ', (event) => {
        handlers.onNext(event)
        lastAction.value = 'next'
      }))
    }

    // 導航處理器
    if (handlers.onPrevious) {
      cleanupFunctions.push(registerHandler('arrowleft', (event) => {
        handlers.onPrevious(event)
        lastAction.value = 'previous'
      }))
    }

    if (handlers.onNext) {
      cleanupFunctions.push(registerHandler('arrowright', (event) => {
        handlers.onNext(event)
        lastAction.value = 'next'
      }))
    }

    if (handlers.onEscape) {
      cleanupFunctions.push(registerHandler('escape', (event) => {
        handlers.onEscape(event)
        lastAction.value = 'escape'
      }))
    }

    // 功能快捷鍵處理器
    if (enableHelp && handlers.onHelp) {
      cleanupFunctions.push(registerHandler('ctrl+h', (event) => {
        handlers.onHelp(event)
        lastAction.value = 'help'
      }))
    }

    if (handlers.onStatistics) {
      cleanupFunctions.push(registerHandler('ctrl+p', (event) => {
        handlers.onStatistics(event)
        lastAction.value = 'statistics'
      }))
    }

    if (handlers.onRestart) {
      cleanupFunctions.push(registerHandler('ctrl+r', (event) => {
        handlers.onRestart(event)
        lastAction.value = 'restart'
      }))
    }

    // 返回清理函數
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }

  /**
   * 獲取衝突警告
   */
  const getConflictWarnings = () => {
    return Array.from(conflictWarnings)
  }

  /**
   * 清除衝突警告
   */
  const clearConflictWarnings = () => {
    conflictWarnings.clear()
  }

  /**
   * 獲取最後執行的動作
   */
  const getLastAction = () => {
    return lastAction.value
  }

  /**
   * 檢查特定快捷鍵是否可用
   */
  const isShortcutAvailable = (key) => {
    const normalizedKey = key.toLowerCase()
    return !activeHandlers.has(normalizedKey)
  }

  /**
   * 計算屬性
   */
  const shortcutsCount = computed(() => activeHandlers.size)
  const hasConflicts = computed(() => conflictWarnings.size > 0)
  const shortcutsHelp = computed(() => getShortcutsHelp())

  // 生命週期管理
  onMounted(() => {
    document.addEventListener('keydown', handleKeyEvent)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyEvent)
    activeHandlers.clear()
  })

  // 返回公共 API
  return {
    // 狀態
    isEnabled,
    showHelp,
    lastAction,

    // 配置
    SHORTCUTS,

    // 方法
    enable,
    disable,
    toggleHelp,
    registerHandler,
    registerDefaultHandlers,
    getShortcutsHelp,
    formatShortcutKey,
    getConflictWarnings,
    clearConflictWarnings,
    getLastAction,
    isShortcutAvailable,

    // 計算屬性
    shortcutsCount,
    hasConflicts,
    shortcutsHelp
  }
}

/**
 * 匯出常數供外部使用
 */
export { SHORTCUTS }