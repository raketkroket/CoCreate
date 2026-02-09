-- Row Level Security Policies for CoCreate Database
-- Run these commands in your Supabase SQL Editor

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can only see their own students
CREATE POLICY "Teachers see own students"
ON students FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

-- Policy: Teachers can only insert students to their own account
CREATE POLICY "Teachers create own students"
ON students FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id);

-- Policy: Teachers can only update their own students
CREATE POLICY "Teachers update own students"
ON students FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Policy: Teachers can only delete their own students
CREATE POLICY "Teachers delete own students"
ON students FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id);

-- Enable RLS on attendance table
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can see attendance for their students
CREATE POLICY "Teachers see student attendance"
ON attendance FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE teacher_id = auth.uid()
  )
);

-- Policy: Teachers can create attendance for their students
CREATE POLICY "Teachers create attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE teacher_id = auth.uid()
  )
);

-- Policy: Teachers can update attendance for their students
CREATE POLICY "Teachers update attendance"
ON attendance FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE teacher_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE teacher_id = auth.uid()
  )
);

-- Policy: Teachers can delete attendance for their students
CREATE POLICY "Teachers delete attendance"
ON attendance FOR DELETE
TO authenticated
USING (
  student_id IN (
    SELECT id FROM students WHERE teacher_id = auth.uid()
  )
);
