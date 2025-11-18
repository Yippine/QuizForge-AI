import { defineStore } from 'pinia'

/**
 * CurrentSubject Store - 當前科目狀態管理
 * Formula: CurrentSubjectStore' = CurrentSubjectStore + (state.categoryId + state.recentSubjects[]) + (getters.fullPath + getters.displayPath) + (actions.setFullPath + actions.addToRecent + actions.loadFullState)
 * INC-033-v2: HomePage Integration with Modal-Based Resource Selection
 */
export const useCurrentSubjectStore = defineStore('currentSubject', {
  /**
   * State Definition
   * Formula: SubjectState = {categoryId, certificationId, levelId, subjectId, recentSubjects[]}
   */
  state: () => ({
    categoryId: null,        // NEW: 'ipas' | null
    certificationId: null,   // 'ai-planning' | null
    levelId: null,           // 'intermediate' | null
    subjectId: null,         // 'L21' | 'L23' | null
    recentSubjects: []       // NEW: [{ categoryId, certificationId, levelId, subjectId, timestamp }] max 3
  }),

  /**
   * Getters Definition
   * Formula: ComputedPaths = {isSubjectSelected, fullPath, displayPath, subjectInfo, materialsPath, practiceTopicsPath, practiceExamPath, recentSubjectsList}
   */
  getters: {
    /**
     * 檢查是否已選定完整路徑
     * Formula: isSubjectSelected = !!state.subjectId && !!state.categoryId
     * @returns {boolean}
     */
    isSubjectSelected: (state) => state.subjectId !== null && state.categoryId !== null,

    /**
     * 取得完整路徑
     * Formula: fullPath = { categoryId, certificationId, levelId, subjectId }
     * @returns {Object}
     */
    fullPath: (state) => ({
      categoryId: state.categoryId,
      certificationId: state.certificationId,
      levelId: state.levelId,
      subjectId: state.subjectId
    }),

    /**
     * 取得當前科目資訊
     * Formula: subjectInfo = computed(() -> SubjectMetadata[subjectId])
     * @returns {Object|null}
     */
    subjectInfo: (state) => {
      const subjects = {
        'L21': {
          id: 'L21',
          name: '人工智慧技術應用規劃',
          code: 'L21',
          topicCount: 9,
          questionCount: '150+',
          materialCount: 4
        },
        'L23': {
          id: 'L23',
          name: '機器學習技術與應用',
          code: 'L23',
          topicCount: 12,
          questionCount: '204+',
          materialCount: 4
        }
      }
      return state.subjectId ? subjects[state.subjectId] : null
    },

    /**
     * 講義資源路徑
     * Formula: materialsPath = `/resources/${categoryId}/${certificationId}/${levelId}/${subjectId}/materials`
     * @returns {string|null}
     */
    materialsPath: (state) => {
      if (!state.subjectId || !state.categoryId) return null
      return `/resources/${state.categoryId}/${state.certificationId}/${state.levelId}/${state.subjectId}/materials`
    },

    /**
     * 主題練習路徑
     * Formula: practiceTopicsPath = `/resources/${categoryId}/${certificationId}/${levelId}/${subjectId}/practice/topics`
     * @returns {string|null}
     */
    practiceTopicsPath: (state) => {
      if (!state.subjectId || !state.categoryId) return null
      return `/resources/${state.categoryId}/${state.certificationId}/${state.levelId}/${state.subjectId}/practice/topics`
    },

    /**
     * 模擬考試路徑
     * Formula: practiceExamPath = `/resources/${categoryId}/${certificationId}/${levelId}/${subjectId}/practice/exam`
     * @returns {string|null}
     */
    practiceExamPath: (state) => {
      if (!state.subjectId || !state.categoryId) return null
      return `/resources/${state.categoryId}/${state.certificationId}/${state.levelId}/${state.subjectId}/practice/exam`
    },

    /**
     * 題目區路徑 (PracticeHub)
     * Formula: practicePath = `/resources/${categoryId}/${certificationId}/${levelId}/${subjectId}/practice`
     * @returns {string|null}
     */
    practicePath: (state) => {
      if (!state.subjectId || !state.categoryId) return null
      return `/resources/${state.categoryId}/${state.certificationId}/${state.levelId}/${state.subjectId}/practice`
    },

    /**
     * 取得最近學習科目列表
     * Formula: recentSubjectsList = state.recentSubjects sorted by timestamp desc
     * @returns {Array}
     */
    recentSubjectsList: (state) => {
      return [...state.recentSubjects].sort((a, b) => b.timestamp - a.timestamp)
    }
  },

  /**
   * Actions Definition
   * Formula: SubjectMutations = {setFullPath, addToRecent, loadFullState, clearFullPath, setSubject, clearSubject, loadFromStorage}
   */
  actions: {
    /**
     * 設定完整路徑
     * Formula: setFullPath({ categoryId, certificationId, levelId, subjectId }) -> state update & localStorage.setItem
     * @param {Object} fullPath - 完整路徑物件
     */
    setFullPath({ categoryId, certificationId, levelId, subjectId }) {
      this.categoryId = categoryId
      this.certificationId = certificationId
      this.levelId = levelId
      this.subjectId = subjectId

      // Persist to localStorage
      const resourceData = { categoryId, certificationId, levelId, subjectId }
      localStorage.setItem('selectedResource', JSON.stringify(resourceData))
      console.log(`[Store] Full path set:`, resourceData)
    },

    /**
     * 新增到最近學習列表
     * Formula: addToRecent(fullPath) -> dedup + FIFO + max 3 + persist
     * @param {Object} fullPath - 完整路徑物件
     */
    addToRecent(fullPath) {
      const { categoryId, certificationId, levelId, subjectId } = fullPath

      // Remove existing entry with same path (dedup)
      this.recentSubjects = this.recentSubjects.filter(
        item => !(item.categoryId === categoryId &&
                  item.certificationId === certificationId &&
                  item.levelId === levelId &&
                  item.subjectId === subjectId)
      )

      // Add new entry with timestamp
      this.recentSubjects.push({
        categoryId,
        certificationId,
        levelId,
        subjectId,
        timestamp: Date.now()
      })

      // Sort by timestamp descending and keep max 3
      this.recentSubjects = this.recentSubjects
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)

      // Persist to localStorage
      localStorage.setItem('recentSubjects', JSON.stringify(this.recentSubjects))
      console.log(`[Store] Recent subjects updated:`, this.recentSubjects.length)
    },

    /**
     * 從 localStorage 載入完整狀態
     * Formula: loadFullState() -> localStorage.getItem + validation + state update
     */
    loadFullState() {
      // Load selected resource
      const savedResource = localStorage.getItem('selectedResource')
      if (savedResource) {
        try {
          const parsed = JSON.parse(savedResource)
          if (parsed.categoryId && parsed.certificationId && parsed.levelId && parsed.subjectId) {
            this.categoryId = parsed.categoryId
            this.certificationId = parsed.certificationId
            this.levelId = parsed.levelId
            this.subjectId = parsed.subjectId
            console.log(`[Store] Full state loaded from storage:`, parsed)
          }
        } catch (err) {
          console.error('[Store] Failed to parse selectedResource:', err)
          localStorage.removeItem('selectedResource')
        }
      }

      // Load recent subjects
      const savedRecent = localStorage.getItem('recentSubjects')
      if (savedRecent) {
        try {
          const parsed = JSON.parse(savedRecent)
          if (Array.isArray(parsed)) {
            this.recentSubjects = parsed.slice(0, 3)
            console.log(`[Store] Recent subjects loaded:`, this.recentSubjects.length)
          }
        } catch (err) {
          console.error('[Store] Failed to parse recentSubjects:', err)
          localStorage.removeItem('recentSubjects')
        }
      }

      // Migration: Handle old format (single subjectId)
      const oldSubject = localStorage.getItem('currentSubject')
      if (oldSubject && !this.subjectId) {
        if (['L21', 'L23'].includes(oldSubject)) {
          // Migrate to new format with default path
          this.setFullPath({
            categoryId: 'ipas',
            certificationId: 'ai-planning',
            levelId: 'intermediate',
            subjectId: oldSubject
          })
          // Clean up old format
          localStorage.removeItem('currentSubject')
          console.log(`[Store] Migrated from old format: ${oldSubject}`)
        }
      }
    },

    /**
     * 清除完整路徑
     * Formula: clearFullPath() -> state reset & localStorage.removeItem
     */
    clearFullPath() {
      this.categoryId = null
      this.certificationId = null
      this.levelId = null
      this.subjectId = null
      localStorage.removeItem('selectedResource')
      console.log('[Store] Full path cleared')
    },

    /**
     * 設定當前科目 (Legacy support)
     * Formula: setSubject(subjectId) -> setFullPath with defaults
     * @param {string} subjectId - 科目代碼 ('L21' | 'L23')
     */
    setSubject(subjectId) {
      this.setFullPath({
        categoryId: 'ipas',
        certificationId: 'ai-planning',
        levelId: 'intermediate',
        subjectId
      })
    },

    /**
     * 清除當前科目 (Legacy support)
     * Formula: clearSubject() -> clearFullPath()
     */
    clearSubject() {
      this.clearFullPath()
    },

    /**
     * 從 localStorage 載入科目 (Legacy support)
     * Formula: loadFromStorage() -> loadFullState()
     */
    loadFromStorage() {
      this.loadFullState()
    }
  }
})
