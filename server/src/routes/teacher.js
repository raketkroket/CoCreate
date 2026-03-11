import express from 'express'
import { query } from '../db/index.js'

const router = express.Router()

// Get teacher info
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, created_at FROM teachers WHERE id = ?',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching teacher:', error)
    res.status(500).json({ error: 'Failed to fetch teacher' })
  }
})

// Get teacher settings
router.get('/settings', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM teacher_settings WHERE teacher_id = ?',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update teacher settings
router.patch('/settings', async (req, res) => {
  try {
    const { className, classYear, classSubject, pointsOnTime, pointsLate, pointsAbsent } = req.body

    const fields = []
    const values = []

    if (className !== undefined) {
      fields.push(`class_name = ?`)
      values.push(className)
    }
    if (classYear !== undefined) {
      fields.push(`class_year = ?`)
      values.push(classYear)
    }
    if (classSubject !== undefined) {
      fields.push(`class_subject = ?`)
      values.push(classSubject)
    }
    if (pointsOnTime !== undefined) {
      fields.push(`points_on_time = ?`)
      values.push(pointsOnTime)
    }
    if (pointsLate !== undefined) {
      fields.push(`points_late = ?`)
      values.push(pointsLate)
    }
    if (pointsAbsent !== undefined) {
      fields.push(`points_absent = ?`)
      values.push(pointsAbsent)
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(req.user.id)

    await query(
      `UPDATE teacher_settings SET ${fields.join(', ')} WHERE teacher_id = ?`,
      values
    )

    const result = await query('SELECT * FROM teacher_settings WHERE teacher_id = ?', [req.user.id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export default router
