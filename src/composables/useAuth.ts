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
        },
        emailRedirectTo: window.location.origin
      }
    })

    console.log('Signup result:', { authData, authError })

    if (authError) {
      console.error('Signup auth error:', authError)
      if (authError.message === 'Failed to fetch') {
        throw new Error(
          'Kon geen verbinding maken met de authenticatieserver. Controleer de Supabase-URL/ANON_KEY of netwerkinstellingen.'
        )
      }
      throw authError
    }

    if (authData.user) {
      console.log('User created successfully:', authData.user.id)

      if (authData.session) {
        console.log('Session available, user can login immediately')
        user.value = authData.user
      } else {
        console.log('No session - email confirmation may be required')
        throw new Error('Registratie gelukt! Je kunt nu inloggen met je account.')
      }

      console.log(
        'Teacher profile will be created server‑side; if you see a failure, check the migrations and RLS policies.'
      )
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
      if (error.message === 'Failed to fetch') {
        throw new Error(
          'Kon geen verbinding maken met de authenticatieserver. Controleer de Supabase-URL/ANON_KEY of netwerkinstellingen.'
        )
      }
      throw error
    }

    if (data.user) {
      console.log('User logged in:', data.user.id)

      // Verify teacher record exists (should've been populated by the
      // trigger).  If this check ever fails it means something went wrong with
      // the server-side migration or policies.
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
