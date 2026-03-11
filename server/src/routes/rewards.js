import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../db/index.js'

const router = express.Router()

// Get all rewards
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM rewards WHERE teacher_id = ? ORDER BY points_required ASC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching rewards:', error)
    res.status(500).json({ error: 'Failed to fetch rewards' })
  }
})

// Create reward
router.post('/', async (req, res) => {
  try {
    const { name, description, pointsRequired, icon } = req.body

    if (!name || pointsRequired === undefined) {
      return res.status(400).json({ error: 'Name and points required' })
    }

    const id = uuidv4()
    await query(
      `INSERT INTO rewards (id, teacher_id, name, description, points_required, icon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, name, description || '', pointsRequired, icon || '🎁']
    )

    const result = await query('SELECT * FROM rewards WHERE id = ?', [id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error creating reward:', error)
    res.status(500).json({ error: 'Failed to create reward' })
  }
})

// Get student rewards
router.get('/student/:studentId', async (req, res) => {
  try {
    const result = await query(
      `SELECT sr.*, r.* FROM student_rewards sr
       JOIN rewards r ON sr.reward_id = r.id
       JOIN students s ON sr.student_id = s.id
       WHERE sr.student_id = ? AND s.teacher_id = ?
       ORDER BY sr.assigned_at DESC`,
      [req.params.studentId, req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching student rewards:', error)
    res.status(500).json({ error: 'Failed to fetch rewards' })
  }
})

// Assign reward to student
router.post('/assign', async (req, res) => {
  try {
    const { studentId, rewardId } = req.body

    if (!studentId || !rewardId) {
      return res.status(400).json({ error: 'Student and reward ID required' })
    }

    // Verify student belongs to teacher
    const student = await query(
      'SELECT id, points FROM students WHERE id = ? AND teacher_id = ?',
      [studentId, req.user.id]
    )

    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Verify reward belongs to teacher
    const reward = await query(
      'SELECT id, points_required FROM rewards WHERE id = ? AND teacher_id = ?',
      [rewardId, req.user.id]
    )

    if (reward.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' })
    }

    // Check student has enough points
    if (student.rows[0].points < reward.rows[0].points_required) {
      return res.status(400).json({ error: 'Insufficient points' })
    }

    const id = uuidv4()

    // Assign reward
    await query(
      `INSERT INTO student_rewards (id, student_id, reward_id, redeemed)
       VALUES (?, ?, ?, ?)`,
      [id, studentId, rewardId, false]
    )

    // Deduct points
    const newPoints = student.rows[0].points - reward.rows[0].points_required
    await query(
      'UPDATE students SET points = ? WHERE id = ?',
      [newPoints, studentId]
    )

    const result = await query('SELECT * FROM student_rewards WHERE id = ?', [id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error assigning reward:', error)
    res.status(500).json({ error: 'Failed to assign reward' })
  }
})

// Toggle reward redeemed status
router.patch('/:id/redeem', async (req, res) => {
  try {
    const { redeemed } = req.body

    const reward = await query(
      `SELECT sr.* FROM student_rewards sr
       JOIN students s ON sr.student_id = s.id
       WHERE sr.id = ? AND s.teacher_id = ?`,
      [req.params.id, req.user.id]
    )

    if (reward.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' })
    }

    await query(
      `UPDATE student_rewards 
       SET redeemed = ?, redeemed_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [redeemed, redeemed ? new Date().toISOString() : null, req.params.id]
    )

    const result = await query('SELECT * FROM student_rewards WHERE id = ?', [req.params.id])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating reward:', error)
    res.status(500).json({ error: 'Failed to update reward' })
  }
})

// Delete reward
router.delete('/:id', async (req, res) => {
  try {
    const reward = await query(
      `SELECT sr.* FROM student_rewards sr
       JOIN students s ON sr.student_id = s.id
       WHERE sr.id = ? AND s.teacher_id = ?`,
      [req.params.id, req.user.id]
    )

    if (reward.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' })
    }

    await query('DELETE FROM student_rewards WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting reward:', error)
    res.status(500).json({ error: 'Failed to delete reward' })
  }
})

export default router
