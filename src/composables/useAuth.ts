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
      // a common failure from the SDK when the URL is wrong or there's no network
      // connection is just a generic "Failed to fetch".  Replace it with a friendlier
      // message that points at the environment / CORS configuration.
      if (authError.message === 'Failed to fetch') {
        throw new Error(
          'Kon geen verbinding maken met de authenticatieserver. Controleer de Supabase-URL/ANON_KEY of netwerkinstellingen.'
        )
      }
      throw authError
    }

    if (authData.user) {
      console.log('User created successfully:', authData.user.id)
      user.value = authData.user

      // The database now has a trigger that automatically inserts a teacher
      // profile whenever a new row is added to auth.users.  That avoids the
      // common problem where sign-up returns a user but no session (e.g. when
      // email confirmation is required), causing the insert below to fail with
      // a permissions error.  We log a reminder here so upstream callers can
      // inspect the `teachers` table if something still seems wrong.
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
