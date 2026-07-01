import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export function getPrisma(): PrismaClient {
  // Recreate if HMR left a stale client without model delegates
  if (!globalForPrisma.prisma?.profile) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}
