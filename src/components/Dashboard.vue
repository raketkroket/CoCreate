<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/supabase'
import type { Student, Attendance, Reward, StudentReward } from '../composables/supabase'
import { useAuth } from '../composables/useAuth'
import { useConfetti } from '../composables/useConfetti'
import StudentCard from './StudentCard.vue'
import AddStudentModal from './AddStudentModal.vue'
import AssignRewardModal from './AssignRewardModal.vue'
import NavMenu from './NavMenu.vue'
import StatCard from './StatCard.vue'

const router = useRouter()
const { user, signOut } = useAuth()
const { celebrate } = useConfetti()

const students = ref<Student[]>([])
const attendanceRecords = ref<Attendance[]>([])
const weeklyBonuses = ref<{ student_id: string; week_start_date: string }[]>([])
const rewards = ref<Reward[]>([])
const studentRewards = ref<StudentReward[]>([])
const isLoading = ref(true)
const showAddModal = ref(false)
const showRewardModal = ref(false)
const selectedStudentId = ref<string | null>(null)
const teacherName = ref('')
const currentWeekOffset = ref(0)
const processingAttendance = ref<Set<string>>(new Set())

const settings = ref({
  points_on_time: 2,
  points_late: -2,
  points_absent: -5
})

const getWeekDates = (weekOffset: number) => {
  const dates = []
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (weekOffset * 7))
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

const weekDates = computed(() => getWeekDates(currentWeekOffset.value))

const weekLabel = computed(() => {
  if (currentWeekOffset.value === 0) return 'Deze Week'
  if (currentWeekOffset.value === 1) return 'Volgende Week'
  if (currentWeekOffset.value === -1) return 'Vorige Week'
  if (currentWeekOffset.value > 1) return `Over ${currentWeekOffset.value} weken`
  return `${Math.abs(currentWeekOffset.value)} weken geleden`
})

const weekDateRange = computed(() => {
  const firstDate = new Date(weekDates.value[0])
  const lastDate = new Date(weekDates.value[4])
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${firstDate.toLocaleDateString('nl-NL', options)} - ${lastDate.toLocaleDateString('nl-NL', options)}`
})

const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr']

const getStudentWeekDates = (student: Student) => {
  const noFridayStudents = ['Hans', 'Billy', 'Niek']
  if (noFridayStudents.includes(student.name)) {
    return weekDates.value.slice(0, 4)
  }
  return weekDates.value
}

const getStudentDayNames = (student: Student) => {
  const noFridayStudents = ['Hans', 'Billy', 'Niek']
  if (noFridayStudents.includes(student.name)) {
    return dayNames.slice(0, 4)
  }
  return dayNames
}

const loadTeacherInfo = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('teachers')
    .select('username')
    .eq('id', user.value.id)
    .maybeSingle()
  if (data) teacherName.value = data.username
}

const loadSettings = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('teacher_settings')
    .select('points_on_time, points_late, points_absent')
    .eq('user_id', user.value.id)
    .maybeSingle()
  if (data) {
    settings.value = {
      points_on_time: data.points_on_time,
      points_late: data.points_late,
      points_absent: data.points_absent
    }
  }
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

const loadAttendance = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('attendance')
    .select('*')
    .in('date', weekDates.value)
  if (data) attendanceRecords.value = data
}

const loadWeeklyBonuses = async () => {
  if (!user.value) return
  const weekStart = weekDates.value[0]
  const { data } = await supabase
    .from('weekly_bonuses')
    .select('student_id, week_start_date')
    .eq('week_start_date', weekStart)
  if (data) weeklyBonuses.value = data
}

const loadRewards = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('rewards')
    .select('*')
    .eq('teacher_id', user.value.id)
    .order('points_required', { ascending: true })
  if (data) rewards.value = data
}

const loadStudentRewards = async () => {
  if (!user.value) return
  const { data } = await supabase
    .from('student_rewards')
    .select('*, reward:rewards(*)')
    .order('assigned_at', { ascending: false })
  if (data) studentRewards.value = data
}

const getStudentRewards = (studentId: string) => {
  return studentRewards.value.filter(sr => sr.student_id === studentId)
}

const getAttendance = (studentId: string, date: string) => {
  return attendanceRecords.value.find(
    a => a.student_id === studentId && a.date === date
  )
}

const toggleAttendance = async (studentId: string, date: string) => {
  const lockKey = `${studentId}-${date}`
  if (processingAttendance.value.has(lockKey)) return

  processingAttendance.value.add(lockKey)

  const existing = getAttendance(studentId, date)
  const student = students.value.find(s => s.id === studentId)
  if (!student) {
    processingAttendance.value.delete(lockKey)
    return
  }

  try {
    const weekStart = weekDates.value[0]
    const hadBonus = weeklyBonuses.value.some(
      b => b.student_id === studentId && b.week_start_date === weekStart
    )

    if (existing) {
      if (existing.on_time) {
        if (hadBonus) {
          await supabase
            .from('weekly_bonuses')
            .delete()
            .eq('student_id', studentId)
            .eq('week_start_date', weekStart)
          weeklyBonuses.value = weeklyBonuses.value.filter(
            b => !(b.student_id === studentId && b.week_start_date === weekStart)
          )

          await supabase
            .from('attendance')
            .delete()
            .eq('id', existing.id)
          const pointsChange = -settings.value.points_on_time - 5
          const { data: updatedStudent } = await supabase
            .from('students')
            .update({ points: student.points + pointsChange })
            .eq('id', studentId)
            .select('points')
            .single()
          attendanceRecords.value = attendanceRecords.value.filter(a => a.id !== existing.id)
          if (updatedStudent) student.points = updatedStudent.points
        } else {
          await supabase
            .from('attendance')
            .update({ on_time: false })
            .eq('id', existing.id)
          const pointsChange = -settings.value.points_on_time + settings.value.points_late
          const { data: updatedStudent } = await supabase
            .from('students')
            .update({ points: student.points + pointsChange })
            .eq('id', studentId)
            .select('points')
            .single()
          existing.on_time = false
          if (updatedStudent) student.points = updatedStudent.points
        }
      } else {
        await supabase
          .from('attendance')
          .delete()
          .eq('id', existing.id)
        const pointsChange = -settings.value.points_late
        const { data: updatedStudent } = await supabase
          .from('students')
          .update({ points: student.points + pointsChange })
          .eq('id', studentId)
          .select('points')
          .single()
        attendanceRecords.value = attendanceRecords.value.filter(a => a.id !== existing.id)
        if (updatedStudent) student.points = updatedStudent.points
      }
    } else {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date,
          on_time: true
        })
        .select()
        .single()

      if (error) {
        console.error('Attendance insert failed:', error)
        return
      }

      const { data: updatedStudent } = await supabase
        .from('students')
        .update({ points: student.points + settings.value.points_on_time })
        .eq('id', studentId)
        .select('points')
        .single()

      if (data) {
        attendanceRecords.value.push(data)
      }
      if (updatedStudent) student.points = updatedStudent.points
    }

    await checkWeeklyBonus(studentId)
  } catch (err) {
    console.error('Error toggling attendance:', err)
  } finally {
    processingAttendance.value.delete(lockKey)
  }
}

const checkWeeklyBonus = async (studentId: string) => {
  const student = students.value.find(s => s.id === studentId)
  if (!student) return

  const weekStart = weekDates.value[0]
  const alreadyAwarded = weeklyBonuses.value.some(
    b => b.student_id === studentId && b.week_start_date === weekStart
  )

  if (alreadyAwarded) return

  const studentWeekDates = getStudentWeekDates(student)
  const weekAttendance = studentWeekDates.map(date => getAttendance(studentId, date))

  if (weekAttendance.every(a => a !== undefined)) {
    const allOnTime = weekAttendance.every(a => a?.on_time === true)

    if (allOnTime) {
      const newPoints = student.points + 5
      await supabase
        .from('students')
        .update({ points: newPoints })
        .eq('id', studentId)

      await supabase
        .from('weekly_bonuses')
        .insert({
          student_id: studentId,
          week_start_date: weekStart
        })

      weeklyBonuses.value.push({ student_id: studentId, week_start_date: weekStart })
      student.points = newPoints
      celebrate()
      console.log('Perfecte week! +5 punten en confetti 🎉')
    }
  }
}

const addStudent = async (name: string) => {
  if (!user.value) return
  try {
    const { data } = await supabase
      .from('students')
      .insert({
        teacher_id: user.value.id,
        name,
        points: 0
      })
      .select()
      .single()
    if (data) {
      students.value.push(data)
      showAddModal.value = false
    }
  } catch (err) {
    console.error('Error adding student:', err)
  }
}

const deleteStudent = async (studentId: string) => {
  if (!confirm('Weet je zeker dat je deze leerling wilt verwijderen?')) {
    return
  }
  try {
    await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
    students.value = students.value.filter(s => s.id !== studentId)
    attendanceRecords.value = attendanceRecords.value.filter(a => a.student_id !== studentId)
  } catch (err) {
    console.error('Error deleting student:', err)
  }
}

const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (err) {
    console.error('Error signing out:', err)
  }
}

const changeWeek = async (offset: number) => {
  currentWeekOffset.value += offset
  await loadAttendance()
  await loadWeeklyBonuses()
}

const goToCurrentWeek = async () => {
  currentWeekOffset.value = 0
  await loadAttendance()
  await loadWeeklyBonuses()
}

// Reward modal functions
const openRewardModal = (studentId: string) => {
  selectedStudentId.value = studentId
  showRewardModal.value = true
}

const closeRewardModal = () => {
  showRewardModal.value = false
  selectedStudentId.value = null
}

const selectedStudent = computed(() => {
  return students.value.find(s => s.id === selectedStudentId.value)
})

const totalStudents = computed(() => students.value.length)

const attendanceRate = computed(() => {
  if (students.value.length === 0 || weekDates.value.length === 0) return '0%'

  const totalPossible = students.value.length * weekDates.value.length
  const totalPresent = attendanceRecords.value.length

  if (totalPossible === 0) return '0%'

  const rate = (totalPresent / totalPossible) * 100
  return `${Math.round(rate)}%`
})

const totalPoints = computed(() => {
  return students.value.reduce((sum, student) => sum + student.points, 0)
})

const activeRewards = computed(() => {
  return studentRewards.value.filter(sr => !sr.redeemed).length
})

const icons = {
  students: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  attendance: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  points: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  rewards: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>'
}

const handleAssignReward = async (rewardId: string) => {
  if (!selectedStudentId.value) return
  try {
    const { data } = await supabase
      .from('student_rewards')
      .insert({
        student_id: selectedStudentId.value,
        reward_id: rewardId,
        redeemed: false
      })
      .select(`
        *,
        reward:rewards(*)
      `)
      .single()

    if (data) {
      studentRewards.value.push(data)
      closeRewardModal()
    }
  } catch (err) {
    console.error('Error assigning reward:', err)
  }
}

const handleCreateAndAssign = async (
  name: string,
  description: string,
  pointsRequired: number,
  icon: string
) => {
  if (!selectedStudentId.value || !user.value) return
  try {
    const { data: newReward, error: createError } = await supabase
      .from('rewards')
      .insert({
        teacher_id: user.value.id,
        name,
        description,
        points_required: pointsRequired,
        icon
      })
      .select()
      .single()
    if (createError) throw createError

    rewards.value.push(newReward)
    await handleAssignReward(newReward.id)
  } catch (err) {
    console.error('Error creating/assigning reward:', err)
  }
}

const toggleRewardRedeemed = async (studentRewardId: string) => {
  const studentReward = studentRewards.value.find(sr => sr.id === studentRewardId)
  if (!studentReward) return

  try {
    const newRedeemed = !studentReward.redeemed
    await supabase
      .from('student_rewards')
      .update({
        redeemed: newRedeemed,
        redeemed_at: newRedeemed ? new Date().toISOString() : null
      })
      .eq('id', studentRewardId)

    studentReward.redeemed = newRedeemed
    studentReward.redeemed_at = newRedeemed ? new Date().toISOString() : null
  } catch (err) {
    console.error('Error toggling reward:', err)
  }
}

const removeReward = async (studentRewardId: string) => {
  if (!confirm('Weet je zeker dat je deze beloning wilt verwijderen?')) {
    return
  }

  try {
    await supabase
      .from('student_rewards')
      .delete()
      .eq('id', studentRewardId)

    studentRewards.value = studentRewards.value.filter(sr => sr.id !== studentRewardId)
  } catch (err) {
    console.error('Error removing reward:', err)
  }
}
 
onMounted(async () => {
  isLoading.value = true
  await loadSettings()
  await loadTeacherInfo()
  await loadStudents()
  await loadAttendance()
  await loadWeeklyBonuses()
  await loadRewards()
  await loadStudentRewards()
  isLoading.value = false
})
</script>
<template>
  
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-section">
            <div class="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
          </div>
          <div>
            <h1>Docenten Dashboard</h1>
            <p v-if="teacherName" class="welcome">{{ teacherName }}</p>
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

    <main class="dashboard-main">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Laden...</p>
      </div>

      <div v-else class="content">
        <div class="controls-bar">
          <button @click="showAddModal = true" class="add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Leerling Toevoegen
          </button>

          <div class="week-navigation">
            <button @click="changeWeek(-1)" class="nav-btn" title="Vorige week">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div class="week-info">
              <span class="week-label">{{ weekLabel }}</span>
              <span class="week-dates">{{ weekDateRange }}</span>
            </div>

            <button
              v-if="currentWeekOffset !== 0"
              @click="goToCurrentWeek"
              class="today-btn"
              title="Ga naar huidige week"
            >
              Vandaag
            </button>
            
            <button @click="changeWeek(1)" class="nav-btn" title="Volgende week">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="students.length > 0" class="stats-grid">
          <StatCard
            title="Totaal Leerlingen"
            :value="totalStudents"
            :icon="icons.students"
            color="blue"
          />
          <StatCard
            title="Aanwezigheid"
            :value="attendanceRate"
            :icon="icons.attendance"
            color="green"
          />
          <StatCard
            title="Totaal Punten"
            :value="totalPoints"
            :icon="icons.points"
            color="purple"
          />
          <StatCard
            title="Actieve Beloningen"
            :value="activeRewards"
            :icon="icons.rewards"
            color="orange"
          />
        </div>

        <div v-if="students.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h2>Nog geen leerlingen</h2>
          <p>Begin met het toevoegen van je eerste leerling om de aanwezigheid bij te houden</p>
          <button @click="showAddModal = true" class="add-btn-large">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Voeg je eerste leerling toe
          </button>
        </div>

        <div v-else class="students-container">
          <div class="week-header">
            <div class="student-name-col">Leerling</div>
            <div class="attendance-cols">
              <div v-for="(day, index) in dayNames" :key="index" class="day-col">
                <span class="day-name">{{ day }}</span>
                <span class="day-date">{{ new Date(weekDates[index]).getDate() }}</span>
              </div>
            </div>
            <div class="actions-col">Acties</div>
          </div>

          <StudentCard
            v-for="student in students"
            :key="student.id"
            :student="student"
            :week-dates="getStudentWeekDates(student)"
            :day-names="getStudentDayNames(student)"
            :student-rewards="getStudentRewards(student.id)"
            :get-attendance="getAttendance"
            @toggle-attendance="toggleAttendance"
            @delete-student="deleteStudent"
            @assign-reward="openRewardModal"
            @toggle-reward-redeemed="toggleRewardRedeemed"
            @remove-reward="removeReward"
          />
        </div>
      </div>
    </main>

    <AddStudentModal
      v-if="showAddModal"
      @add="addStudent"
      @close="showAddModal = false"
    />

    <div>
      <AssignRewardModal
        v-if="showRewardModal && selectedStudent"
        :student="selectedStudent"
        :available-rewards="rewards"
        @assign="handleAssignReward"
        @create-and-assign="handleCreateAndAssign"
        @close="closeRewardModal"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%);
}

.dashboard-header {
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

.dashboard-main {
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

.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.add-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.week-navigation {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0.5rem;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-btn,
.today-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f1f5f9;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.today-btn {
  width: auto;
  padding: 0 1rem;
  background: #3b82f6;
  color: white;
}

.nav-btn:hover,
.today-btn:hover {
  transform: scale(1.05);
}

.nav-btn:hover {
  background: #e2e8f0;
}

.today-btn:hover {
  background: #2563eb;
}

.week-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 180px;
}

.week-label {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.week-dates {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.empty-state {
  background: white;
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  color: #0f172a;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.empty-state p {
  color: #64748b;
  font-size: 1rem;
  margin: 0 0 2rem 0;
}

.add-btn-large {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.students-container {
  background: white;
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.week-header {
  display: grid;
  grid-template-columns: 280px 1fr 80px;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid #e2e8f0;
  font-weight: 700;
  color: #475569;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.attendance-cols {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.day-col {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.day-name {
  font-weight: 700;
}

.day-date {
  font-size: 0.75rem;
  opacity: 0.6;
}

@media (max-width: 1024px) {
  .week-header {
    grid-template-columns: 200px 1fr 80px;
    gap: 0.75rem;
    font-size: 0.75rem;
  }

  .dashboard-main {
    padding: 1rem;
  }

  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .week-navigation {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.25rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
  }

  .logo-section {
    justify-content: center;
  }

  .week-header {
    display: none;
  }
}
</style>
