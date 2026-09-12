const { PrismaClient } = require('@prisma/client');

// Use a singleton Prisma client to avoid exhausting database connections
const prisma = new PrismaClient();

module.exports = prisma;
