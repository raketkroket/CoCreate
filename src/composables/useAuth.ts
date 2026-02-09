import { ref, onMounted } from 'vue'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const loading = ref(true)

export function useAuth() {
  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase
        .from('teachers')
        .insert({
          id: data.user.id,
          username,
          email
        })

      if (profileError) throw profileError
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    user.value = data.user
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  const initAuth = () => {
    supabase.auth.onAuthStateChange((_event: string, session: any) => {
      (async () => {
        user.value = session?.user ?? null
        loading.value = false
      })()
    })
  }

  onMounted(async () => {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    loading.value = false
  })

  return {
    user,
    loading,
    login: signIn,
    logout: signOut,
    signUp,
    signIn,
    signOut,
    initAuth
  }
}
