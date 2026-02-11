<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/supabase'
import { useAuth } from '../composables/useAuth'
import { useToast } from '../composables/useToast'
import NavMenu from '../components/NavMenu.vue'

const router = useRouter()
const { user, signOut } = useAuth()
const { showToast } = useToast()
const teacherName = ref('')
const isLoading = ref(true)
const isSaving = ref(false)

const settings = ref({
  class_name: 'Mijn Klas',
  class_year: '2023-2024',
  class_subject: '',
  points_on_time: 2,
  points_late: -2,
  points_absent: -5
})

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
    .select('*')
    .eq('user_id', user.value.id)
    .maybeSingle()

  if (data) {
    settings.value = {
      class_name: data.class_name,
      class_year: data.class_year,
      class_subject: data.class_subject,
      points_on_time: data.points_on_time,
      points_late: data.points_late,
      points_absent: data.points_absent
    }
  }
}

const saveSettings = async () => {
  if (!user.value) return

  isSaving.value = true

  try {
    const { data: existing } = await supabase
      .from('teacher_settings')
      .select('id')
      .eq('user_id', user.value.id)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('teacher_settings')
        .update({
          class_name: settings.value.class_name,
          class_year: settings.value.class_year,
          class_subject: settings.value.class_subject,
          points_on_time: settings.value.points_on_time,
          points_late: settings.value.points_late,
          points_absent: settings.value.points_absent,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.value.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('teacher_settings')
        .insert({
          user_id: user.value.id,
          class_name: settings.value.class_name,
          class_year: settings.value.class_year,
          class_subject: settings.value.class_subject,
          points_on_time: settings.value.points_on_time,
          points_late: settings.value.points_late,
          points_absent: settings.value.points_absent
        })

      if (error) throw error
    }

    showToast('Instellingen opgeslagen', 'success')
  } catch (error) {
    console.error('Error saving settings:', error)
    showToast('Fout bij opslaan instellingen', 'error')
  } finally {
    isSaving.value = false
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

onMounted(async () => {
  isLoading.value = true
  await loadTeacherInfo()
  await loadSettings()
  isLoading.value = false
})
</script>

<template>
  <div class="settings-page">
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
              <h1>Instellingen</h1>
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
        <p>Instellingen laden...</p>
      </div>

      <div v-else class="content">
        <div class="settings-container">
          <div class="settings-section">
            <h2>Klasinformatie</h2>
            <div class="form-group">
              <label for="class_name">Klasnaam</label>
              <input
                id="class_name"
                v-model="settings.class_name"
                type="text"
                placeholder="bijv. 4A"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="class_year">Schooljaar</label>
              <input
                id="class_year"
                v-model="settings.class_year"
                type="text"
                placeholder="bijv. 2023-2024"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="class_subject">Vak</label>
              <input
                id="class_subject"
                v-model="settings.class_subject"
                type="text"
                placeholder="bijv. Wiskunde"
                class="form-input"
              />
            </div>
          </div>

          <div class="settings-section">
            <h2>Puntensysteem</h2>
            <p class="section-description">
              Pas de punten aan die leerlingen krijgen of verliezen voor aanwezigheid
            </p>

            <div class="form-group">
              <label for="points_on_time">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Punten voor op tijd
              </label>
              <input
                id="points_on_time"
                v-model.number="settings.points_on_time"
                type="number"
                class="form-input"
                min="-10"
                max="10"
              />
            </div>

            <div class="form-group">
              <label for="points_late">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Punten voor te laat
              </label>
              <input
                id="points_late"
                v-model.number="settings.points_late"
                type="number"
                class="form-input"
                min="-10"
                max="10"
              />
            </div>

            <div class="form-group">
              <label for="points_absent">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Punten voor afwezig
              </label>
              <input
                id="points_absent"
                v-model.number="settings.points_absent"
                type="number"
                class="form-input"
                min="-10"
                max="10"
              />
            </div>

            <div class="info-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div>
                <strong>Let op:</strong> Negatieve waarden trekken punten af. Een perfecte week geeft altijd een bonus van +5 punten.
              </div>
            </div>
          </div>

          <div class="settings-actions">
            <button
              @click="saveSettings"
              :disabled="isSaving"
              class="save-btn"
            >
              <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <div v-else class="mini-spinner"></div>
              {{ isSaving ? 'Opslaan...' : 'Instellingen Opslaan' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings-page {
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
  max-width: 800px;
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

.settings-container {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.settings-section {
  margin-bottom: 3rem;
  padding-bottom: 3rem;
  border-bottom: 2px solid #f1f5f9;
}

.settings-section:last-of-type {
  border-bottom: none;
  margin-bottom: 2rem;
  padding-bottom: 0;
}

.settings-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1rem 0;
}

.section-description {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0 0 1.5rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  color: #0f172a;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #cbd5e1;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  margin-top: 1.5rem;
  color: #1e40af;
  font-size: 0.875rem;
  line-height: 1.6;
}

.info-box svg {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.save-btn {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mini-spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right {
    flex-direction: column;
  }

  .page-main {
    padding: 1rem;
  }

  .settings-container {
    padding: 1.5rem;
  }

  .settings-actions {
    justify-content: stretch;
  }

  .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
