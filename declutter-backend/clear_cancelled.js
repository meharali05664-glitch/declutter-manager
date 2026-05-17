const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const deleted = await prisma.subscription.deleteMany({
    where: {
      status: 'cancelled'
    }
  })
  console.log(`Successfully cleared ${deleted.count} cancelled subscriptions.`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
