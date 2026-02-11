<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Student, Reward } from '../composables/supabase'

const props = defineProps<{
  student: Student
  availableRewards: Reward[]
}>()

const emit = defineEmits<{
  assign: [rewardId: string]
  createAndAssign: [name: string, description: string, pointsRequired: number, icon: string]
  close: []
}>()

const view = ref<'select' | 'create'>('select')
const selectedRewardId = ref<string>('')

const newRewardName = ref('')
const newRewardDescription = ref('')
const newRewardPoints = ref(0)
const newRewardIcon = ref('🎁')

const commonIcons = ['🎁', '🍕', '🍔', '🍟', '🌮', '🍦', '🍪', '🎮', '📚', '✏️', '🏆', '⭐', '💯', '🎯', '🎨', '🎵']

const affordableRewards = computed(() => {
  return props.availableRewards.filter(r => r.points_required <= props.student.points)
})

const expensiveRewards = computed(() => {
  return props.availableRewards.filter(r => r.points_required > props.student.points)
})

const handleAssign = () => {
  if (selectedRewardId.value) {
    emit('assign', selectedRewardId.value)
    selectedRewardId.value = ''
  }
}

const handleCreate = () => {
  if (newRewardName.value.trim()) {
    emit('createAndAssign',
      newRewardName.value.trim(),
      newRewardDescription.value.trim(),
      newRewardPoints.value,
      newRewardIcon.value
    )
    newRewardName.value = ''
    newRewardDescription.value = ''
    newRewardPoints.value = 0
    newRewardIcon.value = '🎁'
  }
}
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
          </svg>
        </div>
        <h2>Beloning Toekennen</h2>
        <p class="subtitle">{{ student.name }} heeft {{ student.points }} punten</p>
      </div>

      <div class="view-toggle">
        <button
          :class="['toggle-btn', { active: view === 'select' }]"
          @click="view = 'select'"
        >
          Bestaande Beloning
        </button>
        <button
          :class="['toggle-btn', { active: view === 'create' }]"
          @click="view = 'create'"
        >
          Nieuwe Beloning
        </button>
      </div>

      <div v-if="view === 'select'" class="select-view">
        <div v-if="availableRewards.length === 0" class="empty-rewards">
          <p>Je hebt nog geen beloningen aangemaakt.</p>
          <button @click="view = 'create'" class="create-first-btn">
            Maak je eerste beloning
          </button>
        </div>

        <div v-else class="rewards-section">
          <div v-if="affordableRewards.length > 0" class="reward-group">
            <h3>Beschikbaar (voldoende punten)</h3>
            <div class="rewards-grid">
              <label
                v-for="reward in affordableRewards"
                :key="reward.id"
                class="reward-option affordable"
              >
                <input
                  type="radio"
                  :value="reward.id"
                  v-model="selectedRewardId"
                  name="reward"
                />
                <div class="reward-card">
                  <span class="reward-icon">{{ reward.icon }}</span>
                  <div class="reward-details">
                    <span class="reward-name">{{ reward.name }}</span>
                    <span class="reward-points">{{ reward.points_required }} punten</span>
                    <span v-if="reward.description" class="reward-desc">{{ reward.description }}</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div v-if="expensiveRewards.length > 0" class="reward-group">
            <h3>Te duur (onvoldoende punten)</h3>
            <div class="rewards-grid">
              <div
                v-for="reward in expensiveRewards"
                :key="reward.id"
                class="reward-option locked"
              >
                <div class="reward-card">
                  <span class="reward-icon">{{ reward.icon }}</span>
                  <div class="reward-details">
                    <span class="reward-name">{{ reward.name }}</span>
                    <span class="reward-points">{{ reward.points_required }} punten</span>
                    <span class="missing-points">{{ reward.points_required - student.points }} punten tekort</span>
                  </div>
                  <div class="lock-icon">🔒</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="emit('close')" class="cancel-btn">
            Annuleren
          </button>
          <button
            @click="handleAssign"
            :disabled="!selectedRewardId"
            class="submit-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Toekennen
          </button>
        </div>
      </div>

      <div v-else class="create-view">
        <form @submit.prevent="handleCreate">
          <div class="input-group">
            <label for="reward-name">Naam beloning</label>
            <input
              id="reward-name"
              v-model="newRewardName"
              type="text"
              placeholder="Bijv. Gratis lunch"
              required
            />
          </div>

          <div class="input-group">
            <label for="reward-desc">Beschrijving (optioneel)</label>
            <textarea
              id="reward-desc"
              v-model="newRewardDescription"
              placeholder="Extra informatie over de beloning"
              rows="2"
            ></textarea>
          </div>

          <div class="input-group">
            <label for="reward-points">Benodigde punten</label>
            <input
              id="reward-points"
              v-model.number="newRewardPoints"
              type="number"
              min="0"
              required
            />
          </div>

          <div class="input-group">
            <label>Kies een icoon</label>
            <div class="icon-grid">
              <button
                v-for="icon in commonIcons"
                :key="icon"
                type="button"
                :class="['icon-btn', { selected: newRewardIcon === icon }]"
                @click="newRewardIcon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="emit('close')" class="cancel-btn">
              Annuleren
            </button>
            <button type="submit" class="submit-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Aanmaken & Toekennen
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 0;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  backdrop-filter: blur(10px);
}

h2 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.view-toggle {
  display: flex;
  gap: 0;
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.toggle-btn {
  flex: 1;
  padding: 0.75rem;
  background: white;
  border: 2px solid #e2e8f0;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:first-child {
  border-radius: 10px 0 0 10px;
}

.toggle-btn:last-child {
  border-radius: 0 10px 10px 0;
  border-left: none;
}

.toggle-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-color: #3b82f6;
  color: white;
}

.select-view,
.create-view {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.empty-rewards {
  text-align: center;
  padding: 2rem;
}

.empty-rewards p {
  color: #64748b;
  margin-bottom: 1rem;
}

.create-first-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-first-btn:hover {
  transform: translateY(-2px);
}

.reward-group {
  margin-bottom: 1.5rem;
}

.reward-group h3 {
  font-size: 0.9rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem 0;
  font-weight: 700;
}

.rewards-grid {
  display: grid;
  gap: 0.75rem;
}

.reward-option {
  position: relative;
  cursor: pointer;
}

.reward-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.reward-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: white;
}

.reward-option.affordable:hover .reward-card {
  border-color: #3b82f6;
  transform: translateX(4px);
}

.reward-option input[type="radio"]:checked ~ .reward-card {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.reward-option.locked .reward-card {
  opacity: 0.5;
  cursor: not-allowed;
}

.reward-icon {
  font-size: 2rem;
  line-height: 1;
}

.reward-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reward-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.95rem;
}

.reward-points {
  font-size: 0.85rem;
  color: #f59e0b;
  font-weight: 600;
}

.reward-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.missing-points {
  font-size: 0.8rem;
  color: #dc2626;
  font-weight: 500;
}

.lock-icon {
  font-size: 1.5rem;
  opacity: 0.3;
}

.input-group {
  margin-bottom: 1.25rem;
}

label {
  display: block;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

input[type="text"],
input[type="number"],
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
}

.icon-btn {
  aspect-ratio: 1;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  border-color: #3b82f6;
  transform: scale(1.1);
}

.icon-btn.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background: white;
  color: #475569;
  border: 2px solid #e2e8f0;
}

.cancel-btn:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.submit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-content {
    max-height: 95vh;
  }

  .icon-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
