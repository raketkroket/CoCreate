<script setup lang="ts">
import { useRouter } from 'vue-router'
import AuthForm from '../components/AuthForm.vue'

const router = useRouter()

const handleSuccess = () => {
  console.log('Login success, navigating to dashboard...')
  router.push('/')
}
</script>

<template>
  <AuthForm @success="handleSuccess" />
</template>
