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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
  if (!publishableKey.startsWith('pk_live_')) {
    // Not fatal: failing the build here would also block shipping the fix for
    // this. Flip to process.exit(1) once Production is on a pk_live_ key.
    console.warn(
      '\n[build:vercel] WARNING: production is building against a Clerk development ' +
        `instance (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${publishableKey.slice(0, 8) || '<unset>'}…).\n` +
        '[build:vercel] Development instances cap user counts and use the dev-browser ' +
        'handshake instead of production session cookies on a custom domain.\n' +
        '[build:vercel] Set the pk_live_ publishable key and the matching sk_live_ ' +
        'CLERK_SECRET_KEY in the Production environment.\n'
    )
  }

  console.log('[build:vercel] Production deploy detected. Applying Prisma migrations...')
  run('npx', ['prisma', 'migrate', 'deploy'])
} else {
  console.log('[build:vercel] Preview/development deploy detected. Skipping Prisma migrate deploy.')
}

console.log('[build:vercel] Generating Prisma client...')
run('npx', ['prisma', 'generate'])

console.log('[build:vercel] Building Next.js app...')
run('npx', ['next', 'build'])
