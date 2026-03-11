import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/index.js'

const router = express.Router()

// Get attendance for date range
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    let sql = `
      SELECT a.* FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE s.teacher_id = ?
    `
    const params = [req.user.id]

    if (startDate && endDate) {
      sql += ` AND a.date BETWEEN ? AND ?`
      params.push(startDate, endDate)
    }

    sql += ` ORDER BY a.date DESC, a.created_at DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
})

// Mark attendance
router.post('/', async (req, res) => {
  try {
    const { studentId, date, onTime } = req.body

    if (!studentId || !date) {
      return res.status(400).json({ error: 'Student ID and date required' })
    }

    // Verify student belongs to teacher
    const student = await query(
      'SELECT id, points FROM students WHERE id = ? AND teacher_id = ?',
      [studentId, req.user.id]
    )

    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const settings = await query(
      'SELECT points_on_time, points_late, points_absent FROM teacher_settings WHERE teacher_id = ?',
      [req.user.id]
    )

    const pointsSettings = settings.rows[0] || {
      points_on_time: 2,
      points_late: -2,
      points_absent: -5
    }

    const pointsChange = onTime ? pointsSettings.points_on_time : pointsSettings.points_late
    const newPoints = Math.max(0, student.rows[0].points + pointsChange)

    const id = uuidv4()
    await query(
      `INSERT INTO attendance (id, student_id, date, on_time)
       VALUES (?, ?, ?, ?)`,
      [id, studentId, date, onTime]
    )

    // Update student points
    await query(
      'UPDATE students SET points = ? WHERE id = ?',
      [newPoints, studentId]
    )

    const result = await query('SELECT * FROM attendance WHERE id = ?', [id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating attendance:', error)
    res.status(500).json({ error: 'Failed to create attendance' })
  }
})

// Update attendance
router.patch('/:id', async (req, res) => {
  try {
    const { onTime } = req.body

    const attendance = await query(
      `SELECT a.* FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.id = ? AND s.teacher_id = ?`,
      [req.params.id, req.user.id]
    )

    if (attendance.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance not found' })
    }

    await query(
      `UPDATE attendance SET on_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [onTime, req.params.id]
    )

    const result = await query('SELECT * FROM attendance WHERE id = ?', [req.params.id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating attendance:', error)
    res.status(500).json({ error: 'Failed to update attendance' })
  }
})

// Delete attendance
router.delete('/:id', async (req, res) => {
  try {
    const attendance = await query(
      `SELECT a.* FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE a.id = ? AND s.teacher_id = ?`,
      [req.params.id, req.user.id]
    )

    if (attendance.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance not found' })
    }

    await query('DELETE FROM attendance WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    res.status(500).json({ error: 'Failed to delete attendance' })
  }
})

export default router
