/*
  # Add Weekly Bonus Tracking
  
  1. New Tables
    - `weekly_bonuses`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `week_start_date` (date) - The Monday of the week
      - `awarded_at` (timestamptz) - When bonus was awarded
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `weekly_bonuses` table
    - Add policy for teachers to read their students' bonuses
    
  3. Purpose
    - Prevents duplicate weekly bonuses from being awarded
    - Tracks bonus history for each student
*/

CREATE TABLE IF NOT EXISTS weekly_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, week_start_date)
);

ALTER TABLE weekly_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their students' weekly bonuses"
  ON weekly_bonuses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = weekly_bonuses.student_id
      AND students.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert weekly bonuses for their students"
  ON weekly_bonuses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = weekly_bonuses.student_id
      AND students.teacher_id = auth.uid()
    )
  );