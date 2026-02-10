import { ref } from 'vue'
import { supabase } from '../supabase'
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const loading = ref(true)

export function useAuth() {
  const signUp = async (email: string, password: string, username: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) throw authError

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('teachers')
        .insert({
          id: authData.user.id,
          username
        })

      if (profileError) throw profileError

      user.value = authData.user
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    user.value = data.user
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  const initAuth = () => {
    supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        user.value = session?.user || null
        loading.value = false
      })()
    })
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
