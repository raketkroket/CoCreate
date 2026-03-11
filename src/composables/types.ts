export interface Student {
  id: string
  teacher_id: string
  name: string
  points: number
  email?: string
  notes?: string
  current_streak?: number
  best_streak?: number
  total_absences?: number
  created_at: string
  updated_at?: string
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  on_time: boolean
  created_at: string
  updated_at?: string
}

export interface Teacher {
  id: string
  username: string
  email: string
  created_at: string
  updated_at?: string
}

export interface Reward {
  id: string
  teacher_id: string
  name: string
  description: string
  points_required: number
  icon: string
  created_at: string
  updated_at?: string
}

export interface StudentReward {
  id: string
  student_id: string
  reward_id: string
  assigned_at: string
  redeemed: boolean
  redeemed_at: string | null
  reward?: Reward
  created_at?: string
  updated_at?: string
}

export interface TeacherSettings {
  id: string
  teacher_id: string
  class_name: string
  class_year: string
  class_subject: string
  points_on_time: number
  points_late: number
  points_absent: number
  created_at: string
  updated_at?: string
}

export interface WeeklyBonus {
  id: string
  student_id: string
  week_start_date: string
  awarded_at: string
  created_at: string
}
