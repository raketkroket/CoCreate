<script setup lang="ts">
import { computed } from 'vue'
import type { Student, Attendance } from '../composables/supabase'

const props = defineProps<{
  student: Student
  weekDates: string[]
  dayNames: string[]
  getAttendance: (studentId: string, date: string) => Attendance | undefined
}>()

const emit = defineEmits<{
  toggleAttendance: [studentId: string, date: string]
  deleteStudent: [studentId: string]
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

const achievementLevel = computed(() => {
  const points = props.student.points
  if (points >= 100) return { name: 'Meester', icon: '👑', color: '#f59e0b' }
  if (points >= 75) return { name: 'Expert', icon: '🏆', color: '#8b5cf6' }
  if (points >= 50) return { name: 'Pro', icon: '⭐', color: '#3b82f6' }
  if (points >= 25) return { name: 'Starter', icon: '🌟', color: '#10b981' }
  return { name: 'Beginner', icon: '🎯', color: '#64748b' }
})

const pointsProgress = computed(() => {
  const points = props.student.points
  const nextMilestone = points < 25 ? 25 : points < 50 ? 50 : points < 75 ? 75 : points < 100 ? 100 : 150
  const prevMilestone = points < 25 ? 0 : points < 50 ? 25 : points < 75 ? 50 : points < 100 ? 75 : 100
  const progress = ((points - prevMilestone) / (nextMilestone - prevMilestone)) * 100
  return { progress: Math.min(progress, 100), nextMilestone }
})

const gridColumns = computed(() => props.weekDates.length)
</script>

<template>
  <div class="student-row">
    <div class="student-info">
      <div class="avatar-container">
        <div class="avatar">
          {{ student.name.charAt(0).toUpperCase() }}
        </div>
        <div class="achievement-badge" :style="{ background: achievementLevel.color }">
          <span class="achievement-icon">{{ achievementLevel.icon }}</span>
        </div>
      </div>
      <div class="name-points">
        <div class="header-row">
          <h3>{{ student.name }}</h3>
          <span class="achievement-label" :style="{ color: achievementLevel.color }">
            {{ achievementLevel.name }}
          </span>
        </div>
        <div class="points-section">
          <div class="points">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span class="points-value">{{ student.points }}</span>
            <span class="points-label">punten</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: pointsProgress.progress + '%' }"></div>
          </div>
          <span class="progress-label">{{ pointsProgress.nextMilestone }} punten</span>
        </div>
      </div>
    </div>

    <div class="attendance-grid" :style="{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
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
  grid-template-columns: 280px 1fr 80px;
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
  align-items: flex-start;
  gap: 1rem;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  border: 3px solid white;
}

.achievement-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.achievement-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.name-points {
  flex: 1;
  min-width: 0;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.name-points h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.achievement-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: currentColor;
  color: white !important;
  opacity: 0.9;
}

.points-section {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.points {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.points svg {
  fill: #fbbf24;
  stroke: #f59e0b;
  flex-shrink: 0;
}

.points-value {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.points-label {
  color: #64748b;
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

.attendance-grid {
  display: grid;
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

.actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

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
  background: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fecaca;
  transform: scale(1.1);
}

@media (max-width: 1024px) {
  .student-row {
    grid-template-columns: 200px 1fr 80px;
    gap: 0.75rem;
    padding: 1rem;
  }

  .avatar {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }

  .achievement-badge {
    width: 20px;
    height: 20px;
  }

  .achievement-icon {
    font-size: 0.65rem;
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

  .actions {
    justify-content: flex-start;
  }
}
</style>
