/**
 * Delete a user safely.
 *
 *   npm run user:delete -- <email|id>                        # report only, deletes nothing if blocked
 *   npm run user:delete -- <email|id> --reassign-to <email>  # move their projects, then delete
 *   npm run user:delete -- <email|id> --with-projects        # delete their projects too
 *
 * Why this exists: `Project.clientId` is a required relation, so Postgres
 * RESTRICTs deleting any client that still owns a project. Raw SQL either fails
 * with a foreign-key error or, if you loosen the constraint, silently destroys
 * invoices. This makes the choice explicit and shows the cost first.
 */
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

function parseArgs(argv: string[]) {
  const [target, ...rest] = argv
  let reassignTo: string | undefined
  let withProjects = false

  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--reassign-to') reassignTo = rest[++i]
    else if (rest[i] === '--with-projects') withProjects = true
    else throw new Error(`Unknown option: ${rest[i]}`)
  }

  return { target, reassignTo, withProjects }
}

const findUser = (key: string) =>
  prisma.user.findFirst({
    where: { OR: [{ email: key.toLowerCase() }, { id: key }] },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clientProjects: {
        select: {
          id: true,
          title: true,
          _count: { select: { tasks: true, invoices: true } },
        },
      },
      _count: { select: { assignedTasks: true } },
    },
  })

async function main() {
  const { target, reassignTo, withProjects } = parseArgs(process.argv.slice(2))

  if (!target) {
    throw new Error(
      'Usage: npm run user:delete -- <email|id> [--reassign-to <email>] [--with-projects]'
    )
  }
  if (reassignTo && withProjects) {
    throw new Error('Use either --reassign-to or --with-projects, not both.')
  }

  const user = await findUser(target)
  if (!user) throw new Error(`No account found for "${target}".`)

  const projects = user.clientProjects
  const tasks = projects.reduce((n, p) => n + p._count.tasks, 0)
  const invoices = projects.reduce((n, p) => n + p._count.invoices, 0)

  console.log(`\n${user.role}  ${user.email}  (${user.name})`)
  console.log(`  owns ${projects.length} project(s), assigned ${user._count.assignedTasks} task(s)`)
  for (const p of projects) {
    console.log(`    - ${p.title} (${p._count.tasks} tasks, ${p._count.invoices} invoices)`)
  }

  // Never let the last administrator be removed — that locks everyone out of
  // the admin-only areas with no way back except the CLI.
  if (user.role === Role.ADMIN) {
    const admins = await prisma.user.count({ where: { role: Role.ADMIN } })
    if (admins <= 1) {
      throw new Error(
        'This is the only ADMIN account. Promote another user first, or you will lock yourself out.'
      )
    }
  }

  if (projects.length > 0 && !reassignTo && !withProjects) {
    console.log(
      `\nBlocked: ${projects.length} project(s) still reference this client.\n` +
        `Choose one:\n` +
        `  npm run user:delete -- ${user.email} --reassign-to <other-client-email>\n` +
        `      keeps all ${tasks} task(s) and ${invoices} invoice(s)\n` +
        `  npm run user:delete -- ${user.email} --with-projects\n` +
        `      also deletes ${projects.length} project(s), ${tasks} task(s), ${invoices} invoice(s)\n`
    )
    process.exitCode = 1
    return
  }

  if (reassignTo) {
    const recipient = await prisma.user.findUnique({
      where: { email: reassignTo.toLowerCase() },
      select: { id: true, email: true, role: true },
    })
    if (!recipient) throw new Error(`No account found for "${reassignTo}".`)
    if (recipient.role !== Role.CLIENT) {
      throw new Error(
        `${recipient.email} is ${recipient.role}; a project's client must be a CLIENT.`
      )
    }
    if (recipient.id === user.id) throw new Error('Cannot reassign to the same user.')

    const moved = await prisma.project.updateMany({
      where: { clientId: user.id },
      data: { clientId: recipient.id },
    })
    console.log(`\nReassigned ${moved.count} project(s) to ${recipient.email}.`)
  }

  if (withProjects && projects.length > 0) {
    // Tasks and invoices cascade from Project.
    const removed = await prisma.project.deleteMany({ where: { clientId: user.id } })
    console.log(
      `\nDeleted ${removed.count} project(s), ${tasks} task(s), ${invoices} invoice(s).`
    )
  }

  await prisma.user.delete({ where: { id: user.id } })
  console.log(`Deleted ${user.email}.`)

  if (user._count.assignedTasks > 0) {
    console.log(
      `${user._count.assignedTasks} task(s) they were assigned are now unassigned.`
    )
  }
  console.log(
    `\nNote: if ${user.email} is still listed in prisma/seed.ts, the next ` +
      `\`npm run db:seed\` will recreate it.\n`
  )
}

main()
  .catch((error) => {
    console.error(`\n${error instanceof Error ? error.message : error}\n`)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
