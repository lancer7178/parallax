/**
 * Set (or rotate) an account password.
 *
 *   npm run admin:password -- admin@parallax.agency            # generate one
 *   npm run admin:password -- admin@parallax.agency 'my pass'  # choose one
 *
 * The generated password is printed once and never written to the repo.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

/** ~150 bits of entropy, URL-safe so it survives copy/paste and .env quoting. */
function generatePassword() {
  return crypto.randomBytes(18).toString('base64url')
}

async function main() {
  const [email, provided] = process.argv.slice(2)

  if (!email) {
    throw new Error(
      'Usage: npm run admin:password -- <email> [password]'
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) {
    throw new Error(`No account found for ${email}.`)
  }

  const password = provided ?? generatePassword()

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 10) },
  })

  console.log(`\nPassword updated for ${user.name} <${user.email}> [${user.role}]`)
  if (!provided) {
    console.log(`\n  ${password}\n`)
    console.log('Save it now — this is the only time it is shown.')
  }
}

main()
  .catch((error) => {
    console.error(`\n${error instanceof Error ? error.message : error}\n`)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
