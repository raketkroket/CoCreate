<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/supabase'
import type { Student, Attendance } from '../composables/supabase'
import { useAuth } from '../composables/useAuth'
import NavMenu from '../components/NavMenu.vue'

const router = useRouter()
const { user, signOut } = useAuth()
const teacherName = ref('')
const students = ref<Student[]>([])
const allAttendance = ref<Attendance[]>([])
const isLoading = ref(true)
const selectedTimeframe = ref('month')

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
  if (data) students.value = data
}

const loadAllAttendance = async () => {
  if (!user.value || students.value.length === 0) return

  const startDate = new Date()
  if (selectedTimeframe.value === 'week') {
    startDate.setDate(startDate.getDate() - 7)
  } else if (selectedTimeframe.value === 'month') {
    startDate.setMonth(startDate.getMonth() - 1)
  } else {
    startDate.setMonth(startDate.getMonth() - 3)
  }

  const { data } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', students.value.map(s => s.id))
    .gte('date', startDate.toISOString().split('T')[0])

  if (data) allAttendance.value = data
}

const stats = computed(() => {
  const totalDays = allAttendance.value.length
  const onTimeDays = allAttendance.value.filter(a => a.on_time).length
  const lateDays = allAttendance.value.filter(a => !a.on_time).length
  const avgAttendanceRate = students.value.length > 0
    ? ((totalDays / (students.value.length * getExpectedDays())) * 100).toFixed(1)
    : '0'

  return {
    totalDays,
    onTimeDays,
    lateDays,
    avgAttendanceRate: parseFloat(avgAttendanceRate)
  }
})

const getExpectedDays = () => {
  if (selectedTimeframe.value === 'week') return 5
  if (selectedTimeframe.value === 'month') return 20
  return 60
}

const studentStats = computed(() => {
  return students.value.map(student => {
    const studentAttendance = allAttendance.value.filter(a => a.student_id === student.id)
    const onTime = studentAttendance.filter(a => a.on_time).length
    const late = studentAttendance.filter(a => !a.on_time).length
    const total = studentAttendance.length
    const rate = total > 0 ? ((onTime / total) * 100).toFixed(1) : '0'

    return {
      student,
      onTime,
      late,
      total,
      rate: parseFloat(rate)
    }
  }).sort((a, b) => b.rate - a.rate)
})

const weeklyTrends = computed(() => {
  const trends: { [key: string]: { onTime: number; late: number; total: number } } = {}

  allAttendance.value.forEach(record => {
    const date = new Date(record.date)
    const weekStart = new Date(date)
    const dayOfWeek = date.getDay()
    weekStart.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!trends[weekKey]) {
      trends[weekKey] = { onTime: 0, late: 0, total: 0 }
    }

    trends[weekKey].total++
    if (record.on_time) {
      trends[weekKey].onTime++
    } else {
      trends[weekKey].late++
    }
  })

  return Object.entries(trends)
    .map(([week, data]) => ({
      week,
      ...data,
      rate: ((data.onTime / data.total) * 100).toFixed(1)
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
})

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (err) {
    console.error('Error signing out:', err)
  }
}

const changeTimeframe = async (timeframe: string) => {
  selectedTimeframe.value = timeframe
  await loadAllAttendance()
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
  <div class="reports-page">
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
              <h1>Rapporten & Analyses</h1>
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
        <p>Rapporten laden...</p>
      </div>

      <div v-else class="content">
        <div class="timeframe-selector">
          <button
            @click="changeTimeframe('week')"
            :class="['timeframe-btn', { active: selectedTimeframe === 'week' }]"
          >
            Afgelopen Week
          </button>
          <button
            @click="changeTimeframe('month')"
            :class="['timeframe-btn', { active: selectedTimeframe === 'month' }]"
          >
            Afgelopen Maand
          </button>
          <button
            @click="changeTimeframe('quarter')"
            :class="['timeframe-btn', { active: selectedTimeframe === 'quarter' }]"
          >
            Afgelopen 3 Maanden
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalDays }}</div>
              <div class="stat-label">Totaal Dagen</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.onTimeDays }}</div>
              <div class="stat-label">Op Tijd</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon yellow">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.lateDays }}</div>
              <div class="stat-label">Te Laat</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.avgAttendanceRate }}%</div>
              <div class="stat-label">Gemiddelde Aanwezigheid</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Prestaties per Leerling</h2>
          <div class="student-stats-container">
            <div v-for="stat in studentStats" :key="stat.student.id" class="student-stat-card">
              <div class="student-stat-header">
                <div class="student-name">{{ stat.student.name }}</div>
                <div class="student-points">{{ stat.student.points }} punten</div>
              </div>
              <div class="stat-row">
                <span class="stat-label-small">Totaal:</span>
                <span class="stat-value-small">{{ stat.total }} dagen</span>
              </div>
              <div class="stat-row">
                <span class="stat-label-small">Op tijd:</span>
                <span class="stat-value-small green">{{ stat.onTime }} dagen</span>
              </div>
              <div class="stat-row">
                <span class="stat-label-small">Te laat:</span>
                <span class="stat-value-small yellow">{{ stat.late }} dagen</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: stat.rate + '%' }"></div>
              </div>
              <div class="rate-label">{{ stat.rate }}% op tijd</div>
            </div>
          </div>
        </div>

        <div v-if="weeklyTrends.length > 0" class="section">
          <h2>Wekelijkse Trends</h2>
          <div class="trends-container">
            <div v-for="trend in weeklyTrends" :key="trend.week" class="trend-card">
              <div class="trend-week">Week van {{ new Date(trend.week).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) }}</div>
              <div class="trend-stats">
                <div class="trend-stat">
                  <span class="trend-label">Totaal:</span>
                  <span class="trend-value">{{ trend.total }}</span>
                </div>
                <div class="trend-stat">
                  <span class="trend-label">Op tijd:</span>
                  <span class="trend-value green">{{ trend.onTime }}</span>
                </div>
                <div class="trend-stat">
                  <span class="trend-label">Te laat:</span>
                  <span class="trend-value yellow">{{ trend.late }}</span>
                </div>
              </div>
              <div class="trend-rate">{{ trend.rate }}% op tijd</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.reports-page {
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

.timeframe-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 0.5rem;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: fit-content;
}

.timeframe-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.timeframe-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.timeframe-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.stat-icon.yellow {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.stat-icon.purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
  margin-top: 0.25rem;
}

.section {
  margin-bottom: 2rem;
}

.section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.5rem 0;
}

.student-stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.student-stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.student-stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.student-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.student-name {
  font-size: 1.125rem;
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
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.stat-label-small {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
}

.stat-value-small {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.stat-value-small.green {
  color: #10b981;
}

.stat-value-small.yellow {
  color: #f59e0b;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0 0.5rem 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.rate-label {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #10b981;
}

.trends-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.trend-card {
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.trend-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.trend-week {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f1f5f9;
}

.trend-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.trend-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trend-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.trend-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.trend-value.green {
  color: #10b981;
}

.trend-value.yellow {
  color: #f59e0b;
}

.trend-rate {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.5rem;
  border-radius: 8px;
  margin-top: 0.75rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
  }

  .timeframe-selector {
    width: 100%;
    flex-direction: column;
  }

  .timeframe-btn {
    width: 100%;
  }
}
</style>
