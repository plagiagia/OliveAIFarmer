import { spawnSync } from 'node:child_process'

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const isProductionVercel = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'

if (isProductionVercel) {
  console.log('[build:vercel] Production deploy detected. Applying Prisma migrations...')
  run('npx', ['prisma', 'migrate', 'deploy'])
} else {
  console.log('[build:vercel] Preview/development deploy detected. Skipping Prisma migrate deploy.')
}

console.log('[build:vercel] Generating Prisma client...')
run('npx', ['prisma', 'generate'])

console.log('[build:vercel] Building Next.js app...')
run('npx', ['next', 'build'])
