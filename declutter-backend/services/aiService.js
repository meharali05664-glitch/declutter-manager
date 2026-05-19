/**
 * Simple AI Service for Subscription Recommendations
 * Implements a basic RAG (Retrieval-Augmented Generation) flow using keyword-based embeddings.
 */

const KNOWLEDGE_BASE = [
  {
    id: 'zombie-killer',
    keywords: ['unused', 'forget', 'zombie', 'usage', 'low', 'gym', 'fitness'],
    title: 'Kill the Zombies 🧟',
    desc: 'We detected subscriptions with very low usage. These "Zombie" subs drain your wallet every month without providing value.',
    advice: 'Cancel any subscription you haven\'t used in the last 30 days. You can always resubscribe when you actually need it.',
    severity: 'high'
  },
  {
    id: 'streaming-overlap',
    keywords: ['netflix', 'prime', 'disney', 'hbo', 'streaming', 'video', 'entertainment', 'tv'],
    title: 'Streaming Overlap Alert 📺',
    desc: 'You have multiple streaming services active at the same time.',
    advice: 'Most people only watch one show at a time. Consider rotating your streaming services: keep Netflix this month, then switch to Prime next month.',
    severity: 'medium'
  },
  {
    id: 'yearly-savings',
    keywords: ['monthly', 'save', 'yearly', 'annual', 'discount', 'netflix', 'spotify', 'adobe', 'gym'],
    title: 'Switch to Yearly & Save 💰',
    desc: 'Many services offer 20-30% discounts if you pay annually instead of monthly.',
    advice: 'For services you use daily (like Spotify or Work tools), switching to a yearly plan can save you thousands of rupees per year.',
    severity: 'low'
  },
  {
    id: 'family-plan',
    keywords: ['family', 'shared', 'split', 'group', 'spotify', 'youtube', 'netflix', 'office'],
    title: 'Go Family Plan 👨‍👩‍👧‍👦',
    desc: 'Individual plans are expensive compared to Family or Duo plans.',
    advice: 'Check if your friends or family want to split a plan. A YouTube Family plan split 5 ways costs 70% less per person.',
    severity: 'medium'
  },
  {
    id: 'generic-check',
    keywords: ['subscription', 'recurring', 'bill', 'payment'],
    title: 'Monthly Audit ✨',
    desc: 'Regularly auditing your subscriptions is the best way to keep your finances lean.',
    advice: 'Look through your bank statement for recurring charges you might have forgotten about.',
    severity: 'low'
  }
];

/**
 * Simple "Embedding" function: converts text into a keyword frequency map
 */
function getVector(text) {
  const words = text.toLowerCase().match(/\w+/g) || [];
  const vector = {};
  words.forEach(word => {
    vector[word] = (vector[word] || 0) + 1;
  });
  return vector;
}

/**
 * Simple Cosine Similarity between two keyword vectors
 */
function calculateSimilarity(vecA, vecB) {
  const intersection = Object.keys(vecA).filter(word => vecB[word]);
  let dotProduct = 0;
  intersection.forEach(word => {
    dotProduct += vecA[word] * vecB[word];
  });

  const magA = Math.sqrt(Object.values(vecA).reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(Object.values(vecB).reduce((sum, val) => sum + val * val, 0));

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

/**
 * RAG Logic: 
 * 1. Retrieve relevant tips from KNOWLEDGE_BASE based on user subscriptions.
 * 2. Augment user data with these tips.
 * 3. Generate structured recommendations.
 */
function getSmartRecommendations(subscriptions) {
  if (!subscriptions || subscriptions.length === 0) return [];

  const recommendations = [];
  
  // 1. Process each subscription for specific tips
  subscriptions.forEach(sub => {
    const subText = `${sub.name} ${sub.category} ${sub.notes || ''}`.toLowerCase();
    const subVector = getVector(subText);
    const subPrice = parseFloat(sub.myShare) || parseFloat(sub.amount) || 0;
    const annualPrice = subPrice * (sub.billingCycle === 'monthly' ? 12 : 1);
    
    let matchedSpecific = false;

    // Check specific knowledge base tips
    KNOWLEDGE_BASE.forEach(tip => {
      // Don't show the generic check as a sub-specific tip unless matched well
      if (tip.id === 'generic-check') return;

      const tipVector = getVector(tip.keywords.join(' '));
      const score = calculateSimilarity(subVector, tipVector);

      // Higher sensitivity or direct keyword match
      if (score > 0.015 || tip.keywords.some(k => sub.name.toLowerCase().includes(k))) {
        matchedSpecific = true;
        let dynamicDesc = tip.desc;
        let dynamicAdvice = tip.advice;
        let dynamicSaving = 0;

        if (tip.id === 'zombie-killer') {
          dynamicDesc = `We detected that ${sub.name} has very low usage (${sub.usageHours}h). You're paying Rs. ${subPrice.toLocaleString()} for something you rarely use.`;
          dynamicSaving = annualPrice;
        } else if (tip.id === 'yearly-savings' && sub.billingCycle === 'monthly') {
          const yearlySaving = Math.round(annualPrice * 0.2);
          dynamicDesc = `${sub.name} is currently on a monthly plan. Switching to annual could save you ~20% per year.`;
          dynamicAdvice = `By paying for ${sub.name} yearly, you could keep Rs. ${yearlySaving.toLocaleString()} in your pocket.`;
          dynamicSaving = yearlySaving;
        } else if (tip.id === 'family-plan') {
          dynamicDesc = `Individual plans for ${sub.name} are less cost-effective than shared family options.`;
          dynamicAdvice = `Try splitting ${sub.name} with friends. A shared plan could reduce your Rs. ${subPrice.toLocaleString()} monthly cost by up to 60%.`;
          dynamicSaving = Math.round(annualPrice * 0.5);
        }

        recommendations.push({
          id: `rec-${tip.id}-${sub.id}`,
          subId: sub.id,
          name: sub.name,
          icon: sub.icon,
          title: tip.title.replace('Zombies', sub.name).replace('Zombies', sub.name),
          desc: dynamicDesc,
          advice: dynamicAdvice,
          severity: tip.severity,
          saving: dynamicSaving || Math.round(annualPrice * 0.1), // At least 10% optimization assumed
          cta: tip.id === 'zombie-killer' ? 'Cancel Now' : 'Optimize',
          ctaType: tip.severity === 'high' ? 'danger' : 'teal'
        });
      }
    });

    // 2. If no specific match, generate a custom recommendation for ANY subscription
    if (!matchedSpecific) {
      const isHighValue = subPrice > 1000;
      recommendations.push({
        id: `custom-analysis-${sub.id}`,
        subId: sub.id,
        name: sub.name,
        icon: sub.icon,
        title: `Optimize ${sub.name} 🧠`,
        desc: `You're spending Rs. ${subPrice.toLocaleString()} on ${sub.name}. Even for custom services, there are ways to lean down.`,
        advice: isHighValue 
          ? `This is a high-value subscription. Check if they have a "Pause" feature or a lighter tier for months when you are busy.`
          : `Audit this service: are you getting enough value for Rs. ${subPrice.toLocaleString()}? Small recurring costs often go unnoticed but add up.`,
        severity: isHighValue ? 'medium' : 'low',
        saving: Math.round(annualPrice * 0.15), // General 15% optimization target
        cta: 'Review Plan',
        ctaType: 'teal'
      });
    }

    // Special logic for Zombies (direct data check)
    if (sub.isZombie && !recommendations.find(r => r.subId === sub.id && r.id.includes('zombie'))) {
      recommendations.push({
        id: `zombie-${sub.id}`,
        subId: sub.id,
        name: sub.name,
        icon: sub.icon,
        title: `${sub.name} is a Zombie 🧟`,
        desc: `You've used ${sub.name} only ${sub.usageHours}h this month but still paying Rs. ${subPrice.toLocaleString()}.`,
        advice: `This ${sub.name} subscription is costing you Rs. ${annualPrice.toLocaleString()} yearly without giving value. Cancel it to save instantly.`,
        severity: 'high',
        saving: annualPrice,
        cta: 'Cancel Now',
        ctaType: 'danger'
      });
    }
  });

  // 3. Cross-subscription logic (Overlap)
  const entertainmentSubs = subscriptions.filter(s => s.category === 'Entertainment' && s.status === 'active');
  if (entertainmentSubs.length >= 2) {
    const names = entertainmentSubs.map(s => s.name).join(' & ');
    const totalEntSpend = entertainmentSubs.reduce((a, s) => a + (parseFloat(s.myShare) || parseFloat(s.amount) || 0), 0);
    const minSub = [...entertainmentSubs].sort((a,b) => (parseFloat(a.myShare)||parseFloat(a.amount)||0) - (parseFloat(b.myShare)||parseFloat(b.amount)||0))[0];
    
    recommendations.push({
      id: 'overlap-entertainment',
      title: 'Streaming Overlap 📺',
      desc: `You are spending Rs. ${totalEntSpend.toLocaleString()}/mo on ${entertainmentSubs.length} services: ${names}.`,
      advice: `You could save Rs. ${(parseFloat(minSub.myShare || minSub.amount)*12).toLocaleString()} yearly by pausing ${minSub.name} while you binge shows on other platforms.`,
      severity: 'medium',
      saving: (parseFloat(minSub.myShare || minSub.amount) || 0) * 12,
      cta: 'View Overlap',
      ctaType: 'warning',
      icon: '🍿'
    });
  }

  // Deduplicate and prioritize
  const uniqueRecs = [];
  const seenTitles = new Set();
  
  recommendations.sort((a, b) => {
    const sevOrder = { high: 0, medium: 1, low: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  }).forEach(rec => {
    const key = rec.subId ? `${rec.title}-${rec.subId}` : rec.title;
    if (!seenTitles.has(key)) {
      uniqueRecs.push(rec);
      seenTitles.add(key);
    }
  });

  console.log(`AI Engine: Generated ${uniqueRecs.length} unique recommendations for ${subscriptions.length} subs`);
  return uniqueRecs.slice(0, 12); 
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function getPrePurchaseAdvice(serviceName, stats) {
  const apiKey = process.env.GEMINI_API_KEY;
  const systemPrompt = `You are Declutter AI, an assistant helping users manage subscriptions.
Analyze the following community subscription data and recommend if the user should subscribe.
Respond in strict JSON format:
{
  "recommendation": "buy" | "consider" | "avoid",
  "confidence": "high" | "medium" | "low",
  "title": "Short title",
  "text": "Detailed advice mentioning community statistics.",
  "tips": "Practical tip"
}`;

  const userPrompt = `Service Name: ${serviceName}
Community Stats:
- Total community users with this: ${stats.totalCount}
- Active: ${stats.activeCount}
- Cancelled: ${stats.cancelledCount}
- Average usage hours/month: ${stats.avgUsageHours}h
- Share rate: ${Math.round(stats.shareRate * 100)}%
- Average monthly price: Rs. ${Math.round(stats.avgAmount)}
- Retention rate: ${Math.round(stats.retentionRate * 100)}%

Generate recommendations using this community context. Mention specific stats if helpful. If community data is empty (0 users), generate advice based on general knowledge of the service.`;

  if (!apiKey) {
    const retention = stats.retentionRate || 0.5;
    const recommendation = retention >= 0.7 ? 'buy' : retention >= 0.4 ? 'consider' : 'avoid';
    return {
      recommendation,
      confidence: 'medium',
      title: `${serviceName} Community Analysis`,
      text: `Based on ${stats.totalCount} community users, ${Math.round(retention * 100)}% maintain an active subscription. Average usage is ${stats.avgUsageHours || 0}h/month.`,
      tips: `Consider splitting costs if available, as ${Math.round((stats.shareRate || 0)*100)}% of users share this plan.`
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Gemini Pre-purchase Advice Error:', err);
    return {
      recommendation: 'consider',
      confidence: 'low',
      title: `${serviceName} Insight`,
      text: 'Unable to analyze community data at the moment.',
      tips: 'Audit your potential usage before signing up.'
    };
  }
}

async function getPreCancelAdvice(sub, stats) {
  const apiKey = process.env.GEMINI_API_KEY;
  const systemPrompt = `You are Declutter AI, helping users decide whether to cancel a subscription.
Analyze the user's subscription details and community stats. Recommend if they should cancel.
Respond in strict JSON format:
{
  "recommendation": "cancel" | "keep" | "pause",
  "title": "Short title",
  "text": "Detailed advice comparing user usage vs community, and expected savings.",
  "savings": "Estimated annual savings in Rs."
}`;

  const userPrompt = `Subscription details:
- Name: ${sub.name}
- Category: ${sub.category}
- User monthly usage: ${sub.usageHours}h
- User monthly spend: Rs. ${sub.myShare}
- Is shared: ${sub.isShared}

Community Stats for ${sub.name}:
- Total community users: ${stats.totalCount}
- Active: ${stats.activeCount}
- Cancelled: ${stats.cancelledCount}
- Average usage hours/month: ${stats.avgUsageHours}h
- Retention rate: ${Math.round(stats.retentionRate * 100)}%

Generate custom cancellation advice. If their usage is low (zombie), strongly recommend canceling. Compare their usage vs community average.`;

  if (!apiKey) {
    const isZombie = sub.usageHours < 2;
    return {
      recommendation: isZombie ? 'cancel' : 'keep',
      title: `Cancel ${sub.name}?`,
      text: isZombie 
        ? `You have very low usage (${sub.usageHours}h) compared to community average of ${stats.avgUsageHours}h. Cancelling will save you Rs. ${sub.myShare * 12} annually.` 
        : `You are using this service for ${sub.usageHours}h/month. Keep it if it brings value.`,
      savings: sub.myShare * 12
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Gemini Pre-cancel Advice Error:', err);
    return {
      recommendation: 'cancel',
      title: `Cancel ${sub.name}`,
      text: `Cancelling will save you Rs. ${sub.myShare * 12} per year.`,
      savings: sub.myShare * 12
    };
  }
}

module.exports = { getSmartRecommendations, getPrePurchaseAdvice, getPreCancelAdvice };
