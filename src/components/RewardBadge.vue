<script setup lang="ts">
import type { StudentReward } from '../supabase'

defineProps<{
  studentReward: StudentReward
}>()

const emit = defineEmits<{
  toggleRedeem: [studentRewardId: string]
  remove: [studentRewardId: string]
}>()
</script>

<template>
  <div :class="['reward-badge', { redeemed: studentReward.redeemed }]">
    <span class="reward-icon">{{ studentReward.reward?.icon || '🎁' }}</span>
    <div class="reward-info">
      <span class="reward-name">{{ studentReward.reward?.name }}</span>
      <span v-if="studentReward.redeemed" class="redeemed-label">Ingewisseld</span>
    </div>
    <div class="reward-actions">
      <button
        @click="emit('toggleRedeem', studentReward.id)"
        :class="['redeem-btn', { redeemed: studentReward.redeemed }]"
        :title="studentReward.redeemed ? 'Markeer als niet ingewisseld' : 'Markeer als ingewisseld'"
      >
        <svg v-if="!studentReward.redeemed" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3l18 18M18 6L6 18"></path>
        </svg>
      </button>
      <button
        @click="emit('remove', studentReward.id)"
        class="remove-btn"
        title="Verwijder beloning"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.reward-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #fcd34d;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.reward-badge.redeemed {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
  opacity: 0.7;
}

.reward-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.reward-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.reward-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.redeemed-label {
  font-size: 0.7rem;
  color: #64748b;
  font-style: italic;
}

.reward-actions {
  display: flex;
  gap: 0.25rem;
}

.redeem-btn,
.remove-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.redeem-btn {
  background: #dcfce7;
  color: #16a34a;
}

.redeem-btn.redeemed {
  background: #e2e8f0;
  color: #64748b;
}

.redeem-btn:hover {
  transform: scale(1.1);
  background: #bbf7d0;
}

.redeem-btn.redeemed:hover {
  background: #cbd5e1;
}

.remove-btn {
  background: #fee2e2;
  color: #dc2626;
}

.remove-btn:hover {
  transform: scale(1.1);
  background: #fecaca;
}
</style>
