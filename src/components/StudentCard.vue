<script setup lang="ts">
import type { Student, Attendance, StudentReward } from '../composables/supabase'
import RewardBadge from './RewardBadge.vue'

const props = defineProps<{
  student: Student
  weekDates: string[]
  dayNames: string[]
  studentRewards: StudentReward[]
  getAttendance: (studentId: string, date: string) => Attendance | undefined
}>()

const emit = defineEmits<{
  toggleAttendance: [studentId: string, date: string]
  deleteStudent: [studentId: string]
  assignReward: [studentId: string]
  toggleRewardRedeemed: [studentRewardId: string]
  removeReward: [studentRewardId: string]
}>()

const getStatusClass = (studentId: string, date: string) => {
  const attendance = props.getAttendance(studentId, date)
  if (!attendance) return 'absent'
  return attendance.on_time ? 'on-time' : 'late'
}

const getStatusIcon = (studentId: string, date: string) => {
  const attendance = props.getAttendance(studentId, date)
  if (!attendance) return '–'
  return attendance.on_time ? '✓' : '⚠'
}
</script>

<template>
  <div class="student-row">
    <div class="student-info">
      <div class="avatar">
        {{ student.name.charAt(0).toUpperCase() }}
      </div>
      <div class="name-points">
        <h3>{{ student.name }}</h3>
        <div class="points">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          {{ student.points }} punten
        </div>
        <div v-if="studentRewards.length > 0" class="rewards-list">
          <RewardBadge
            v-for="studentReward in studentRewards"
            :key="studentReward.id"
            :student-reward="studentReward"
            @toggle-redeem="emit('toggleRewardRedeemed', $event)"
            @remove="emit('removeReward', $event)"
          />
        </div>
      </div>
    </div>

    <div class="attendance-grid">
      <button
        v-for="(date, index) in weekDates"
        :key="date"
        :class="['attendance-cell', getStatusClass(student.id, date)]"
        @click="emit('toggleAttendance', student.id, date)"
        :title="`${dayNames[index]}: ${date}`"
      >
        <span class="day-label">{{ dayNames[index] }}</span>
        <span class="status-icon">{{ getStatusIcon(student.id, date) }}</span>
      </button>
    </div>

    <div class="actions">
      <button @click="emit('assignReward', student.id)" class="reward-btn" title="Ken beloning toe">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"></polyline>
          <rect x="2" y="7" width="20" height="5"></rect>
          <line x1="12" y1="22" x2="12" y2="7"></line>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>
      </button>
      <button @click="emit('deleteStudent', student.id)" class="delete-btn" title="Verwijder leerling">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.student-row {
  display: grid;
  grid-template-columns: 280px 1fr 100px;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  align-items: center;
}

.student-row:hover {
  background: #f8fafc;
}

.student-row:last-child {
  border-bottom: none;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.name-points h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.points {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.points svg {
  fill: #fbbf24;
  stroke: #f59e0b;
}

.attendance-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.attendance-cell {
  aspect-ratio: 1;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: white;
  padding: 0.5rem;
  position: relative;
}

.day-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.status-icon {
  font-size: 1.25rem;
  font-weight: 700;
}

.attendance-cell.absent {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.attendance-cell.absent .status-icon {
  color: #cbd5e1;
}

.attendance-cell.absent:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: scale(1.05);
}

.attendance-cell.on-time {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #86efac;
}

.attendance-cell.on-time .status-icon {
  color: #16a34a;
}

.attendance-cell.on-time:hover {
  background: linear-gradient(135deg, #bbf7d0 0%, #86efac 100%);
  transform: scale(1.05);
}

.attendance-cell.late {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fcd34d;
}

.attendance-cell.late .status-icon {
  color: #d97706;
}

.attendance-cell.late:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  transform: scale(1.05);
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.reward-btn,
.delete-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-btn {
  background: #fef3c7;
  color: #d97706;
}

.reward-btn:hover {
  background: #fde68a;
  transform: scale(1.1);
}

.delete-btn {
  background: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fecaca;
  transform: scale(1.1);
}

@media (max-width: 1024px) {
  .student-row {
    grid-template-columns: 200px 1fr 90px;
    gap: 0.75rem;
    padding: 1rem;
  }

  .avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .attendance-grid {
    gap: 0.375rem;
  }

  .attendance-cell {
    padding: 0.375rem;
  }

  .day-label {
    font-size: 0.65rem;
  }

  .status-icon {
    font-size: 1rem;
  }

  .reward-btn,
  .delete-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 768px) {
  .student-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .attendance-grid {
    grid-template-columns: repeat(5, 1fr);
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>
