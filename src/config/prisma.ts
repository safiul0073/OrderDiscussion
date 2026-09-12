import { PrismaClient } from '@prisma/client';

// Use a singleton Prisma client to avoid exhausting database connections
const prisma = new PrismaClient();

export default prisma;
