import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting dynamic database seed (~5,000 users, ~50,000 orders)...');

  const USER_COUNT = parseInt(process.env.SEED_USER_COUNT || '5000', 10);
  const TARGET_ORDERS = parseInt(process.env.SEED_ORDER_COUNT || process.env.SEED_TOTAL_ORDERS || '50000', 10);
  const uniformOrdersPerUser = process.env.SEED_ORDERS_PER_USER ? parseInt(process.env.SEED_ORDERS_PER_USER, 10) : null;

  // 1. Clear existing records and reset autoincrement ID sequences
  console.log('Clearing existing data and resetting sequences...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users, orders RESTART IDENTITY CASCADE;');
  console.log('Cleared existing data.');

  // 2. Generate and insert users in batches
  console.log(`Generating and inserting ${USER_COUNT} users in batches...`);
  const USER_CHUNK_SIZE = 1000;
  for (let i = 0; i < USER_COUNT; i += USER_CHUNK_SIZE) {
    const chunkSize = Math.min(USER_CHUNK_SIZE, USER_COUNT - i);
    const usersChunk = Array.from({ length: chunkSize }).map((_, index) => {
      const idx = i + index + 1;
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return {
        name: `${firstName} ${lastName}`,
        email: `user${idx}.${faker.internet.email({ firstName, lastName }).toLowerCase()}`,
        createdAt: faker.date.past({ years: 2 }),
      };
    });

    await prisma.user.createMany({
      data: usersChunk,
      skipDuplicates: true,
    });
    console.log(`Inserted users ${i + 1} to ${i + chunkSize}`);
  }

  // 3. Fetch created users to associate orders
  const users = await prisma.user.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  console.log(`Loaded ${users.length} users from database.`);

  // 4. Calculate order distribution
  const orderCounts: number[] = new Array(users.length).fill(0);

  if (uniformOrdersPerUser !== null) {
    orderCounts.fill(uniformOrdersPerUser);
  } else {
    orderCounts[0] = 10;
    if (users.length > 1) orderCounts[1] = 5;
    if (users.length > 2) orderCounts[2] = 0;

    const allocated = (orderCounts[0] || 0) + (orderCounts[1] || 0);
    const activeIndices: number[] = [];

    for (let i = 3; i < users.length; i++) {
      if (i % 15 === 0) {
        orderCounts[i] = 0;
      } else {
        activeIndices.push(i);
      }
    }

    if (activeIndices.length > 0) {
      const remainingOrders = Math.max(0, TARGET_ORDERS - allocated);
      const weights = activeIndices.map(() => faker.number.int({ min: 1, max: 20 }));
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      let distributed = 0;
      for (let j = 0; j < activeIndices.length; j++) {
        const count = Math.floor((weights[j] / totalWeight) * remainingOrders);
        orderCounts[activeIndices[j]] = count;
        distributed += count;
      }

      let leftover = remainingOrders - distributed;
      for (let j = 0; leftover > 0; j = (j + 1) % activeIndices.length) {
        orderCounts[activeIndices[j]]++;
        leftover--;
      }
    }
  }

  const totalOrdersToInsert = orderCounts.reduce((a, b) => a + b, 0);
  console.log(`Generating and inserting ${totalOrdersToInsert} orders...`);

  // 5. Generate and insert orders in chunks
  const statuses = ['pending', 'completed', 'shipped', 'cancelled'];
  const ORDER_CHUNK_SIZE = 5000;
  interface OrderInsertItem {
    userId: number;
    totalAmount: string;
    status: string;
    createdAt: Date;
  }
  let currentChunk: OrderInsertItem[] = [];
  let totalInserted = 0;

  for (let u = 0; u < users.length; u++) {
    const count = orderCounts[u];
    const userId = users[u].id;

    for (let o = 0; o < count; o++) {
      currentChunk.push({
        userId,
        totalAmount: faker.commerce.price({ min: 5, max: 500 }),
        status: faker.helpers.arrayElement(statuses),
        createdAt: faker.date.recent({ days: 365 }),
      });

      if (currentChunk.length >= ORDER_CHUNK_SIZE) {
        await prisma.order.createMany({ data: currentChunk });
        totalInserted += currentChunk.length;
        console.log(`Inserted ${totalInserted} / ${totalOrdersToInsert} orders...`);
        currentChunk = [];
      }
    }
  }

  if (currentChunk.length > 0) {
    await prisma.order.createMany({ data: currentChunk });
    totalInserted += currentChunk.length;
    console.log(`Inserted ${totalInserted} / ${totalOrdersToInsert} orders.`);
  }

  console.log(`Database successfully seeded with ${users.length} users and ${totalInserted} orders!`);
}

main()
  .catch((e) => {
    console.error('Error running seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
