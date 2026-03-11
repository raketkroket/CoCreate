import { query } from './index.js'

const migrations = [
  {
    name: '001_initial_schema',
    up: async () => {
      await query(`
        -- Create teachers table
        CREATE TABLE IF NOT EXISTS teachers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

        -- Create students table
        CREATE TABLE IF NOT EXISTS students (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          points INTEGER DEFAULT 0,
          email TEXT,
          notes TEXT DEFAULT '',
          current_streak INTEGER DEFAULT 0,
          best_streak INTEGER DEFAULT 0,
          total_absences INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON students(teacher_id);

        -- Create attendance table
        CREATE TABLE IF NOT EXISTS attendance (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          on_time BOOLEAN NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(student_id, date)
        );

        CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

        -- Create rewards table
        CREATE TABLE IF NOT EXISTS rewards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          points_required INTEGER DEFAULT 0,
          icon TEXT DEFAULT '🎁',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_rewards_teacher_id ON rewards(teacher_id);

        -- Create student_rewards table
        CREATE TABLE IF NOT EXISTS student_rewards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          redeemed BOOLEAN DEFAULT FALSE,
          redeemed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_student_rewards_student_id ON student_rewards(student_id);
        CREATE INDEX IF NOT EXISTS idx_student_rewards_reward_id ON student_rewards(reward_id);

        -- Create weekly_bonuses table
        CREATE TABLE IF NOT EXISTS weekly_bonuses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          week_start_date DATE NOT NULL,
          awarded_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(student_id, week_start_date)
        );

        CREATE INDEX IF NOT EXISTS idx_weekly_bonuses_student_id ON weekly_bonuses(student_id);

        -- Create teacher_settings table
        CREATE TABLE IF NOT EXISTS teacher_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE UNIQUE,
          class_name TEXT DEFAULT 'My Class',
          class_year TEXT DEFAULT '2023-2024',
          class_subject TEXT DEFAULT '',
          points_on_time INTEGER DEFAULT 2,
          points_late INTEGER DEFAULT -2,
          points_absent INTEGER DEFAULT -5,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_teacher_settings_teacher_id ON teacher_settings(teacher_id);
      `)
    }
  }
]

const runMigrations = async () => {
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        ran_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Check and run pending migrations
    for (const migration of migrations) {
      const result = await query(
        'SELECT 1 FROM _migrations WHERE name = $1',
        [migration.name]
      )

      if (result.rows.length === 0) {
        console.log(`⏳ Running migration: ${migration.name}`)
        await migration.up()
        await query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [migration.name]
        )
        console.log(`✅ Migration completed: ${migration.name}`)
      }
    }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

export { runMigrations }
