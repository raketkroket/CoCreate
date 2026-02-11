<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/supabase'
import type { Student, Attendance } from '../composables/supabase'
import { useAuth } from '../composables/useAuth'
import { useConfetti } from '../composables/useConfetti'
import NavMenu from '../components/NavMenu.vue'

const router = useRouter()
const { user, signOut } = useAuth()
const { celebrate } = useConfetti()
const teacherName = ref('')
const students = ref<Student[]>([])
const allAttendance = ref<Attendance[]>([])
const isLoading = ref(true)
const selectedPeriod = ref('all')

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

  let startDate = new Date()
  if (selectedPeriod.value === 'week') {
    startDate.setDate(startDate.getDate() - 7)
  } else if (selectedPeriod.value === 'month') {
    startDate.setMonth(startDate.getMonth() - 1)
  } else {
    startDate.setFullYear(startDate.getFullYear() - 10)
  }

  const { data } = await supabase
    .from('attendance')
    .select('*')
    .in('student_id', students.value.map(s => s.id))
    .gte('date', startDate.toISOString().split('T')[0])

  if (data) allAttendance.value = data
}

const leaderboard = computed(() => {
  return students.value.map(student => {
    const studentAttendance = allAttendance.value.filter(a => a.student_id === student.id)
    const onTime = studentAttendance.filter(a => a.on_time).length
    const late = studentAttendance.filter(a => !a.on_time).length
    const total = studentAttendance.length
    const rate = total > 0 ? ((onTime / total) * 100) : 0

    return {
      student,
      onTime,
      late,
      total,
      rate,
      points: student.points
    }
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.rate - a.rate
  })
})

const topThree = computed(() => leaderboard.value.slice(0, 3))
const restOfLeaderboard = computed(() => leaderboard.value.slice(3))

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (err) {
    console.error('Error signing out:', err)
  }
}

const changePeriod = async (period: string) => {
  selectedPeriod.value = period
  await loadAllAttendance()
}

const celebrateWinner = () => {
  celebrate()
}

onMounted(async () => {
  isLoading.value = true
  await loadTeacherInfo()
  await loadStudents()
  await loadAllAttendance()
  isLoading.value = false
  if (topThree.value.length > 0) {
    setTimeout(celebrateWinner, 500)
  }
})
</script>

<template>
  <div class="leaderboard-page">
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
              <h1>Ranglijst</h1>
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
        <p>Ranglijst laden...</p>
      </div>

      <div v-else class="content">
        <div class="period-selector">
          <button
            @click="changePeriod('week')"
            :class="['period-btn', { active: selectedPeriod === 'week' }]"
          >
            Deze Week
          </button>
          <button
            @click="changePeriod('month')"
            :class="['period-btn', { active: selectedPeriod === 'month' }]"
          >
            Deze Maand
          </button>
          <button
            @click="changePeriod('all')"
            :class="['period-btn', { active: selectedPeriod === 'all' }]"
          >
            Altijd
          </button>
        </div>

        <div v-if="topThree.length > 0" class="podium">
          <div v-if="topThree[1]" class="podium-place second">
            <div class="podium-medal">🥈</div>
            <div class="podium-avatar silver">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="podium-name">{{ topThree[1].student.name }}</div>
            <div class="podium-points">{{ topThree[1].points }} punten</div>
            <div class="podium-rate">{{ topThree[1].rate.toFixed(1) }}% op tijd</div>
            <div class="podium-rank">#2</div>
          </div>

          <div v-if="topThree[0]" class="podium-place first">
            <div class="podium-crown">👑</div>
            <div class="podium-medal">🥇</div>
            <div class="podium-avatar gold">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="podium-name">{{ topThree[0].student.name }}</div>
            <div class="podium-points">{{ topThree[0].points }} punten</div>
            <div class="podium-rate">{{ topThree[0].rate.toFixed(1) }}% op tijd</div>
            <div class="podium-rank">#1</div>
          </div>

          <div v-if="topThree[2]" class="podium-place third">
            <div class="podium-medal">🥉</div>
            <div class="podium-avatar bronze">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="podium-name">{{ topThree[2].student.name }}</div>
            <div class="podium-points">{{ topThree[2].points }} punten</div>
            <div class="podium-rate">{{ topThree[2].rate.toFixed(1) }}% op tijd</div>
            <div class="podium-rank">#3</div>
          </div>
        </div>

        <div v-if="restOfLeaderboard.length > 0" class="rest-of-leaderboard">
          <h2>Overige Ranglijst</h2>
          <div class="leaderboard-list">
            <div
              v-for="(entry, index) in restOfLeaderboard"
              :key="entry.student.id"
              class="leaderboard-item"
            >
              <div class="rank-number">{{ index + 4 }}</div>
              <div class="student-avatar-small">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="student-info-leaderboard">
                <div class="student-name-leaderboard">{{ entry.student.name }}</div>
                <div class="student-stats-leaderboard">
                  <span>{{ entry.points }} punten</span>
                  <span class="separator">•</span>
                  <span>{{ entry.rate.toFixed(1) }}% op tijd</span>
                </div>
              </div>
              <div class="progress-mini">
                <div class="progress-mini-fill" :style="{ width: entry.rate + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="leaderboard.length === 0" class="empty-state">
          <p>Nog geen gegevens om een ranglijst te tonen</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.leaderboard-page {
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

.period-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
  background: white;
  padding: 0.5rem;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: fit-content;
}

.period-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.period-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.period-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.podium {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
  align-items: end;
}

.podium-place {
  background: white;
  padding: 2rem 1.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
}

.podium-place:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.podium-place.first {
  order: 2;
  transform: scale(1.1);
  z-index: 2;
}

.podium-place.first:hover {
  transform: scale(1.1) translateY(-8px);
}

.podium-place.second {
  order: 1;
}

.podium-place.third {
  order: 3;
}

.podium-crown {
  font-size: 2.5rem;
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

.podium-medal {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.podium-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 1rem;
  border: 4px solid;
}

.podium-avatar.gold {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-color: #fef3c7;
}

.podium-avatar.silver {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
  border-color: #f1f5f9;
}

.podium-avatar.bronze {
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  border-color: #fed7aa;
}

.podium-place.first .podium-avatar {
  width: 96px;
  height: 96px;
}

.podium-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.podium-points {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.podium-rate {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
}

.podium-rank {
  position: absolute;
  bottom: -1rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  border: 4px solid #f8fafc;
}

.podium-place.first .podium-rank {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.podium-place.second .podium-rank {
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
}

.podium-place.third .podium-rank {
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
}

.rest-of-leaderboard h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.5rem 0;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.leaderboard-item {
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: grid;
  grid-template-columns: 48px 48px 1fr 120px;
  gap: 1rem;
  align-items: center;
  transition: all 0.3s ease;
}

.leaderboard-item:hover {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rank-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #cbd5e1;
  text-align: center;
}

.student-avatar-small {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.student-info-leaderboard {
  flex: 1;
}

.student-name-leaderboard {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.student-stats-leaderboard {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.separator {
  color: #cbd5e1;
}

.progress-mini {
  width: 120px;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.progress-mini-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
  }

  .podium {
    grid-template-columns: 1fr;
  }

  .podium-place.first {
    order: 1;
    transform: scale(1);
  }

  .podium-place.second {
    order: 2;
  }

  .podium-place.third {
    order: 3;
  }

  .leaderboard-item {
    grid-template-columns: 40px 40px 1fr;
    gap: 0.75rem;
  }

  .progress-mini {
    grid-column: 3 / 4;
    width: 100%;
    margin-top: 0.5rem;
  }

  .period-selector {
    width: 100%;
    flex-direction: column;
  }

  .period-btn {
    width: 100%;
  }
}
</style>
