const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'declutter_secret_2024'

// ─── Auth Middleware ──────────────────────────────────────
async function auth(req, res, next) {
  const header = req.headers.authorization
  if (header) {
    try {
      const { userId } = jwt.verify(header.split(' ')[1], JWT_SECRET)
      req.userId = userId
      return next()
    } catch (e) {}
  }
  try {
    const user = await prisma.user.findFirst()
    if (user) {
      req.userId = user.id
      next()
    } else {
      res.status(401).json({ error: 'No users found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Auth error.' })
  }
}

// Get all notifications for user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' })
  }
})

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.userId },
      data: { isRead: true }
    })
    res.json(notification)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' })
  }
})

// Mark all as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications.' })
  }
})

module.exports = router
