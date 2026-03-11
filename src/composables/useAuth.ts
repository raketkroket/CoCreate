import { ref } from 'vue'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const loading = ref(true)

export function useAuth() {
  const signUp = async (email: string, password: string, username: string) => {
    console.log('=== SIGNUP START ===')
    console.log('Email:', email)
    console.log('Username:', username)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    })

    console.log('Signup result:', { authData, authError })

    if (authError) {
      console.error('Signup auth error:', authError)
      throw authError
    }

    if (authData.user) {
      console.log('User created successfully:', authData.user.id)
      user.value = authData.user

      // Wait for trigger to create teacher record - retry if necessary
      let teacher = null
      let teacherError = null
      let attempts = 0
      const maxAttempts = 5
      const delay = 500 // milliseconds

      while (attempts < maxAttempts && !teacher) {
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        const result = await supabase
          .from('teachers')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle()

        console.log(`Teacher record check attempt ${attempts + 1}:`, result)

        teacher = result.data
        teacherError = result.error

        if (!teacher) {
          attempts++
        }
      }

      if (!teacher) {
        console.error('Teacher record was not created automatically!', { teacherError })
        throw new Error('Account aanmaken mislukt. De leeraar-gegevens kon niet ingesteld worden. Probeer het opnieuw of neem contact op met support.')
      }

      console.log('Teacher record created:', teacher)
    }

    console.log('=== SIGNUP COMPLETE ===')
  }

  const signIn = async (email: string, password: string) => {
    console.log('=== LOGIN START ===')
    console.log('Email:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('Login result:', { data, error })

    if (error) {
      console.error('Login error:', error)
      throw error
    }

    if (data.user) {
      console.log('User logged in:', data.user.id)

      // Verify teacher record exists
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      console.log('Teacher record check:', { teacher, teacherError })

      if (!teacher) {
        console.error('No teacher record found for user!')
        await supabase.auth.signOut()
        throw new Error('Je account is niet correct ingesteld. Neem contact op met de beheerder.')
      }

      user.value = data.user
      console.log('Login successful, user set:', user.value?.id)
    }

    console.log('=== LOGIN COMPLETE ===')
  }

  const signOut = async () => {
    console.log('=== LOGOUT START ===')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
      throw error
    }
    user.value = null
    console.log('=== LOGOUT COMPLETE ===')
  }

  const initAuth = async () => {
    console.log('=== INIT AUTH START ===')
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      console.log('Get session result:', { session: session?.user?.id, error })

      if (error) {
        console.error('Failed to get session:', error)
        await supabase.auth.signOut()
        user.value = null
      } else {
        user.value = session?.user || null
        if (user.value) {
          console.log('Session found for user:', user.value.id)
        } else {
          console.log('No active session')
        }
      }
    } catch (error) {
      console.error('Failed to get session:', error)
      await supabase.auth.signOut()
      user.value = null
    } finally {
      loading.value = false
      console.log('Auth init loading complete')
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id || 'no user')
      user.value = session?.user || null
    })

    console.log('=== INIT AUTH COMPLETE ===')
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
