<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  color: string
  trend?: string
}>()
</script>

<template>
  <div :class="['stat-card', `stat-card-${color}`]">
    <div class="stat-icon">
      <div class="icon-wrapper" v-html="icon"></div>
    </div>
    <div class="stat-content">
      <h3 class="stat-value">{{ value }}</h3>
      <p class="stat-title">{{ title }}</p>
      <p v-if="trend" class="stat-trend">{{ trend }}</p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--card-color-start), var(--card-color-end));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card-blue {
  --card-color-start: #3b82f6;
  --card-color-end: #1d4ed8;
}

.stat-card-green {
  --card-color-start: #10b981;
  --card-color-end: #059669;
}

.stat-card-orange {
  --card-color-start: #f59e0b;
  --card-color-end: #d97706;
}

.stat-card-purple {
  --card-color-start: #8b5cf6;
  --card-color-end: #6d28d9;
}

.stat-icon {
  flex-shrink: 0;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--card-color-start), var(--card-color-end));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.icon-wrapper :deep(svg) {
  width: 24px;
  height: 24px;
  stroke: white;
  fill: none;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-title {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.stat-trend {
  font-size: 0.75rem;
  color: #10b981;
  margin: 0.5rem 0 0 0;
  font-weight: 600;
}

@media (max-width: 768px) {
  .stat-card {
    padding: 1.25rem;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .icon-wrapper :deep(svg) {
    width: 20px;
    height: 20px;
  }
}
</style>
