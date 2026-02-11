import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export interface Student {
  id: string
  teacher_id: string
  name: string
  points: number
  created_at: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  on_time: boolean
  created_at: string
}

export interface Teacher {
  id: string
  username: string
  created_at: string
}

export interface Reward {
  id: string
  teacher_id: string
  name: string
  description: string
  points_required: number
  icon: string
  created_at: string
}

export interface StudentReward {
  id: string
  student_id: string
  reward_id: string
  assigned_at: string
  redeemed: boolean
  redeemed_at: string | null
  reward?: Reward
}
