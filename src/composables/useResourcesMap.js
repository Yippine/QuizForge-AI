/**
 * useResourcesMap Composable
 * Formula: useResourcesMap = DataLoading + DataManagement + QueryMethods
 * Responsibility: 載入和管理 resourcesMap.json 數據
 */
import { ref } from 'vue'

/**
 * State
 * Formula: State = certifications + categories + loading + error
 */
const certifications = ref([])
const categories = ref([])
const loading = ref(false)
const error = ref(null)

/**
 * Load Resources Map
 * Formula: loadResourcesMap() -> fetch(resourcesMap.json) -> certifications.value = data.certifications + categories.value = data.categories
 */
export async function loadResourcesMap() {
  if (certifications.value.length > 0) {
    // Already loaded
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await fetch('/resourcesMap.json')
    if (!response.ok) {
      throw new Error(`Failed to load resources map: ${response.statusText}`)
    }
    const data = await response.json()
    certifications.value = data.certifications || []
    categories.value = data.categories || []
  } catch (err) {
    error.value = err.message
    console.error('[useResourcesMap] Load error:', err)
  } finally {
    loading.value = false
  }
}

/**
 * Get Certification By ID
 * Formula: getCertificationById(id) -> certifications.find(cert => cert.id === id)
 */
export function getCertificationById(id) {
  return certifications.value.find(cert => cert.id === id) || null
}

/**
 * Get Subject By ID
 * Formula: getSubjectById(certId, subjId) -> certification.subjects.find(subj => subj.id === subjId)
 */
export function getSubjectById(certId, subjId) {
  const certification = getCertificationById(certId)
  if (!certification) return null
  return certification.subjects.find(subj => subj.id === subjId) || null
}

/**
 * Get Resources By Type
 * Formula: getResourcesByType(certId, subjId, type) -> subject.resources.find(res => res.type === type)
 */
export function getResourcesByType(certId, subjId, type) {
  const subject = getSubjectById(certId, subjId)
  if (!subject) return null
  return subject.resources.find(res => res.type === type) || null
}

/**
 * Get Resource Item By ID
 * Formula: getResourceItemById(certId, subjId, resourceType, itemId) -> resource.items.find(item => item.id === itemId)
 */
export function getResourceItemById(certId, subjId, resourceType, itemId) {
  const resource = getResourcesByType(certId, subjId, resourceType)
  if (!resource) return null
  return resource.items.find(item => item.id === itemId) || null
}

/**
 * Get Category By ID (NEW)
 * Formula: getCategoryById(categoryId) -> categories.find(cat => cat.id === categoryId)
 */
export function getCategoryById(categoryId) {
  return categories.value.find(cat => cat.id === categoryId) || null
}

/**
 * Get Certification By Path (NEW)
 * Formula: getCertificationByPath(categoryId, certificationId) -> getCategoryById(categoryId).certifications.find(cert => cert.id === certificationId)
 */
export function getCertificationByPath(categoryId, certificationId) {
  const category = getCategoryById(categoryId)
  if (!category) return null
  return category.certifications.find(cert => cert.id === certificationId) || null
}

/**
 * Get Level By ID (NEW)
 * Formula: getLevelById(categoryId, certificationId, levelId) -> getCertificationByPath(categoryId, certificationId).levels.find(level => level.id === levelId)
 */
export function getLevelById(categoryId, certificationId, levelId) {
  const certification = getCertificationByPath(categoryId, certificationId)
  if (!certification) return null
  return certification.levels.find(level => level.id === levelId) || null
}

/**
 * Export Composable
 * Formula: useResourcesMap = { certifications, categories, loading, error, loadResourcesMap, getCertificationById, getSubjectById, getResourcesByType, getResourceItemById, getCategoryById, getCertificationByPath, getLevelById }
 */
export function useResourcesMap() {
  return {
    certifications,
    categories,
    loading,
    error,
    loadResourcesMap,
    getCertificationById,
    getSubjectById,
    getResourcesByType,
    getResourceItemById,
    getCategoryById,
    getCertificationByPath,
    getLevelById
  }
}
