import { ref } from 'vue'
import { useApi } from './useApi'

const api = useApi()
const user = ref(null)
const loading = ref(true)

export function useAuth() {
  const signUp = async (email: string, password: string, username: string) => {
    console.log('=== SIGNUP START ===')
    try {
      const result = await api.register(email, password, username)
      user.value = result
      console.log('Signup successful')
      return result
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('=== LOGIN START ===')
    try {
      const result = await api.login(email, password)
      user.value = result
      console.log('Login successful')
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signOut = async () => {
    console.log('=== LOGOUT START ===')
    api.logout()
    user.value = null
  }

  const initAuth = async () => {
    console.log('=== INIT AUTH START ===')
    loading.value = true
    try {
      // Check if token exists
      if (api.user.value) {
        user.value = api.user.value
        console.log('User restored from storage')
      }
    } catch (error) {
      console.error('Auth init failed:', error)
      api.logout()
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    initAuth
  }
}
