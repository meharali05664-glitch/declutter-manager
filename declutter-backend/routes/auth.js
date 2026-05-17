const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'declutter_secret_2024'

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, country = 'PK', currency = 'PKR' } = req.body
    if (!name || (!phone && !email) || !password) {
      return res.status(400).json({ error: 'Name, phone/email, and password are required.' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, phone: phone || null, email: email || null, password: hashedPassword, country, currency },
      select: { id: true, name: true, phone: true, email: true, country: true, currency: true, isPro: true }
    })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ message: 'Account created!', token, user })
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Phone/Email already exists.' })
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, email, password } = req.body
    const user = await prisma.user.findFirst({
      where: phone ? { phone } : { email }
    })
    if (!user) return res.status(401).json({ error: 'User not found.' })
    
    // If password is provided, verify it. If not, check if it's a simple login (email + phone)
    if (password) {
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return res.status(401).json({ error: 'Incorrect password.' })
    } else if (email && phone) {
      // Simple login: check if both match
      const simpleUser = await prisma.user.findFirst({
        where: { email, phone }
      })
      if (!simpleUser) return res.status(401).json({ error: 'Email and Phone do not match.' })
    } else {
      return res.status(400).json({ error: 'Password or Email+Phone required.' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ message: 'Login successful!', token, user: { id:user.id, name:user.name, phone:user.phone, email:user.email, isPro:user.isPro, currency:user.currency } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// Simple Register (no password required)
router.post('/simple-register', async (req, res) => {
  try {
    const { name, email, phone } = req.body
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required.' })
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    })
    if (existing) return res.status(400).json({ error: 'Email or Phone already exists.' })

    const user = await prisma.user.create({
      data: { name, email, phone, password: '' }, // Empty password for simple auth
      select: { id: true, name: true, phone: true, email: true, country: true, currency: true, isPro: true }
    })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ message: 'Account created!', token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// OTP Request (mock — integrate Twilio/2Factor for production)
router.post('/otp/send', async (req, res) => {
  const { phone } = req.body
  if (!phone) return res.status(400).json({ error: 'Phone number required.' })
  // In production: send via Twilio Verify or 2Factor.in
  console.log(`OTP for ${phone}: 123456 (dev mode)`)
  res.json({ message: 'OTP sent!', dev_otp: '123456' })
})

// OTP Verify (mock)
router.post('/otp/verify', async (req, res) => {
  const { phone, otp } = req.body
  if (otp !== '123456') return res.status(401).json({ error: 'Invalid OTP.' })
  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    user = await prisma.user.create({ data: { phone, name: 'User', password: '' } })
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ message: 'Verified!', token, user: { id:user.id, name:user.name, phone:user.phone, isPro:user.isPro } })
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    let userId = null

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, JWT_SECRET)
        userId = decoded.userId
      } catch (e) {
        // Token invalid, will attempt fallback
      }
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id:true, name:true, phone:true, email:true, country:true, currency:true, isPro:true, createdAt:true }
      })
      if (user) return res.json(user)
    }

    res.status(401).json({ error: 'Unauthorized. Please login.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  }
})

module.exports = router