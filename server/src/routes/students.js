import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/index.js'

const router = express.Router()

// Get all students for teacher
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM students WHERE teacher_id = ? ORDER BY name ASC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// Get single student
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM students WHERE id = ? AND teacher_id = ?`,
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

// Create student
router.post('/', async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Student name required' })
    }

    const id = uuidv4()
    await query(
      `INSERT INTO students (id, teacher_id, name, points)
       VALUES (?, ?, ?, ?)`,
      [id, req.user.id, name, 0]
    )

    const result = await query('SELECT * FROM students WHERE id = ?', [id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating student:', error)
    res.status(500).json({ error: 'Failed to create student' })
  }
})

// Update student
router.patch('/:id', async (req, res) => {
  try {
    const { name, points, email, notes } = req.body

    // Verify student belongs to teacher
    const check = await query(
      'SELECT id FROM students WHERE id = ? AND teacher_id = ?',
      [req.params.id, req.user.id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const fields = []
    const values = []

    if (name !== undefined) {
      fields.push(`name = ?`)
      values.push(name)
    }
    if (points !== undefined) {
      fields.push(`points = ?`)
      values.push(points)
    }
    if (email !== undefined) {
      fields.push(`email = ?`)
      values.push(email)
    }
    if (notes !== undefined) {
      fields.push(`notes = ?`)
      values.push(notes)
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(req.params.id)

    await query(
      `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
      values
    )

    const result = await query('SELECT * FROM students WHERE id = ?', [req.params.id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating student:', error)
    res.status(500).json({ error: 'Failed to update student' })
  }
})

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const check = await query(
      'SELECT id FROM students WHERE id = ? AND teacher_id = ?',
      [req.params.id, req.user.id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    await query('DELETE FROM students WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

export default router
