const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

// Routes
const authRoutes          = require('./routes/auth')
const subscriptionRoutes  = require('./routes/subscriptions')

app.use('/api/auth',          authRoutes)
app.use('/api/subscriptions', subscriptionRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: '✂️ Declutter Backend — Chal Raha Hai!', version: '2.0.0', market: 'PK/IN' })
})

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error.' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Declutter server running on port ${PORT}`))