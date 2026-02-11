/*
  # Complete Database Reset

  This migration completely resets the database with a clean schema.

  1. Tables Created
    - teachers: Teacher profiles linked to auth.users
    - students: Student records with points and stats
    - attendance: Daily attendance tracking
    - rewards: Reward definitions created by teachers
    - student_rewards: Rewards assigned to students

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Teachers can only access their own students and data
*/

-- Drop existing tables in correct order to avoid foreign key issues
DROP TABLE IF EXISTS student_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS student_rewards CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can insert own profile"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can read own profile"
  ON teachers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Teachers can update own profile"
  ON teachers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name text NOT NULL,
  points integer DEFAULT 0,
  email text,
  notes text DEFAULT '',
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  total_absences integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own students"
  ON students FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert own students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own students"
  ON students FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own students"
  ON students FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  on_time boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view attendance for own students"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert attendance for own students"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update attendance for own students"
  ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete attendance for own students"
  ON attendance FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.teacher_id = auth.uid()
    )
  );

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  points_required integer DEFAULT 0,
  icon text DEFAULT '🎁',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert own rewards"
  ON rewards FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own rewards"
  ON rewards FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own rewards"
  ON rewards FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Create student_rewards table
CREATE TABLE IF NOT EXISTS student_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  redeemed boolean DEFAULT false,
  redeemed_at timestamptz
);

ALTER TABLE student_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view student rewards for own students"
  ON student_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_rewards.student_id
      AND students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can assign rewards to own students"
  ON student_rewards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_rewards.student_id
      AND students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update student rewards for own students"
  ON student_rewards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_rewards.student_id
      AND students.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_rewards.student_id
      AND students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete student rewards for own students"
  ON student_rewards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_rewards.student_id
      AND students.teacher_id = auth.uid()
    )
  );
