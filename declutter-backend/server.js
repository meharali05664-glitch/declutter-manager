const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

app.get('/', async (req, res) => {
  res.json({ message: 'De-Clutter Backend Chal Raha Hai!' })
})

async function createTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE, password VARCHAR(200), created_at TIMESTAMP DEFAULT NOW())`)
  await pool.query(`CREATE TABLE IF NOT EXISTS subscriptions (id SERIAL PRIMARY KEY, user_id INTEGER, name VARCHAR(100), amount DECIMAL, billing_cycle VARCHAR(20), next_renewal DATE, status VARCHAR(20) DEFAULT 'active', created_at TIMESTAMP DEFAULT NOW())`)
  console.log('Tables ready!')
}

createTables()

app.listen(process.env.PORT || 5000, () => {
  console.log('Server chal raha hai!')
})