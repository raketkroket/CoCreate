import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/index.js'

const router = express.Router()

const generateToken = (id, email) => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET || 'your-secret',
    { expiresIn: '7d' }
  )
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username required' })
    }

    // Check if user exists
    const existing = await query(
      'SELECT id FROM teachers WHERE email = ?',
      [email]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10)
    const id = uuidv4()

    // Create teacher
    await query(
      `INSERT INTO teachers (id, username, email, password_hash)
       VALUES (?, ?, ?, ?)`,
      [id, username, email, passwordHash]
    )

    // Create default settings
    await query(
      `INSERT INTO teacher_settings (id, teacher_id, class_name)
       VALUES (?, ?, ?)`,
      [uuidv4(), id, username + "'s Class"]
    )

    const token = generateToken(id, email)

    res.json({
      token,
      user: {
        id,
        email,
        username
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Get user
    const result = await query(
      'SELECT id, email, username, password_hash FROM teachers WHERE email = ?',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const teacher = result.rows[0]

    // Check password
    const passwordMatch = await bcryptjs.compare(password, teacher.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken(teacher.id, teacher.email)

    res.json({
      token,
      user: {
        id: teacher.id,
        email: teacher.email,
        username: teacher.username
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret')
    res.json({ valid: true, user: decoded })
  } catch (error) {
    res.status(401).json({ valid: false })
  }
})

export default router
