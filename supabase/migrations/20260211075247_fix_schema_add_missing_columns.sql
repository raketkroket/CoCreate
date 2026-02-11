/*
  # Fix Schema - Add Missing Columns
  
  This migration adds missing columns to match the application's requirements.
  
  ## Changes
  
  1. Rewards table:
     - Add `teacher_id` column to associate rewards with teachers
     - Add `description` column for reward details
     - Add `points_required` column for points-based rewards
     - Update RLS policies to filter by teacher_id
  
  2. Student_rewards table:
     - Add `redeemed` column to track if reward was used
     - Add `redeemed_at` column for timestamp
  
  3. Students table:
     - Add `points` column to track student points
  
  4. Security:
     - Update reward policies to ensure teachers only see their own rewards
*/

-- Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;

-- Add missing columns to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS points_required integer DEFAULT 0;

-- Add missing columns to student_rewards table
ALTER TABLE student_rewards ADD COLUMN IF NOT EXISTS redeemed boolean DEFAULT false;
ALTER TABLE student_rewards ADD COLUMN IF NOT EXISTS redeemed_at timestamptz;

-- Update default rewards to have teacher_id NULL (shared rewards)
UPDATE rewards SET points_required = 10 WHERE name = 'Goed Gedaan';
UPDATE rewards SET points_required = 25 WHERE name = 'Top Werk';
UPDATE rewards SET points_required = 50 WHERE name = 'Uitstekend';
UPDATE rewards SET points_required = 75 WHERE name = 'Geweldig';
UPDATE rewards SET points_required = 100 WHERE name = 'Kampioen';

-- Drop old reward policies
DROP POLICY IF EXISTS "All teachers can view rewards" ON rewards;

-- Create new reward policies that handle both shared and teacher-specific rewards
CREATE POLICY "Teachers can view shared and own rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (teacher_id IS NULL OR teacher_id = auth.uid());

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
