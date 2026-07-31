import {
  InvoiceStatus,
  PrismaClient,
  ProjectStatus,
  Role,
  TaskStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD = process.env.SEED_PASSWORD ?? 'Parallax!2026'

/** Date `days` from today (negative = in the past). */
function offsetDays(days: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

async function main() {
  const password = await bcrypt.hash(PASSWORD, 10)

  // --- Team ---------------------------------------------------------------
  const team = [
    { name: 'Evan', email: 'admin@parallax.agency', role: Role.ADMIN },
    { name: 'Omar Hassan', email: 'omar@parallax.agency', role: Role.DEVELOPER },
    { name: 'Lina Botros', email: 'lina@parallax.agency', role: Role.DEVELOPER },
    { name: 'Yara Adel', email: 'yara@parallax.agency', role: Role.DESIGNER },
    { name: 'Karim Saleh', email: 'karim@parallax.agency', role: Role.DESIGNER },
  ]

  const clients = [
    { name: 'Helios Retail', email: 'ops@helios-retail.com', role: Role.CLIENT },
    { name: 'Northwind Labs', email: 'hello@northwindlabs.io', role: Role.CLIENT },
    { name: 'Meridian Health', email: 'it@meridianhealth.co', role: Role.CLIENT },
  ]

  for (const user of [...team, ...clients]) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: { ...user, password },
    })
  }

  const byEmail = async (email: string) =>
    prisma.user.findUniqueOrThrow({ where: { email } })

  const [admin, omar, lina, yara, karim] = await Promise.all(
    team.map((u) => byEmail(u.email))
  )
  const [helios, northwind, meridian] = await Promise.all(
    clients.map((c) => byEmail(c.email))
  )
  void admin

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
        { title: 'Catalog service API contract', status: TaskStatus.DONE, priority: 3, assigneeId: omar.id },
        { title: 'Product detail page build', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: lina.id },
        { title: 'Checkout wireframes', status: TaskStatus.DONE, priority: 2, assigneeId: yara.id },
        { title: 'Design system tokens', status: TaskStatus.IN_REVIEW, priority: 2, assigneeId: karim.id },
        { title: 'Cart persistence + edge caching', status: TaskStatus.TODO, priority: 3, assigneeId: omar.id },
        { title: 'Payment provider integration', status: TaskStatus.TODO, priority: 3, assigneeId: null },
        { title: 'Accessibility audit', status: TaskStatus.TODO, priority: 1, assigneeId: yara.id },
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
        { title: 'Color system + dark mode', status: TaskStatus.DONE, priority: 3, assigneeId: yara.id },
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
        { title: 'Compliance requirements workshop', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: omar.id },
        { title: 'Information architecture', status: TaskStatus.TODO, priority: 2, assigneeId: yara.id },
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
        { title: 'Analytics instrumentation', status: TaskStatus.DONE, priority: 1, assigneeId: omar.id },
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
  console.log(`All accounts share the password: ${PASSWORD}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
