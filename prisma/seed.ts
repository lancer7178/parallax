import {
  InvoiceStatus,
  PrismaClient,
  ProjectStatus,
  Role,
  TaskStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/** Shared password for the demo team and client accounts only. */
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'Parallax!2026'

/**
 * The admin is a private account and is deliberately kept out of the demo set:
 * it never receives `SEED_PASSWORD`, and it is never listed on the login page.
 * Re-seeding does not touch the password of an account that already exists.
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@parallax.agency'
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Evan'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

/**
 * Hash per user. Hashing once and reusing the string would give every account
 * the same salt, so a single cracking effort would open all of them.
 */
const hash = (plain: string) => bcrypt.hash(plain, 10)

/** Date `days` from today (negative = in the past). */
function offsetDays(days: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

async function main() {
  // --- Private admin ------------------------------------------------------
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  })

  if (!existingAdmin && !ADMIN_PASSWORD) {
    throw new Error(
      `No admin account exists and ADMIN_PASSWORD is not set.\n` +
        `Set ADMIN_PASSWORD in .env, or run: npm run admin:password -- ${ADMIN_EMAIL}`
    )
  }

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    // Never reset the password of an admin that already exists.
    update: { name: ADMIN_NAME, role: Role.ADMIN },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: Role.ADMIN,
      password: await hash(ADMIN_PASSWORD!),
    },
  })

  // --- Demo accounts (shared password, never ADMIN) -----------------------
  // The `Exclude` makes "no admin in the demo set" a compile error rather than
  // a runtime check, so it cannot be forgotten when adding an account.
  type DemoUser = {
    name: string
    email: string
    role: Exclude<Role, typeof Role.ADMIN>
  }

  const team: DemoUser[] = [
    {
      name: 'abdulatef selem',
      email: 'abdulatef@parallax.agency',
      role: Role.DEVELOPER,
    },
    { name: 'Lina Botros', email: 'lina@parallax.agency', role: Role.DEVELOPER },
    { name: 'sara ahmed', email: 'sara@parallax.agency', role: Role.DESIGNER },
    { name: 'Karim Saleh', email: 'karim@parallax.agency', role: Role.DESIGNER },
  ]

  const clients: DemoUser[] = [
    { name: 'Helios Retail', email: 'ops@helios-retail.com', role: Role.CLIENT },
    { name: 'Northwind Labs', email: 'hello@northwindlabs.io', role: Role.CLIENT },
    { name: 'Meridian Health', email: 'it@meridianhealth.co', role: Role.CLIENT },
  ]

  for (const user of [...team, ...clients]) {
    // The seed owns demo passwords, so it re-hashes them on every run. That is
    // what gives each row its own salt — `create`-only hashing would leave any
    // pre-existing row on whatever hash it already had. The admin is excluded
    // from this loop precisely because its password must never be reset.
    const password = await hash(DEMO_PASSWORD)
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, password },
      create: { ...user, password },
    })
  }

  const byEmail = async (email: string) =>
    prisma.user.findUniqueOrThrow({ where: { email } })

  const [abdulatef, lina, sara, karim] = await Promise.all(
    team.map((u) => byEmail(u.email))
  )
  const [helios, northwind, meridian] = await Promise.all(
    clients.map((c) => byEmail(c.email))
  )

  // Re-seeding should be idempotent, so clear project-scoped data first.
  // Tasks and invoices cascade from Project.
  await prisma.project.deleteMany()

  // --- Projects -----------------------------------------------------------
  const projects = [
    {
      title: 'Helios Commerce Replatform',
      description:
        'Migrate the Helios storefront to a headless Next.js architecture with a new checkout flow.',
      status: ProjectStatus.ACTIVE,
      deadline: offsetDays(48),
      budget: 145_000,
      clientId: helios.id,
      tasks: [
        { title: 'Catalog service API contract', status: TaskStatus.DONE, priority: 3, assigneeId: abdulatef.id },
        { title: 'Product detail page build', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: lina.id },
        { title: 'Checkout wireframes', status: TaskStatus.DONE, priority: 2, assigneeId: sara.id },
        { title: 'Design system tokens', status: TaskStatus.IN_REVIEW, priority: 2, assigneeId: karim.id },
        { title: 'Cart persistence + edge caching', status: TaskStatus.TODO, priority: 3, assigneeId: abdulatef.id },
        { title: 'Payment provider integration', status: TaskStatus.TODO, priority: 3, assigneeId: null },
        { title: 'Accessibility audit', status: TaskStatus.TODO, priority: 1, assigneeId: sara.id },
      ],
      invoices: [
        { amount: 48_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-62) },
        { amount: 48_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-24) },
        { amount: 32_000, status: InvoiceStatus.PENDING, dueDate: offsetDays(11) },
      ],
    },
    {
      title: 'Northwind Design System',
      description:
        'A cross-product component library and brand refresh covering web and mobile surfaces.',
      status: ProjectStatus.IN_REVIEW,
      deadline: offsetDays(14),
      budget: 62_000,
      clientId: northwind.id,
      tasks: [
        { title: 'Typography scale', status: TaskStatus.DONE, priority: 2, assigneeId: karim.id },
        { title: 'Color system + dark mode', status: TaskStatus.DONE, priority: 3, assigneeId: sara.id },
        { title: 'Component documentation site', status: TaskStatus.IN_REVIEW, priority: 2, assigneeId: lina.id },
        { title: 'Icon set handoff', status: TaskStatus.IN_PROGRESS, priority: 1, assigneeId: karim.id },
      ],
      invoices: [
        { amount: 31_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-40) },
        { amount: 31_000, status: InvoiceStatus.OVERDUE, dueDate: offsetDays(-9) },
      ],
    },
    {
      title: 'Meridian Patient Portal',
      description:
        'HIPAA-conscious patient portal with appointment booking and secure messaging.',
      status: ProjectStatus.PLANNING,
      deadline: offsetDays(96),
      budget: 210_000,
      clientId: meridian.id,
      tasks: [
        { title: 'Compliance requirements workshop', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: abdulatef.id },
        { title: 'Information architecture', status: TaskStatus.TODO, priority: 2, assigneeId: sara.id },
        { title: 'Auth + audit logging spike', status: TaskStatus.TODO, priority: 3, assigneeId: lina.id },
      ],
      invoices: [
        { amount: 42_000, status: InvoiceStatus.DRAFT, dueDate: offsetDays(30) },
      ],
    },
    {
      title: 'Helios Loyalty Campaign',
      description: 'Seasonal loyalty microsite and email campaign templates.',
      status: ProjectStatus.COMPLETED,
      deadline: offsetDays(-20),
      budget: 38_000,
      clientId: helios.id,
      tasks: [
        { title: 'Landing page build', status: TaskStatus.DONE, priority: 2, assigneeId: lina.id },
        { title: 'Email template set', status: TaskStatus.DONE, priority: 1, assigneeId: karim.id },
        { title: 'Analytics instrumentation', status: TaskStatus.DONE, priority: 1, assigneeId: abdulatef.id },
      ],
      invoices: [
        { amount: 19_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-75) },
        { amount: 19_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-45) },
      ],
    },
  ]

  for (const { tasks, invoices, ...project } of projects) {
    await prisma.project.create({
      data: {
        ...project,
        tasks: { create: tasks },
        invoices: { create: invoices },
      },
    })
  }

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    invoices: await prisma.invoice.count(),
  }

  console.log('Seed complete:', counts)
  console.log(`Demo accounts (developer/designer/client): ${DEMO_PASSWORD}`)
  console.log(
    `Admin ${ADMIN_EMAIL} is private — its password is not printed here.`
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
