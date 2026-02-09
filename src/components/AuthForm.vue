<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits<{
  success: []
}>()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const username = ref('')
const error = ref('')
const isLoading = ref(false)

const { signIn, signUp } = useAuth()

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    if (isLogin.value) {
      await signIn(email.value, password.value)
    } else {
      if (!username.value) {
        error.value = 'Gebruikersnaam is verplicht'
        isLoading.value = false
        return
      }
      await signUp(email.value, password.value, username.value)
    }
    emit('success')
  } catch (e: any) {
    error.value = e.message || 'Er is iets misgegaan'
  } finally {
    isLoading.value = false
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
  email.value = ''
  password.value = ''
  username.value = ''
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <h1>{{ isLogin ? 'Inloggen' : 'Registreren' }}</h1>
      <p class="subtitle">Docenten Dashboard</p>

      <form @submit.prevent="handleSubmit">
        <div v-if="!isLogin" class="input-group">
          <label for="username">Gebruikersnaam</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Vul je gebruikersnaam in"
            required
          />
        </div>

        <div class="input-group">
          <label for="email">E-mailadres</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="docent@school.nl"
            required
          />
        </div>

        <div class="input-group">
          <label for="password">Wachtwoord</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
          />
        </div>

        <div v-if="error" class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ error }}
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          {{ isLoading ? 'Bezig...' : (isLogin ? 'Inloggen' : 'Registreren') }}
        </button>
      </form>

      <div class="toggle-mode">
        <p>
          {{ isLogin ? 'Nog geen account?' : 'Al een account?' }}
          <button type="button" @click="toggleMode" class="link-btn">
            {{ isLogin ? 'Registreer hier' : 'Log hier in' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.auth-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  animation: pulse 15s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.auth-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1) inset;
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

h1 {
  color: #0f172a;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0 0 2rem 0;
  text-align: center;
  font-weight: 500;
}

.input-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #f8fafc;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  background: white;
}

.error-message {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #991b1b;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message svg {
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toggle-mode {
  margin-top: 2rem;
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.toggle-mode p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}

.link-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.link-btn:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .auth-card {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
  }
}
</style>
