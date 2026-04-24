const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Saari subscriptions lo
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Server error!' })
  }
})

// Naya subscription add karo
router.post('/', async (req, res) => {
  try {
    const { name, amount, billing_cycle, next_renewal } = req.body
    const result = await pool.query(
      'INSERT INTO subscriptions (user_id, name, amount, billing_cycle, next_renewal) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.userId, name, amount, billing_cycle, next_renewal]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Server error!' })
  }
})

// Subscription delete karo
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    res.json({ message: 'Delete ho gaya!' })
  } catch (error) {
    res.status(500).json({ error: 'Server error!' })
  }
})

module.exports = router