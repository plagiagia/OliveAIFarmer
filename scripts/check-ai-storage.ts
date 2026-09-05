/** Read-only verification of the existing usage table and transaction-lock support. */
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'ai-storage-smoke-check'}))`
      await tx.aIUsage.findFirst({ select: { id: true, totalTokens: true, endpoint: true } })
    })
    console.log('AI usage table and transaction locks verified. No rows changed.')
  } catch (error) {
    console.error('AI storage check failed:', error instanceof Error ? error.name : 'UnknownError')
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}
void main()
