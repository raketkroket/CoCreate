/*
  # Create Attendance System Database

  ## Overview
  Creates the complete database schema for a student attendance tracking system
  for teachers to monitor student punctuality and award points.

  ## New Tables

  ### `teachers`
  - `id` (uuid, primary key) - Links to auth.users
  - `username` (text, not null) - Display name for the teacher
  - `created_at` (timestamptz) - Account creation timestamp

  ### `students`
  - `id` (uuid, primary key) - Unique identifier
  - `teacher_id` (uuid, foreign key) - Reference to teachers table
  - `name` (text, not null) - Student's full name
  - `points` (integer, default 0) - Accumulated attendance points
  - `created_at` (timestamptz) - Record creation timestamp

  ### `attendance`
  - `id` (uuid, primary key) - Unique identifier
  - `student_id` (uuid, foreign key) - Reference to students table
  - `date` (date, not null) - Date of attendance
  - `on_time` (boolean, not null) - Whether student was on time
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Teachers can only access their own data and their students' data
  - Attendance records are accessible to the teacher who owns the student
  - Anonymous users have no access to any data

  ### Policies

  #### Teachers Table
  1. Teachers can read their own profile
  2. Teachers can update their own profile
  3. New teachers can insert their own profile during registration

  #### Students Table
  1. Teachers can view only their own students
  2. Teachers can insert new students under their account
  3. Teachers can update only their own students
  4. Teachers can delete only their own students

  #### Attendance Table
  1. Teachers can view attendance for their own students only
  2. Teachers can insert attendance records for their own students
  3. Teachers can update attendance records for their own students
  4. Teachers can delete attendance records for their own students

  ## Indexes
  - Index on `students.teacher_id` for efficient teacher-student queries
  - Index on `attendance.student_id` for efficient student attendance lookups
  - Composite index on `attendance(student_id, date)` for unique date queries
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name text NOT NULL,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  on_time boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Teachers policies
CREATE POLICY "Teachers can read own profile"
  ON teachers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Teachers can update own profile"
  ON teachers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can insert own profile"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Students policies
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

-- Attendance policies
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
