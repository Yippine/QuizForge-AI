/**
 * useCertConfig
 * Formula: GUI編輯 certifications.json → save → 配置更新
 * 讀取和編輯認證配置，使用 localStorage 持久化（MVP版本）
 *
 * 注：正式版應整合 Supabase 或後端 API
 */
import { ref } from 'vue'
import certData from '@/config/certifications.json'

const STORAGE_KEY = 'quizforge_cert_config'

export function useCertConfig() {
  const config = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)
  const isDirty = ref(false)

  /**
   * 載入認證配置
   * 優先從 localStorage 載入，若無則用 certifications.json
   */
  async function loadConfig() {
    loading.value = true
    error.value = null
    try {
      // 嘗試從 localStorage 載入
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        config.value = JSON.parse(stored)
        console.log('[useCertConfig] 從 localStorage 載入配置')
      } else {
        // 否則使用預設配置
        config.value = JSON.parse(JSON.stringify(certData))
        console.log('[useCertConfig] 使用預設 certifications.json')
      }
      isDirty.value = false
    } catch (e) {
      error.value = `載入失敗：${e.message}`
      console.error('[useCertConfig] loadConfig error:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 將配置保存到 localStorage
   *
   * 注：要使更改永久生效，需要手動將 localStorage 內容複製回 certifications.json
   * 或配置 Supabase 存儲（見 docs/admin-guide/CERT_CONFIG_EXPORT.md）
   */
  async function saveConfig() {
    saving.value = true
    error.value = null
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
      isDirty.value = false
      console.log('[useCertConfig] 配置已保存到瀏覽器存儲')

      // 顯示成功提示
      if (window.confirm(
        '配置已保存到瀏覽器存儲。\n\n' +
        '要使更改永久生效，請：\n' +
        '1. 點擊「匯出 JSON」\n' +
        '2. 複製內容至 src/config/certifications.json\n' +
        '3. git commit 提交變更\n\n' +
        '點擊「確定」查看匯出說明。'
      )) {
        // 可以觸發後續操作
      }
    } catch (e) {
      error.value = `保存失敗：${e.message}`
      console.error('[useCertConfig] saveConfig error:', e)
    } finally {
      saving.value = false
    }
  }

  /**
   * 導出配置為 JSON 字符串（用於手動複製）
   */
  function exportConfig() {
    return JSON.stringify(config.value, null, 2)
  }

  /**
   * 清除 localStorage，回到預設配置
   */
  function resetToDefault() {
    if (confirm('確定要清除所有編輯並返回預設配置嗎？此操作不可撤銷。')) {
      localStorage.removeItem(STORAGE_KEY)
      config.value = JSON.parse(JSON.stringify(certData))
      isDirty.value = false
      error.value = null
    }
  }

  return {
    config,
    loading,
    saving,
    error,
    isDirty,
    loadConfig,
    saveConfig,
    exportConfig,
    resetToDefault
  }
}
