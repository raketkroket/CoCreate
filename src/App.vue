<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import AuthForm from './components/AuthForm.vue'
import Dashboard from './components/Dashboard.vue'

const { user, loading, initAuth } = useAuth()

onMounted(() => {
  initAuth()
})
</script>

<template>
  <div v-if="loading" class="app-loading">
    <div class="spinner"></div>
  </div>
  <div v-else>
    <AuthForm v-if="!user" />
    <Dashboard v-else />
  </div>
</template>

<style scoped>
.app-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
