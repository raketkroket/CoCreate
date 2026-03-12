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
    const { class_name, class_year, class_subject, points_on_time, points_late } = req.body

    const fields = []
    const values = []

    if (class_name !== undefined) {
      fields.push(`class_name = ?`)
      values.push(class_name)
    }
    if (class_year !== undefined) {
      fields.push(`class_year = ?`)
      values.push(class_year)
    }
    if (class_subject !== undefined) {
      fields.push(`class_subject = ?`)
      values.push(class_subject)
    }
    if (points_on_time !== undefined) {
      fields.push(`points_on_time = ?`)
      values.push(points_on_time)
    }
    if (points_late !== undefined) {
      fields.push(`points_late = ?`)
      values.push(points_late)
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
