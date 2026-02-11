/*
  # Complete Database Reset and Rebuild
  
  This migration completely resets the database and rebuilds the entire schema
  with proper relationships and security.
  
  ## Changes
  
  1. Drop all existing tables
  2. Create core tables:
     - teachers: Teacher profiles linked to auth.users
     - students: Student records with attendance tracking
     - rewards: Reward definitions
     - student_rewards: Junction table for student-reward assignments
  
  3. Security:
     - Enable RLS on all tables
     - Create policies for authenticated teachers only
     - Ensure data isolation per teacher
  
  4. Automatic teacher record creation:
     - Function to auto-create teacher record on signup
     - Trigger on auth.users table
*/

-- Drop all existing tables
DROP TABLE IF EXISTS student_rewards CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create teachers table
CREATE TABLE teachers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  present_days integer DEFAULT 0,
  absent_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create rewards table
CREATE TABLE rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create student_rewards junction table
CREATE TABLE student_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, reward_id)
);

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_rewards ENABLE ROW LEVEL SECURITY;

-- Teachers policies
CREATE POLICY "Teachers can view own profile"
  ON teachers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Teachers can update own profile"
  ON teachers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
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

-- Rewards policies (all teachers can view)
CREATE POLICY "All teachers can view rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (true);

-- Student rewards policies
CREATE POLICY "Teachers can view rewards for own students"
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

CREATE POLICY "Teachers can remove rewards from own students"
  ON student_rewards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_rewards.student_id
      AND students.teacher_id = auth.uid()
    )
  );

-- Insert default rewards
INSERT INTO rewards (name, icon) VALUES
  ('Goed Gedaan', '⭐'),
  ('Top Werk', '🏆'),
  ('Uitstekend', '🎯'),
  ('Geweldig', '✨'),
  ('Kampioen', '👑');

-- Function to automatically create teacher record when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO teachers (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
