const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log("No user found")
    return
  }

  const newSub = await prisma.subscription.create({
    data: {
      name: 'OpenAI',
      amount: 2000,
      myShare: 2000,
      category: 'Productivity',
      billingCycle: 'monthly',
      nextRenewal: new Date('2026-06-15'),
      status: 'active',
      userId: user.id,
      icon: '🤖',
      color: '#10A37F'
    }
  })

  console.log("Successfully created subscription:", JSON.stringify(newSub, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
