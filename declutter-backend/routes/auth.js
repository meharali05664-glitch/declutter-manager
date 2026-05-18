const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'declutter_secret_2024'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, country = 'PK', currency = 'PKR' } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, country, currency },
      select: { id: true, name: true, phone: true, email: true, country: true, currency: true, isPro: true }
    })
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ message: 'Account created!', token, user })
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email already exists.' })
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }
    
    const user = await prisma.user.findFirst({
      where: { email }
    })
    
    if (!user) return res.status(401).json({ error: 'User not found.' })
    if (!user.password) return res.status(401).json({ error: 'User does not have a password set.' })
    
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Incorrect password.' })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ message: 'Login successful!', token, user: { id:user.id, name:user.name, phone:user.phone, email:user.email, isPro:user.isPro, currency:user.currency } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required.' })

    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) return res.status(400).json({ error: 'User with this email not found.' })

    // Generate a reset token valid for 15 minutes
    const resetToken = jwt.sign({ userId: user.id, reset: true }, JWT_SECRET, { expiresIn: '15m' })
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`

    // Setup nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const mailOptions = {
      from: `"Declutter App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#10B981;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>This link is valid for 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `
    }

    await transporter.sendMail(mailOptions)
    res.json({ message: 'Password reset link sent to your email.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Failed to process forgot password request.' })
  }
})

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' })

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token.' })
    }

    if (!decoded.reset) {
      return res.status(400).json({ error: 'Invalid token type.' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Password successfully reset.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
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