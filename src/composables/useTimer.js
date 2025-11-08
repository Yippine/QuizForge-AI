/**
 * useTimer Composable
 * Formula: Timer = StartTime + ElapsedTime + FormatTime
 * Responsibility: 管理答題計時功能，提供開始、停止、格式化時間的方法
 * INC-017: Timer for quiz completion page
 */
import { ref, computed } from 'vue'

export function useTimer() {
  /**
   * State
   */
  const startTime = ref(null)
  const endTime = ref(null)
  const isRunning = ref(false)

  /**
   * Computed: 計算經過的時間（毫秒）
   */
  const elapsedMs = computed(() => {
    if (!startTime.value) return 0
    if (endTime.value) {
      return endTime.value - startTime.value
    }
    if (isRunning.value) {
      return Date.now() - startTime.value
    }
    return 0
  })

  /**
   * Computed: 格式化的時間字串（例如：3分25秒）
   */
  const formattedTime = computed(() => {
    return formatTime(elapsedMs.value)
  })

  /**
   * Actions
   */

  /**
   * 開始計時
   * Formula: start() -> (startTime = now) & (isRunning = true)
   */
  const start = () => {
    startTime.value = Date.now()
    endTime.value = null
    isRunning.value = true
    console.log('⏱️ Timer started')
  }

  /**
   * 停止計時
   * Formula: stop() -> (endTime = now) & (isRunning = false)
   */
  const stop = () => {
    if (!isRunning.value) return
    endTime.value = Date.now()
    isRunning.value = false
    console.log(`⏱️ Timer stopped. Elapsed: ${formattedTime.value}`)
  }

  /**
   * 重置計時器
   * Formula: reset() -> (startTime = null) & (endTime = null) & (isRunning = false)
   */
  const reset = () => {
    startTime.value = null
    endTime.value = null
    isRunning.value = false
    console.log('⏱️ Timer reset')
  }

  /**
   * 格式化時間為可讀字串
   * Formula: formatTime(ms) -> "X分Y秒" | "X秒"
   * @param {number} ms - 毫秒數
   * @returns {string} 格式化的時間字串
   */
  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '0秒'

    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes > 0) {
      return `${minutes}分${seconds}秒`
    }
    return `${seconds}秒`
  }

  /**
   * 取得原始時間數據（用於保存到 store）
   */
  const getTimeData = () => {
    return {
      startTime: startTime.value,
      endTime: endTime.value,
      elapsedMs: elapsedMs.value,
      formattedTime: formattedTime.value
    }
  }

  return {
    // State
    startTime,
    endTime,
    isRunning,
    elapsedMs,
    formattedTime,

    // Actions
    start,
    stop,
    reset,
    formatTime,
    getTimeData
  }
}
