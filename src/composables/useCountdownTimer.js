/**
 * useCountdownTimer Composable
 * Formula: CountdownTimer = TimeLimit + ElapsedTime + RemainingTime + AutoSubmit
 * Responsibility: 管理倒數計時功能，提供開始、停止、格式化時間的方法
 * INC-018: Countdown timer for exam settings
 */
import { ref, computed, onUnmounted } from 'vue'

export function useCountdownTimer() {
  /**
   * State
   */
  const timeLimitMinutes = ref(null) // 時間限制（分鐘）
  const startTime = ref(null)
  const endTime = ref(null)
  const isRunning = ref(false)
  const currentTime = ref(Date.now())
  let intervalId = null
  let onTimeUpCallback = null

  /**
   * Computed: 計算剩餘時間（毫秒）
   */
  const remainingMs = computed(() => {
    if (!startTime.value || !timeLimitMinutes.value) return null

    const limitMs = timeLimitMinutes.value * 60 * 1000
    const elapsed = currentTime.value - startTime.value
    const remaining = limitMs - elapsed

    return Math.max(0, remaining)
  })

  /**
   * Computed: 格式化的剩餘時間字串（例如：12:35）
   */
  const formattedTime = computed(() => {
    if (remainingMs.value === null) return null

    const totalSeconds = Math.floor(remainingMs.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })

  /**
   * Computed: 是否剩餘時間少於 1 分鐘（用於警告樣式）
   */
  const isWarning = computed(() => {
    if (remainingMs.value === null) return false
    return remainingMs.value < 60 * 1000 // 少於 1 分鐘
  })

  /**
   * Computed: 是否時間已到
   */
  const isTimeUp = computed(() => {
    return remainingMs.value === 0
  })

  /**
   * Actions
   */

  /**
   * 開始倒數計時
   * Formula: start(minutes, callback) -> (startTime = now) & (timeLimitMinutes = minutes) & (isRunning = true)
   * @param {number} minutes - 時間限制（分鐘）
   * @param {function} callback - 時間到時的回調函數
   */
  const start = (minutes, callback) => {
    if (!minutes || minutes <= 0) {
      console.warn('⏱️ Countdown timer not started: invalid time limit')
      return
    }

    startTime.value = Date.now()
    endTime.value = null
    timeLimitMinutes.value = minutes
    isRunning.value = true
    onTimeUpCallback = callback
    currentTime.value = Date.now()

    // 每 100ms 更新一次時間（更精確，避免跳過秒數）
    intervalId = setInterval(() => {
      currentTime.value = Date.now()

      // 檢查時間是否到了
      if (remainingMs.value === 0 && onTimeUpCallback) {
        stop()
        onTimeUpCallback()
        console.log('⏰ Time is up! Auto-submitting...')
      }
    }, 100)

    console.log(`⏱️ Countdown timer started: ${minutes} minutes`)
  }

  /**
   * 停止計時
   * Formula: stop() -> (endTime = now) & (isRunning = false) & clearInterval
   */
  const stop = () => {
    if (!isRunning.value) return

    endTime.value = Date.now()
    isRunning.value = false

    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }

    console.log(`⏱️ Countdown timer stopped. Remaining: ${formattedTime.value}`)
  }

  /**
   * 重置計時器
   * Formula: reset() -> (startTime = null) & (endTime = null) & (isRunning = false) & clearInterval
   */
  const reset = () => {
    startTime.value = null
    endTime.value = null
    timeLimitMinutes.value = null
    isRunning.value = false
    currentTime.value = Date.now()

    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }

    console.log('⏱️ Countdown timer reset')
  }

  /**
   * 取得原始時間數據（用於保存到 store）
   */
  const getTimeData = () => {
    const elapsed = startTime.value ? (endTime.value || currentTime.value) - startTime.value : 0
    return {
      startTime: startTime.value,
      endTime: endTime.value,
      timeLimitMinutes: timeLimitMinutes.value,
      remainingMs: remainingMs.value,
      elapsedMs: elapsed,
      formattedTime: formattedTime.value,
      isTimeUp: isTimeUp.value
    }
  }

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    // State
    timeLimitMinutes,
    startTime,
    endTime,
    isRunning,
    remainingMs,
    formattedTime,
    isWarning,
    isTimeUp,

    // Actions
    start,
    stop,
    reset,
    getTimeData
  }
}
