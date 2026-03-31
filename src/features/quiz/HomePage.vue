<script setup>
import { useCertifications } from '@/composables/useCertifications'
import { useRouter } from 'vue-router'

const router = useRouter()
const { certifications } = useCertifications()

function goToSubject(certId, subjectId) {
  router.push({ name: 'TopicSelect', params: { subjectId } })
}
</script>

<template>
  <div class="home-page">
    <header class="page-header">
      <h1 class="page-title">選擇考科</h1>
      <p class="page-desc">選擇科目後挑選主題開始練習，或直接進行模擬考</p>
    </header>

    <div v-for="cert in certifications" :key="cert.id" class="cert-section">
      <div class="cert-label">
        <span class="cert-icon">{{ cert.icon }}</span>
        <span>{{ cert.name }}</span>
        <span class="cert-level">{{ cert.level === 'intermediate' ? '中級' : cert.level }}</span>
      </div>

      <div class="subject-grid">
        <button
          v-for="subject in cert.subjects"
          :key="subject.id"
          class="subject-card"
          @click="goToSubject(cert.id, subject.id)"
        >
          <div class="subject-icon">{{ subject.icon }}</div>
          <div class="subject-info">
            <div class="subject-id">{{ subject.id }}</div>
            <div class="subject-name">{{ subject.name }}</div>
            <div class="subject-meta">
              {{ subject.chapters.reduce((acc, ch) => acc + ch.topics.length, 0) }} 個主題
            </div>
          </div>
          <div class="subject-arrow">›</div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

.page-header { margin-bottom: 2rem; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
.page-desc { color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0; }

.cert-section { margin-bottom: 2rem; }

.cert-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.cert-icon { font-size: 1rem; }

.cert-level {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
}

.subject-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 560px) {
  .subject-grid { grid-template-columns: repeat(2, 1fr); }
}

.subject-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  text-align: left;
  transition: all 0.15s;
  cursor: pointer;
  min-height: 80px;
}
.subject-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.12);
  transform: translateY(-1px);
}

.subject-icon { font-size: 1.75rem; flex-shrink: 0; }

.subject-info { flex: 1; min-width: 0; }
.subject-id   { font-size: 0.7rem; font-weight: 600; color: #94a3b8; margin-bottom: 2px; }
.subject-name { font-size: 0.9rem; font-weight: 600; color: #1e293b; line-height: 1.3; }
.subject-meta { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }

.subject-arrow { font-size: 1.25rem; color: #cbd5e1; flex-shrink: 0; }
</style>
