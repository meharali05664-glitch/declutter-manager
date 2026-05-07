const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'declutter_secret_2024'

// ─── Auth Middleware ──────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'No token provided.' })
  try {
    const { userId } = jwt.verify(header.split(' ')[1], JWT_SECRET)
    req.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

// ─── GET /api/subscriptions ───────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, category } = req.query
    const where = { userId: req.userId }
    if (status)   where.status = status
    if (category) where.category = category
    const subs = await prisma.subscription.findMany({
      where, orderBy: { nextRenewal: 'asc' }
    })
    // Auto-flag zombies: active for 6+ months with 0 usage hours
    const flagged = subs.map(s => ({
      ...s,
      sharedWith: JSON.parse(s.sharedWith || '[]'),
      isZombie: s.status === 'active' && s.usageHours === 0 &&
        (new Date() - new Date(s.createdAt)) > 1000 * 60 * 60 * 24 * 30,
    }))
    res.json(flagged)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch subscriptions.' })
  }
})

// ─── POST /api/subscriptions ──────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, category = 'Other', icon = '📦', color = '#7C3AED',
      amount, myShare, billingCycle = 'monthly', nextRenewal,
      status = 'active', isShared = false, sharedWith = [],
      cancelDifficulty = 'yellow', paymentMethod, usageHours = 0,
      notes
    } = req.body
    if (!name || !amount || !nextRenewal) {
      return res.status(400).json({ error: 'name, amount, and nextRenewal are required.' })
    }
    const sub = await prisma.subscription.create({
      data: {
        name, category, icon, color,
        amount: parseFloat(amount),
        myShare: parseFloat(myShare ?? amount),
        billingCycle, nextRenewal: new Date(nextRenewal),
        status, isShared, sharedWith: JSON.stringify(sharedWith),
        cancelDifficulty, paymentMethod, usageHours: parseFloat(usageHours),
        notes, userId: req.userId,
      }
    })
    res.status(201).json({ ...sub, sharedWith })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create subscription.' })
  }
})

// ─── PATCH /api/subscriptions/:id ────────────────────────
router.patch('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.subscription.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!existing) return res.status(404).json({ error: 'Subscription not found.' })
    const data = { ...req.body }
    if (data.sharedWith) data.sharedWith = JSON.stringify(data.sharedWith)
    if (data.nextRenewal) data.nextRenewal = new Date(data.nextRenewal)
    if (data.amount)  data.amount  = parseFloat(data.amount)
    if (data.myShare) data.myShare = parseFloat(data.myShare)
    const updated = await prisma.subscription.update({ where: { id: req.params.id }, data })
    res.json({ ...updated, sharedWith: JSON.parse(updated.sharedWith || '[]') })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update subscription.' })
  }
})

// ─── DELETE /api/subscriptions/:id ───────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.subscription.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!existing) return res.status(404).json({ error: 'Not found.' })
    await prisma.subscription.delete({ where: { id: req.params.id } })
    res.json({ message: 'Deleted successfully.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete.' })
  }
})

// ─── GET /api/subscriptions/insights ─────────────────────
router.get('/insights', auth, async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({ where: { userId: req.userId, status: 'active' } })
    const monthlySpend = subs.reduce((acc, s) => {
      const share = s.myShare || s.amount
      return acc + (s.billingCycle === 'yearly' ? share / 12 : share)
    }, 0)
    const zombies = subs.filter(s => s.usageHours === 0 && (new Date() - new Date(s.createdAt)) > 2592000000)
    const categoryBreakdown = {}
    subs.forEach(s => {
      categoryBreakdown[s.category] = (categoryBreakdown[s.category] || 0) + (s.myShare || s.amount)
    })
    const potentialSavings = zombies.reduce((a, s) => a + (s.myShare || s.amount), 0) * 12
    res.json({
      totalActive: subs.length,
      monthlySpend: Math.round(monthlySpend),
      yearlySpend: Math.round(monthlySpend * 12),
      zombieCount: zombies.length,
      potentialSavings: Math.round(potentialSavings),
      categoryBreakdown,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to compute insights.' })
  }
})

module.exports = router