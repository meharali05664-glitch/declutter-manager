const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { getSmartRecommendations } = require('../services/aiService')
const { GoogleGenerativeAI } = require('@google/generative-ai')

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
    } catch (e) {
      // Continue fallback
    }
  }

  // Fallback
  try {
    const user = await prisma.user.findFirst()
    if (user) {
      req.userId = user.id
      next()
    } else {
      res.status(401).json({ error: 'No users found.' })
    }
  } catch (err) {
    res.status(500).json({ error: 'Auth bypass failed.' })
  }
}

/**
 * GET /api/ai/recommendations
 * Uses RAG (Retrieval-Augmented Generation) to give personalized advice.
 */
router.get('/recommendations', auth, async (req, res) => {
  try {
    console.log('AI Route: Fetching for userId:', req.userId);
    // 1. Get user's subscriptions from database
    const subs = await prisma.subscription.findMany({
      where: { userId: req.userId, status: 'active' }
    })
    console.log(`AI Route: Found ${subs.length} subscriptions in DB`);

    // Auto-flag zombies (same logic as subscriptions route for consistency)
    const processedSubs = subs.map(s => ({
      ...s,
      isZombie: s.status === 'active' && s.usageHours === 0 &&
        (new Date() - new Date(s.createdAt)) > 1000 * 60 * 60 * 24 * 30,
    }))

    // 2. Call the AI service to get RAG recommendations
    const recommendations = getSmartRecommendations(processedSubs)

    // Gather categories from user's subs
    const categories = [...new Set(subs.map(s => s.category))]
    
    const communityInsights = []
    for (const cat of categories) {
      // Find all subscriptions globally for this category
      const catSubs = await prisma.subscription.findMany({
        where: { category: cat }
      })
      if (catSubs.length === 0) continue;
      
      const totalUsers = new Set(catSubs.map(s => s.userId)).size;
      const cancelledCount = catSubs.filter(s => s.status === 'cancelled').length;
      const totalCount = catSubs.length;
      
      const cancelPercent = Math.round((cancelledCount / totalCount) * 100);
      const keptPercent = 100 - cancelPercent;
      
      if (totalUsers > 0) {
        communityInsights.push({
          id: `insight-${cat}`,
          category: cat,
          totalUsers,
          cancelPercent,
          keptPercent,
          text: `Community Insight: ${cancelPercent}% of users cancelled ${cat} subscriptions.`
        })
      }
    }

    // 3. Return the smart recommendations
    res.json({
      recommendations,
      communityInsights,
      timestamp: new Date().toISOString(),
      source: 'Declutter RAG-AI Engine v1.0'
    })
  } catch (err) {
    console.error('AI Recommendations Error:', err)
    res.status(500).json({ error: 'Failed to generate AI recommendations.' })
  }
})

/**
 * POST /api/ai/extract-receipt
 * Extracts subscription details from a base64 encoded image using Gemini.
 */
router.post('/extract-receipt', auth, async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'Image data and mimeType are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `Analyze this subscription receipt or screenshot.
Extract the following information in strict JSON format:
{
  "name": "Service Name (e.g. Netflix, Adobe)",
  "amount": "The total amount charged (number only)",
  "nextRenewal": "The next renewal date or end date in YYYY-MM-DD format. If not found, use an empty string.",
  "isTrial": "Boolean true if this mentions a free trial, false otherwise",
  "trialEndDate": "The end date of the free trial in YYYY-MM-DD format, or empty string if not a trial",
  "postTrialAmount": "The amount that will be charged after the trial ends, or 0 if not found"
}
If you are unsure about any field, return an empty string for that field (or 0 for amount). Only return valid JSON.`;

    const imageParts = [
      {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Clean up markdown formatting if present
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    res.json(data);
  } catch (err) {
    console.error('AI Extraction Error Detailed:', err.message, err.stack);
    if (err.status) console.error('API Status:', err.status);
    res.status(500).json({ error: err.message || 'Failed to extract data from image.', details: err.stack });
  }
})

module.exports = router
