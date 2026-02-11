<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../composables/supabase'
import type { Student, Attendance } from '../composables/supabase'
import { useAuth } from '../composables/useAuth'
import NavMenu from '../components/NavMenu.vue'

const { user, signOut } = useAuth()
const teacherName = ref('')
const students = ref<Student[]>([])
const allAttendance = ref<Attendance[]>([])
const isLoading = ref(true)
const selectedStudent = ref<Student | null>(null)
const searchQuery = ref('')

const loadTeacherInfo = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('teachers')
    .select('username')
    .eq('id', user.value.id)
    .maybeSingle()
  if (data) teacherName.value = data.username
}

const loadStudents = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('teacher_id', user.value.id)
    .order('name', { ascending: true })
  if (data) students.value = data
}

const loadAllAttendance = async () => {
  if (!user.value || students.value.length === 0) return

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', students.value.map(s => s.id))
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  if (data) allAttendance.value = data
}

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  return students.value.filter(s =>
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const selectedStudentAttendance = computed(() => {
  if (!selectedStudent.value) return []
  return allAttendance.value
    .filter(a => a.student_id === selectedStudent.value!.id)
    .sort((a, b) => b.date.localeCompare(a.date))
})

const selectedStudentStats = computed(() => {
  if (!selectedStudent.value) return null

  const attendance = selectedStudentAttendance.value
  const total = attendance.length
  const onTime = attendance.filter(a => a.on_time).length
  const late = attendance.filter(a => !a.on_time).length
  const rate = total > 0 ? ((onTime / total) * 100).toFixed(1) : '0'

  const last7Days = attendance.slice(0, 7)
  const last7OnTime = last7Days.filter(a => a.on_time).length
  const last7Rate = last7Days.length > 0 ? ((last7OnTime / last7Days.length) * 100).toFixed(1) : '0'

  return {
    total,
    onTime,
    late,
    rate: parseFloat(rate),
    last7Rate: parseFloat(last7Rate)
  }
})

const selectStudent = (student: Student) => {
  selectedStudent.value = student
}

const closeDetail = () => {
  selectedStudent.value = null
}

const handleSignOut = async () => {
  await signOut()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('nl-NL', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(async () => {
  isLoading.value = true
  await loadTeacherInfo()
  await loadStudents()
  await loadAllAttendance()
  isLoading.value = false
})
</script>

<template>
  <div class="students-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-section">
            <div class="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <div>
              <h1>Leerling Profielen</h1>
              <p v-if="teacherName" class="welcome">{{ teacherName }}</p>
            </div>
          </div>
        </div>
        <div class="header-right">
          <NavMenu />
          <button @click="handleSignOut" class="logout-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Uitloggen
          </button>
        </div>
      </div>
    </header>

    <main class="page-main">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Leerlingen laden...</p>
      </div>

      <div v-else class="content">
        <div class="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Zoek leerling..."
            class="search-input"
          />
        </div>

        <div v-if="filteredStudents.length === 0" class="empty-state">
          <p>Geen leerlingen gevonden</p>
        </div>

        <div v-else class="students-grid">
          <div
            v-for="student in filteredStudents"
            :key="student.id"
            @click="selectStudent(student)"
            class="student-card"
          >
            <div class="student-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="student-info">
              <h3>{{ student.name }}</h3>
              <div class="student-points">{{ student.points }} punten</div>
            </div>
            <div class="student-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="selectedStudent" class="detail-modal" @click.self="closeDetail">
      <div class="detail-content">
        <button @click="closeDetail" class="close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="detail-header">
          <div class="detail-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2>{{ selectedStudent.name }}</h2>
          <div class="detail-points">{{ selectedStudent.points }} totale punten</div>
        </div>

        <div v-if="selectedStudentStats" class="detail-stats">
          <div class="detail-stat-card">
            <div class="detail-stat-value">{{ selectedStudentStats.rate }}%</div>
            <div class="detail-stat-label">Op tijd percentage (30 dagen)</div>
          </div>
          <div class="detail-stat-card">
            <div class="detail-stat-value">{{ selectedStudentStats.last7Rate }}%</div>
            <div class="detail-stat-label">Laatste 7 dagen</div>
          </div>
          <div class="detail-stat-card">
            <div class="detail-stat-value green">{{ selectedStudentStats.onTime }}</div>
            <div class="detail-stat-label">Dagen op tijd</div>
          </div>
          <div class="detail-stat-card">
            <div class="detail-stat-value yellow">{{ selectedStudentStats.late }}</div>
            <div class="detail-stat-label">Dagen te laat</div>
          </div>
        </div>

        <div class="attendance-history">
          <h3>Aanwezigheidsgeschiedenis (Laatste 30 dagen)</h3>
          <div v-if="selectedStudentAttendance.length === 0" class="no-history">
            Nog geen aanwezigheidsgegevens
          </div>
          <div v-else class="history-list">
            <div
              v-for="record in selectedStudentAttendance"
              :key="record.id"
              class="history-item"
            >
              <div class="history-date">{{ formatDate(record.date) }}</div>
              <div :class="['history-status', record.on_time ? 'on-time' : 'late']">
                {{ record.on_time ? 'Op tijd' : 'Te laat' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.students-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%);
}

.page-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 48px;
  height: 48px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.welcome {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  opacity: 0.8;
  font-weight: 500;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.page-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.search-bar {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-bar svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #0f172a;
  background: transparent;
}

.search-input::placeholder {
  color: #94a3b8;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-size: 1.125rem;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.student-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.student-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.student-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
}

.student-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.student-points {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  display: inline-block;
}

.student-arrow {
  color: #cbd5e1;
  flex-shrink: 0;
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(4px);
}

.detail-content {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: #f1f5f9;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
  transform: scale(1.1);
}

.detail-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #f1f5f9;
}

.detail-avatar {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 1rem;
}

.detail-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
}

.detail-points {
  font-size: 1rem;
  font-weight: 600;
  color: #3b82f6;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-stat-card {
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 12px;
  text-align: center;
}

.detail-stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.detail-stat-value.green {
  color: #10b981;
}

.detail-stat-value.yellow {
  color: #f59e0b;
}

.detail-stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.attendance-history h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1rem 0;
}

.no-history {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: #f1f5f9;
}

.history-date {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.history-status {
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.375rem 0.875rem;
  border-radius: 8px;
}

.history-status.on-time {
  background: #d1fae5;
  color: #059669;
}

.history-status.late {
  background: #fef3c7;
  color: #d97706;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
  }

  .students-grid {
    grid-template-columns: 1fr;
  }

  .detail-modal {
    padding: 1rem;
  }

  .detail-content {
    padding: 1.5rem;
  }

  .detail-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
