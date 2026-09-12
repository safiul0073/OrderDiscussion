const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting dynamic database seed...');

  // Configure how many you want dynamically via environment variables
  // Defaulting to 100 users and 1000 orders for a fast local test.
  // Set these in your .env or export them in your terminal to create "as many as possible"
  const USER_COUNT = parseInt(process.env.SEED_USER_COUNT || '100', 10);
  const ORDERS_PER_USER = parseInt(process.env.SEED_ORDERS_PER_USER || '10', 10);

  // Clean the database first
  await prisma.order.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleared existing data.');

  // Create Users in batches to avoid memory limits if scaling extremely high
  console.log(`Generating ${USER_COUNT} users...`);
  const usersData = Array.from({ length: USER_COUNT }).map(() => ({
    email: faker.internet.email(),
    createdAt: faker.date.past({ years: 2 }),
  }));

  // Prisma createMany is highly optimized
  await prisma.user.createMany({
    data: usersData,
    skipDuplicates: true,
  });

  // Fetch created users to get their IDs
  const users = await prisma.user.findMany({ select: { id: true } });

  console.log(`Generating ${users.length * ORDERS_PER_USER} orders...`);
  
  // Generate orders
  const ordersData = [];
  const statuses = ['pending', 'completed', 'shipped', 'cancelled'];

  for (const user of users) {
    for (let i = 0; i < ORDERS_PER_USER; i++) {
      ordersData.push({
        userId: user.id,
        totalAmount: faker.commerce.price({ min: 5, max: 500 }),
        status: faker.helpers.arrayElement(statuses),
        createdAt: faker.date.recent({ days: 365 }),
      });
    }
  }

  // Insert orders in chunks to handle millions of rows gracefully
  const CHUNK_SIZE = 5000;
  for (let i = 0; i < ordersData.length; i += CHUNK_SIZE) {
    const chunk = ordersData.slice(i, i + CHUNK_SIZE);
    await prisma.order.createMany({
      data: chunk,
    });
    console.log(`Inserted order chunk ${i} to ${i + chunk.length}`);
  }

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
