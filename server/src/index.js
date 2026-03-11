import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb } from './db/index.js'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import attendanceRoutes from './routes/attendance.js'
import rewardRoutes from './routes/rewards.js'
import teacherRoutes from './routes/teacher.js'
import { authMiddleware } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Public routes
app.use('/api/auth', authRoutes)

// Protected routes (require authentication)
app.use('/api/students', authMiddleware, studentRoutes)
app.use('/api/attendance', authMiddleware, attendanceRoutes)
app.use('/api/rewards', authMiddleware, rewardRoutes)
app.use('/api/teacher', authMiddleware, teacherRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

// Start server
const startServer = async () => {
  try {
    await initDb()
    console.log('✅ Database initialized')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
