<script setup>
/**
 * ResourceCard Component
 * Formula: ResourceCard = Icon + Title + Description + ClickAction
 * Responsibility: 可重用的資源卡片組件
 */
import { computed } from 'vue'

/**
 * Props
 * Formula: Props = { title, description, icon, to }
 */
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '📚'
  },
  to: {
    type: [String, Object],
    required: true
  }
})

/**
 * Emits
 * Formula: Emits = { click }
 */
const emit = defineEmits(['click'])

/**
 * Computed
 * Formula: hasDescription = description.length > 0
 */
const hasDescription = computed(() => props.description.length > 0)

/**
 * Actions
 * Formula: handleClick() -> emit('click')
 */
const handleClick = () => {
  emit('click')
}
</script>

<template>
  <router-link
    :to="to"
    class="resource-card"
    @click="handleClick"
  >
    <div class="resource-card__icon">
      {{ icon }}
    </div>
    <div class="resource-card__content">
      <h3 class="resource-card__title">{{ title }}</h3>
      <p v-if="hasDescription" class="resource-card__description">
        {{ description }}
      </p>
    </div>
    <div class="resource-card__arrow">→</div>
  </router-link>
</template>

<style scoped>
.resource-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
}

.resource-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.resource-card__icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.resource-card__content {
  flex: 1;
  min-width: 0;
}

.resource-card__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.resource-card__description {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

.resource-card__arrow {
  font-size: 1.5rem;
  color: #94a3b8;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.resource-card:hover .resource-card__arrow {
  transform: translateX(4px);
  color: #3b82f6;
}

@media (max-width: 640px) {
  .resource-card {
    padding: 1rem;
  }

  .resource-card__icon {
    font-size: 2rem;
  }

  .resource-card__title {
    font-size: 1.125rem;
  }

  .resource-card__description {
    font-size: 0.8125rem;
  }
}
</style>
