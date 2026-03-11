import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../cocreate.db')

let db = null

export const getDb = () => {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err)
      } else {
        console.log('✅ SQLite database connected:', dbPath)
      }
    })
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON')
  }
  return db
}

export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb()
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve({ rows: rows || [] })
      })
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err)
        else resolve({ rows: [], lastID: this.lastID, changes: this.changes })
      })
    }
  })
}

export const initDb = async () => {
  try {
    // Test connection
    await query('SELECT 1')
    console.log('✅ Database connection successful')

    // Run migrations
    await runMigrations()
    console.log('✅ Migrations completed')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

const runMigrations = async () => {
  try {
    // Create migrations table
    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        ran_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const migrations = [
      {
        name: '001_initial_schema',
        up: async () => {
          await query(`
            CREATE TABLE IF NOT EXISTS teachers (
              id TEXT PRIMARY KEY,
              username TEXT NOT NULL UNIQUE,
              email TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)

          await query(`
            CREATE TABLE IF NOT EXISTS students (
              id TEXT PRIMARY KEY,
              teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              points INTEGER DEFAULT 0,
              email TEXT,
              notes TEXT DEFAULT '',
              current_streak INTEGER DEFAULT 0,
              best_streak INTEGER DEFAULT 0,
              total_absences INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)

          await query(`
            CREATE TABLE IF NOT EXISTS attendance (
              id TEXT PRIMARY KEY,
              student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
              date DATE NOT NULL,
              on_time BOOLEAN NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(student_id, date)
            )
          `)

          await query(`
            CREATE TABLE IF NOT EXISTS rewards (
              id TEXT PRIMARY KEY,
              teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              description TEXT DEFAULT '',
              points_required INTEGER DEFAULT 0,
              icon TEXT DEFAULT '🎁',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)

          await query(`
            CREATE TABLE IF NOT EXISTS student_rewards (
              id TEXT PRIMARY KEY,
              student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
              reward_id TEXT NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
              assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              redeemed BOOLEAN DEFAULT 0,
              redeemed_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)

          await query(`
            CREATE TABLE IF NOT EXISTS weekly_bonuses (
              id TEXT PRIMARY KEY,
              student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
              week_start_date DATE NOT NULL,
              awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(student_id, week_start_date)
            )
          `)

          await query(`
            CREATE TABLE IF NOT EXISTS teacher_settings (
              id TEXT PRIMARY KEY,
              teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE UNIQUE,
              class_name TEXT DEFAULT 'My Class',
              class_year TEXT DEFAULT '2023-2024',
              class_subject TEXT DEFAULT '',
              points_on_time INTEGER DEFAULT 2,
              points_late INTEGER DEFAULT -2,
              points_absent INTEGER DEFAULT -5,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }
      }
    ]

    // Check and run pending migrations
    for (const migration of migrations) {
      const result = await query(
        'SELECT 1 FROM _migrations WHERE name = ?',
        [migration.name]
      )

      if (result.rows.length === 0) {
        console.log(`⏳ Running migration: ${migration.name}`)
        await migration.up()
        await query(
          'INSERT INTO _migrations (name) VALUES (?)',
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
