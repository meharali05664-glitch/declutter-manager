const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')

const prisma = new PrismaClient()

// Create reusable transporter object using the default SMTP transport
// For real usage, you'd add these to .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'mock_user',
    pass: process.env.EMAIL_PASS || 'mock_pass',
  },
})

async function sendEmailNotification(user, subscription, daysRemaining) {
  if (!user.email) return

  const timeMsg = daysRemaining === 0 ? 'today' : `in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
  const mailOptions = {
    from: '"Declutter Team" <notifications@declutter.com>',
    to: user.email,
    subject: `Renewal Reminder: ${subscription.name} ${timeMsg}`,
    text: `Hi ${user.name},\n\nYour subscription for ${subscription.name} (Rs. ${subscription.amount}) is set to renew ${timeMsg} (${new Date(subscription.nextRenewal).toLocaleDateString()}).\n\nKeep track of your spending with Declutter!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #7C3AED;">Renewal Reminder</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your subscription for <strong>${subscription.name}</strong> is renewing <strong>${timeMsg}</strong>.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Subscription:</strong> ${subscription.name}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> Rs. ${subscription.amount.toLocaleString()}</p>
          <p style="margin: 0;"><strong>Renewal Date:</strong> ${new Date(subscription.nextRenewal).toLocaleDateString()}</p>
        </div>
        <p>Never pay for what you don't use.</p>
        <p style="font-size: 12px; color: #666;">This is an automated reminder from Declutter App.</p>
      </div>
    `
  }

  try {
    // In a real app, you'd use transporter.sendMail(mailOptions)
    // For this demo/task, we'll log it if not configured properly or use ethereal
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'mock_user') {
        await transporter.sendMail(mailOptions)
        console.log(`Email sent to ${user.email} for ${subscription.name}`)
    } else {
        console.log('--- MOCK EMAIL SENT ---')
        console.log(`To: ${user.email}`)
        console.log(`Subject: ${mailOptions.subject}`)
        console.log('-----------------------')
    }
  } catch (err) {
    console.error('Error sending email:', err)
  }
}

async function createNotification(userId, subscription, daysRemaining) {
  const timeMsg = daysRemaining === 0 ? 'today' : `in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`
  let title = `Renewal Reminder: ${subscription.name}`
  let message = `${subscription.name} (Rs. ${subscription.amount.toLocaleString()}) renews ${timeMsg} (${new Date(subscription.nextRenewal).toLocaleDateString()}).`
  let dateStr = new Date(subscription.nextRenewal).toISOString().split('T')[0]

  if (subscription.isTrial) {
    title = `Trial Ending: ${subscription.name}`
    const charge = subscription.postTrialAmount !== null ? subscription.postTrialAmount : subscription.amount
    message = `Your ${subscription.name} free trial ends ${timeMsg} — cancel now to avoid Rs. ${charge.toLocaleString()} charge!`
    if (subscription.trialEndDate) {
      dateStr = new Date(subscription.trialEndDate).toISOString().split('T')[0]
    }
  }

  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      subscriptionId: subscription.id,
      message: {
        contains: dateStr
      },
      type: 'renewal_reminder'
    }
  })

  if (!existing) {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        subscriptionId: subscription.id,
        type: 'renewal_reminder'
      }
    })
    
    // Also send email
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
        await sendEmailNotification(user, subscription, daysRemaining)
    }
  }
}

async function autoConvertEndedTrials() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const trials = await prisma.subscription.findMany({
    where: { isTrial: true, status: 'active' }
  })
  
  for (const sub of trials) {
    if (!sub.trialEndDate) continue;
    const endDate = new Date(sub.trialEndDate)
    endDate.setHours(0, 0, 0, 0)
    
    if (endDate.getTime() <= today.getTime()) {
      console.log(`Auto-converting trial for ${sub.name}`)
      const nextRenewal = new Date(sub.trialEndDate)
      if (sub.billingCycle === 'yearly') {
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1)
      } else {
        nextRenewal.setMonth(nextRenewal.getMonth() + 1)
      }
      const newAmount = sub.postTrialAmount !== null ? sub.postTrialAmount : sub.amount;
      
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          isTrial: false,
          amount: newAmount,
          myShare: newAmount,
          nextRenewal
        }
      })
    }
  }
}

async function checkUpcomingRenewals() {
  console.log('Checking for upcoming renewals...')
  await autoConvertEndedTrials()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const subs = await prisma.subscription.findMany({
    where: { status: 'active' },
    include: { user: true }
  })

  for (const sub of subs) {
    let checkDate = new Date(sub.nextRenewal)
    if (sub.isTrial && sub.trialEndDate) {
      checkDate = new Date(sub.trialEndDate)
    }
    checkDate.setHours(0, 0, 0, 0)
    
    const diffTime = checkDate.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Notify for today (0), tomorrow (1), and in 3 days (3)
    if (diffDays === 0 || diffDays === 1 || diffDays === 3) {
      await createNotification(sub.userId, sub, diffDays)
    }
  }
}

async function checkSubscriptionForNotification(subId) {
    const sub = await prisma.subscription.findUnique({
        where: { id: subId },
        include: { user: true }
    })
    
    if (!sub || sub.status !== 'active') return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let checkDate = new Date(sub.nextRenewal)
    if (sub.isTrial && sub.trialEndDate) {
      checkDate = new Date(sub.trialEndDate)
    }
    checkDate.setHours(0, 0, 0, 0)
    
    const diffTime = checkDate.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    console.log(`Checking sub ${sub.name}: checkDate=${checkDate.toISOString()}, today=${today.toISOString()}, diffDays=${diffDays}`)

    if (diffDays === 0 || diffDays === 1 || diffDays === 3) {
      await createNotification(sub.userId, sub, diffDays)
    }
}

module.exports = {
  checkUpcomingRenewals,
  checkSubscriptionForNotification
}
