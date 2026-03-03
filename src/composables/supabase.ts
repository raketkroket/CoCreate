import { createClient } from '@supabase/supabase-js'

// read the values that come from Vite's environment variables. They'll only be
// injected when the dev server is restarted or the project is rebuilt, so if you
// change `.env` you *must* restart `npm run dev`/`vite`.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// sanity check early so the error isn't a generic "Failed to fetch" in the
// browser.  This will throw at startup if the variables are missing or empty.
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('Supabase configuration is missing! check .env and restart the dev server.');
  throw new Error('Missing SUPABASE_URL or ANON_KEY in environment')
}

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
