const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const popularServices = [
  { name: 'Netflix', category: 'Entertainment', icon: '📺', color: '#E50914', amount: 1500, cancelDifficulty: 'yellow' },
  { name: 'Spotify', category: 'Entertainment', icon: '🎵', color: '#1DB954', amount: 350, cancelDifficulty: 'green' },
  { name: 'Adobe Creative Cloud', category: 'Productivity', icon: '🎨', color: '#FF0000', amount: 5000, cancelDifficulty: 'red' },
  { name: 'Microsoft 365', category: 'Productivity', icon: '📊', color: '#F25022', amount: 1200, cancelDifficulty: 'yellow' },
  { name: 'YouTube Premium', category: 'Entertainment', icon: '▶️', color: '#FF0000', amount: 479, cancelDifficulty: 'green' },
  { name: 'Amazon Prime', category: 'Entertainment', icon: '📦', color: '#FF9900', amount: 250, cancelDifficulty: 'green' },
  { name: 'ChatGPT Plus', category: 'Productivity', icon: '🤖', color: '#10A37F', amount: 5600, cancelDifficulty: 'green' },
  { name: 'Gym Membership', category: 'Health & Fitness', icon: '🏋️', color: '#3B82F6', amount: 3000, cancelDifficulty: 'red' },
  { name: 'Claude Pro', category: 'Productivity', icon: '🧠', color: '#D97706', amount: 5600, cancelDifficulty: 'green' },
  { name: 'Canva Pro', category: 'Productivity', icon: '🖌️', color: '#00C4CC', amount: 1500, cancelDifficulty: 'green' }
];

async function main() {
  console.log('Clearing database...');
  await prisma.notification.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Generating password hash...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const countries = ['PK', 'IN', 'US'];
  const currencies = { PK: 'PKR', IN: 'INR', US: 'USD' };

  console.log('Seeding 50 users...');
  const userPromises = [];
  for (let i = 1; i <= 50; i++) {
    const country = countries[Math.floor(Math.random() * countries.length)];
    userPromises.push(
      prisma.user.create({
        data: {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          phone: `+92300${1000000 + i}`,
          password: passwordHash,
          country: country,
          currency: currencies[country],
          isPro: Math.random() > 0.8
        }
      })
    );
  }

  const users = await Promise.all(userPromises);
  console.log(`Seeded ${users.length} users successfully.`);

  console.log('Seeding subscriptions for users...');
  const subPromises = [];
  for (const user of users) {
    // Each user gets between 2 and 6 random subscriptions
    const subCount = Math.floor(Math.random() * 5) + 2;
    const shuffled = [...popularServices].sort(() => 0.5 - Math.random());
    const userServices = shuffled.slice(0, subCount);

    for (const service of userServices) {
      const isTrial = Math.random() > 0.85;
      const status = Math.random() > 0.4 ? 'active' : 'cancelled'; // 60% retention rate overall

      const amount = service.amount;
      const isShared = Math.random() > 0.7;
      const myShare = isShared ? Math.round(amount / (Math.floor(Math.random() * 3) + 2)) : amount;

      const baseDate = new Date();
      const nextRenewal = new Date(baseDate.setDate(baseDate.getDate() + Math.floor(Math.random() * 30) + 1));

      // Usage hours: active subs get random usage, cancelled/zombies get 0
      const isZombie = status === 'active' && Math.random() > 0.75;
      const usageHours = status === 'active' && !isZombie ? Math.floor(Math.random() * 40) + 5 : 0;

      subPromises.push(
        prisma.subscription.create({
          data: {
            name: service.name,
            category: service.category,
            icon: service.icon,
            color: service.color,
            amount: amount,
            myShare: myShare,
            billingCycle: 'monthly',
            nextRenewal: nextRenewal,
            status: status,
            isShared: isShared,
            sharedWith: isShared ? JSON.stringify(['friend1@example.com']) : '[]',
            cancelDifficulty: service.cancelDifficulty,
            paymentMethod: 'Card **' + Math.floor(1000 + Math.random() * 9000),
            usageHours: usageHours,
            isZombie: isZombie,
            isTrial: isTrial,
            trialEndDate: isTrial ? new Date(nextRenewal.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
            postTrialAmount: isTrial ? amount : null,
            userId: user.id
          }
        })
      );
    }
  }

  const seededSubs = await Promise.all(subPromises);
  console.log(`Seeded ${seededSubs.length} subscriptions successfully.`);
  console.log('Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
