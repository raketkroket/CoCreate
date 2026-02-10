/*
  # Add Rewards System to Attendance Tracker

  ## Overview
  Adds a comprehensive rewards system where teachers can assign rewards to students
  based on their accumulated points. Teachers can create custom rewards and assign
  them to individual students.

  ## New Tables

  ### `rewards`
  - `id` (uuid, primary key) - Unique identifier
  - `teacher_id` (uuid, foreign key) - Reference to teachers table
  - `name` (text, not null) - Name of the reward (e.g., "Free Lunch", "Homework Pass")
  - `description` (text) - Optional description of the reward
  - `points_required` (integer, not null) - Points needed to earn this reward
  - `icon` (text) - Emoji or icon for the reward
  - `created_at` (timestamptz) - Record creation timestamp

  ### `student_rewards`
  - `id` (uuid, primary key) - Unique identifier
  - `student_id` (uuid, foreign key) - Reference to students table
  - `reward_id` (uuid, foreign key) - Reference to rewards table
  - `assigned_at` (timestamptz) - When the reward was assigned
  - `redeemed` (boolean, default false) - Whether student has used the reward
  - `redeemed_at` (timestamptz) - When the reward was redeemed

  ## Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Teachers can only manage rewards for their own students
  - Teachers can only see rewards they created or that belong to their students

  ### Policies

  #### Rewards Table
  1. Teachers can view their own rewards
  2. Teachers can insert their own rewards
  3. Teachers can update their own rewards
  4. Teachers can delete their own rewards

  #### Student Rewards Table
  1. Teachers can view rewards for their own students
  2. Teachers can assign rewards to their own students
  3. Teachers can update reward status for their own students
  4. Teachers can delete rewards from their own students

  ## Indexes
  - Index on `rewards.teacher_id` for efficient queries
  - Index on `student_rewards.student_id` for student lookups
  - Index on `student_rewards.reward_id` for reward lookups
*/

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  points_required integer NOT NULL DEFAULT 0,
  icon text DEFAULT '🎁',
  created_at timestamptz DEFAULT now()
);

-- Create student_rewards table
CREATE TABLE IF NOT EXISTS student_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  redeemed boolean DEFAULT false,
  redeemed_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rewards_teacher_id ON rewards(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_rewards_student_id ON student_rewards(student_id);
CREATE INDEX IF NOT EXISTS idx_student_rewards_reward_id ON student_rewards(reward_id);

-- Enable Row Level Security
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_rewards ENABLE ROW LEVEL SECURITY;

-- Rewards policies
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

-- Student rewards policies
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
