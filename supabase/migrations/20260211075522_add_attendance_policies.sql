/*
  # Add Attendance Table Policies
  
  This migration adds Row Level Security policies for the attendance table
  so teachers can manage attendance for their students.
  
  ## Changes
  
  1. Add SELECT policy - Teachers can view attendance for their students
  2. Add INSERT policy - Teachers can create attendance records for their students
  3. Add UPDATE policy - Teachers can update attendance records for their students
  4. Add DELETE policy - Teachers can delete attendance records for their students
  
  ## Security
  
  All policies verify that the attendance record belongs to a student
  that is owned by the authenticated teacher.
*/

-- Teachers can view attendance for their students
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

-- Teachers can create attendance for their students
CREATE POLICY "Teachers can create attendance for own students"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance.student_id
      AND students.teacher_id = auth.uid()
    )
  );

-- Teachers can update attendance for their students
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

-- Teachers can delete attendance for their students
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
