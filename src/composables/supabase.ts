import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Teacher {
  id: string
  username: string
  email: string
  created_at: string
}

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
