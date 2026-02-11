/*
  # Add Teacher Settings
  
  1. New Tables
    - `teacher_settings`
      - `id` (uuid, primary key) - unique identifier
      - `user_id` (uuid, foreign key to auth.users) - teacher account
      - `class_name` (text) - customizable class name
      - `class_year` (text) - school year (e.g., "2023-2024")
      - `class_subject` (text) - subject being taught
      - `points_on_time` (integer) - points awarded for on-time attendance
      - `points_late` (integer) - points deducted for late attendance
      - `points_absent` (integer) - points deducted for absence
      - `created_at` (timestamptz) - record creation time
      - `updated_at` (timestamptz) - last update time
  
  2. Security
    - Enable RLS on `teacher_settings` table
    - Add policy for teachers to read their own settings
    - Add policy for teachers to insert their own settings
    - Add policy for teachers to update their own settings
*/

CREATE TABLE IF NOT EXISTS teacher_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  class_name text DEFAULT 'My Class',
  class_year text DEFAULT '2023-2024',
  class_subject text DEFAULT '',
  points_on_time integer DEFAULT 2,
  points_late integer DEFAULT -2,
  points_absent integer DEFAULT -5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own settings"
  ON teacher_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert own settings"
  ON teacher_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update own settings"
  ON teacher_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);