<script setup lang="ts">
import { useRouter } from 'vue-router'
import AuthForm from '../components/AuthForm.vue'

const router = useRouter()

const handleSuccess = async () => {
  console.log('Login success, token in localStorage:', localStorage.getItem('token'))
  // Give a moment for token to be fully set
  await new Promise(resolve => setTimeout(resolve, 100))
  console.log('Navigating to dashboard...')
  await router.push('/dashboard')
}
</script>

<template>
  <AuthForm @success="handleSuccess" />
</template>
