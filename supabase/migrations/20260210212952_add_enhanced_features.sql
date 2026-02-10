/*
  # Enhanced Features Migration

  This migration adds support for:
  1. Student profile enhancements (email, notes, streak tracking)
  2. Badge/achievement system
  3. Attendance history table for better tracking
  4. Enhanced reward history with more details

  ## New Columns in Students Table
    - email (optional contact info)
    - notes (teacher notes about student)
    - current_streak (consecutive on-time days)
    - best_streak (highest streak achieved)
    - total_absences (lifetime absence count)
    - created_at (when student was added)

  ## New Tables
    - badges: Achievement badges that students can earn
    - student_badges: Junction table tracking which students have which badges
    - attendance_records: Detailed attendance history by date

  ## Security
    - All tables have RLS enabled
    - Policies allow authenticated teachers to manage all data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'email'
  ) THEN
    ALTER TABLE students ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'notes'
  ) THEN
    ALTER TABLE students ADD COLUMN notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE students ADD COLUMN current_streak integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'best_streak'
  ) THEN
    ALTER TABLE students ADD COLUMN best_streak integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'total_absences'
  ) THEN
    ALTER TABLE students ADD COLUMN total_absences integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE students ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage badges"
  ON badges
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage student badges"
  ON student_badges
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL,
  notes text DEFAULT '',
  recorded_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage attendance records"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO badges (name, description, icon, requirement_type, requirement_value)
VALUES
  ('Perfect Week', 'On-time every day for a week', '🌟', 'streak', 5),
  ('Century Club', 'Earned 100 points', '💯', 'points', 100),
  ('Dedication', 'On-time 20 times', '🔥', 'on_time_count', 20),
  ('Comeback Kid', 'Improved attendance after 3+ absences', '🎯', 'comeback', 3)
ON CONFLICT DO NOTHING;
