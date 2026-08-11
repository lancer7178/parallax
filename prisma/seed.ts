import {
  ActivityType,
  ApprovalStatus,
  InvoiceStatus,
  PrismaClient,
  ProjectStatus,
  Role,
  TaskStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

import { GOAL_DEFS } from '../lib/constants'

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

/** Date `days` from today, backdated further for activity log timestamps. */
function activityTime(daysAgo: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
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

  const admin = await prisma.user.upsert({
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
    { name: 'Omar Nabil', email: 'omar@parallax.agency', role: Role.DEVELOPER },
    { name: 'Yasmine Adel', email: 'yasmine@parallax.agency', role: Role.DESIGNER },
    { name: 'Tarek Hassan', email: 'tarek@parallax.agency', role: Role.DEVELOPER },
  ]

  const clients: DemoUser[] = [
    { name: 'Helios Retail', email: 'ops@helios-retail.com', role: Role.CLIENT },
    { name: 'Northwind Labs', email: 'hello@northwindlabs.io', role: Role.CLIENT },
    { name: 'Meridian Health', email: 'it@meridianhealth.co', role: Role.CLIENT },
    { name: 'Atlas Finance', email: 'projects@atlasfinance.com', role: Role.CLIENT },
    { name: 'Borealis Media', email: 'team@borealismedia.tv', role: Role.CLIENT },
    { name: 'Crestview Realty', email: 'ops@crestviewrealty.com', role: Role.CLIENT },
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

  const [abdulatef, lina, sara, karim, omar, yasmine, tarek] = await Promise.all(
    team.map((u) => byEmail(u.email))
  )
  const [helios, northwind, meridian, atlas, borealis, crestview] =
    await Promise.all(clients.map((c) => byEmail(c.email)))

  // Re-seeding should be idempotent, so clear project-scoped data first.
  // Tasks and invoices cascade from Project. Activity references projects
  // and users via SetNull, so it survives the wipe and is reseeded fresh.
  await prisma.project.deleteMany()
  await prisma.activity.deleteMany()

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
        { title: 'Product detail page build', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: lina.id, dueDate: offsetDays(0) },
        { title: 'Checkout wireframes', status: TaskStatus.DONE, priority: 2, assigneeId: sara.id },
        { title: 'Design system tokens', status: TaskStatus.IN_REVIEW, priority: 2, assigneeId: karim.id, dueDate: offsetDays(-2) },
        { title: 'Cart persistence + edge caching', status: TaskStatus.TODO, priority: 3, assigneeId: abdulatef.id, dueDate: offsetDays(6) },
        { title: 'Payment provider integration', status: TaskStatus.TODO, priority: 3, assigneeId: null, dueDate: offsetDays(18) },
        { title: 'Accessibility audit', status: TaskStatus.TODO, priority: 1, assigneeId: sara.id, dueDate: offsetDays(27) },
      ],
      invoices: [
        { amount: 48_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-62) },
        { amount: 48_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-24) },
        { amount: 32_000, status: InvoiceStatus.PENDING, dueDate: offsetDays(11) },
      ],
      approvals: [
        {
          title: 'Homepage and category templates',
          description: 'Final desktop and mobile layouts for the storefront entry pages.',
          status: ApprovalStatus.APPROVED,
          decidedAt: activityTime(6),
          requestedById: sara.id,
          createdAt: activityTime(11),
        },
        {
          title: 'Checkout flow prototype',
          description: 'End-to-end checkout including guest purchase and saved cards.',
          status: ApprovalStatus.PENDING,
          requestedById: sara.id,
          createdAt: activityTime(2),
        },
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
        { title: 'Component documentation site', status: TaskStatus.IN_REVIEW, priority: 2, assigneeId: lina.id, dueDate: offsetDays(-3) },
        { title: 'Icon set handoff', status: TaskStatus.IN_PROGRESS, priority: 1, assigneeId: karim.id, dueDate: offsetDays(4) },
      ],
      invoices: [
        { amount: 31_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-40) },
        { amount: 31_000, status: InvoiceStatus.OVERDUE, dueDate: offsetDays(-9) },
      ],
      approvals: [
        {
          title: 'Component library release candidate',
          description: 'Buttons, forms, navigation and data display components.',
          status: ApprovalStatus.PENDING,
          requestedById: karim.id,
          createdAt: activityTime(4),
        },
        {
          title: 'Dark mode palette',
          description: 'Surface, border and accent tokens for the dark theme.',
          status: ApprovalStatus.CHANGES_REQUESTED,
          feedback:
            'Contrast on the secondary buttons is too low against the dark surface. Please raise it before we sign off.',
          decidedAt: activityTime(8),
          requestedById: sara.id,
          createdAt: activityTime(13),
        },
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
        { title: 'Compliance requirements workshop', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: abdulatef.id, dueDate: offsetDays(16) },
        { title: 'Information architecture', status: TaskStatus.TODO, priority: 2, assigneeId: sara.id, dueDate: offsetDays(30) },
        { title: 'Auth + audit logging spike', status: TaskStatus.TODO, priority: 3, assigneeId: lina.id },
      ],
      invoices: [
        { amount: 42_000, status: InvoiceStatus.DRAFT, dueDate: offsetDays(30) },
      ],
      approvals: [],
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
      approvals: [
        {
          title: 'Loyalty microsite',
          description: 'Landing page, rewards tiers and sign-up flow.',
          status: ApprovalStatus.APPROVED,
          decidedAt: activityTime(28),
          requestedById: lina.id,
          createdAt: activityTime(34),
        },
      ],
    },
    {
      title: 'Atlas Trading Dashboard',
      description:
        'Real-time trading dashboard rebuild with live market data feeds and risk alerts.',
      status: ProjectStatus.ACTIVE,
      deadline: offsetDays(35),
      budget: 265_000,
      clientId: atlas.id,
      tasks: [
        { title: 'Market data websocket layer', status: TaskStatus.DONE, priority: 3, assigneeId: omar.id },
        { title: 'Positions table virtualization', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: tarek.id, dueDate: offsetDays(0) },
        { title: 'Risk alert rules engine', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: omar.id, dueDate: offsetDays(7) },
        { title: 'Dashboard layout system', status: TaskStatus.DONE, priority: 2, assigneeId: yasmine.id },
        { title: 'Dark-mode chart theming', status: TaskStatus.IN_REVIEW, priority: 2, assigneeId: yasmine.id, dueDate: offsetDays(3) },
        { title: 'Latency monitoring', status: TaskStatus.TODO, priority: 2, assigneeId: tarek.id, dueDate: offsetDays(12) },
        { title: 'Penetration test remediation', status: TaskStatus.TODO, priority: 3, assigneeId: null },
      ],
      invoices: [
        { amount: 88_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-90) },
        { amount: 88_000, status: InvoiceStatus.PAID, dueDate: offsetDays(0) },
        { amount: 89_000, status: InvoiceStatus.PENDING, dueDate: offsetDays(25) },
      ],
      approvals: [
        {
          title: 'Dashboard layout system',
          description: 'Panel grid, saved layouts and responsive breakpoints.',
          status: ApprovalStatus.APPROVED,
          decidedAt: activityTime(5),
          requestedById: yasmine.id,
          createdAt: activityTime(10),
        },
        {
          title: 'Risk alert notification rules',
          description: 'Thresholds and delivery channels for the alerting engine.',
          status: ApprovalStatus.PENDING,
          requestedById: omar.id,
          createdAt: activityTime(1),
        },
      ],
    },
    {
      title: 'Atlas Compliance Reporting',
      description:
        'Automated regulatory reporting pipeline for quarterly filings.',
      status: ProjectStatus.PLANNING,
      deadline: offsetDays(110),
      budget: 96_000,
      clientId: atlas.id,
      tasks: [
        { title: 'Regulatory requirements matrix', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: omar.id, dueDate: offsetDays(21) },
        { title: 'Report template drafts', status: TaskStatus.TODO, priority: 1, assigneeId: yasmine.id },
        { title: 'Data warehouse export spike', status: TaskStatus.TODO, priority: 2, assigneeId: tarek.id },
      ],
      invoices: [
        { amount: 24_000, status: InvoiceStatus.DRAFT, dueDate: offsetDays(40) },
      ],
      approvals: [],
    },
    {
      title: 'Borealis Streaming App',
      description:
        'Cross-platform streaming client with offline downloads and adaptive bitrate playback.',
      status: ProjectStatus.ACTIVE,
      deadline: offsetDays(60),
      budget: 178_000,
      clientId: borealis.id,
      tasks: [
        { title: 'Adaptive bitrate player', status: TaskStatus.IN_PROGRESS, priority: 3, assigneeId: lina.id, dueDate: offsetDays(9) },
        { title: 'Offline download queue', status: TaskStatus.TODO, priority: 2, assigneeId: abdulatef.id, dueDate: offsetDays(21) },
        { title: 'Playback UI redesign', status: TaskStatus.DONE, priority: 2, assigneeId: karim.id },
        { title: 'Content recommendation carousel', status: TaskStatus.IN_REVIEW, priority: 2, assigneeId: sara.id, dueDate: offsetDays(-1) },
        { title: 'Chromecast support', status: TaskStatus.TODO, priority: 1, assigneeId: null },
      ],
      invoices: [
        { amount: 59_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-30) },
        { amount: 59_000, status: InvoiceStatus.PENDING, dueDate: offsetDays(5) },
      ],
      approvals: [
        {
          title: 'Playback UI final screens',
          description: 'Player controls, quality selector and offline download states.',
          status: ApprovalStatus.PENDING,
          requestedById: karim.id,
          createdAt: activityTime(3),
        },
      ],
    },
    {
      title: 'Borealis Brand Refresh',
      description: 'New visual identity, style guide and marketing site.',
      status: ProjectStatus.COMPLETED,
      deadline: offsetDays(-55),
      budget: 41_000,
      clientId: borealis.id,
      tasks: [
        { title: 'Logo + wordmark exploration', status: TaskStatus.DONE, priority: 2, assigneeId: yasmine.id },
        { title: 'Marketing site build', status: TaskStatus.DONE, priority: 2, assigneeId: tarek.id },
        { title: 'Brand guidelines PDF', status: TaskStatus.DONE, priority: 1, assigneeId: yasmine.id },
      ],
      invoices: [
        { amount: 20_500, status: InvoiceStatus.PAID, dueDate: offsetDays(-120) },
        { amount: 20_500, status: InvoiceStatus.PAID, dueDate: offsetDays(-85) },
      ],
      approvals: [
        {
          title: 'Brand guidelines',
          description: 'Logo usage, typography, colour and photography direction.',
          status: ApprovalStatus.APPROVED,
          decidedAt: activityTime(58),
          requestedById: yasmine.id,
          createdAt: activityTime(64),
        },
      ],
    },
    {
      title: 'Crestview Listings Platform',
      description:
        'Property listings marketplace with map search, saved searches and agent messaging.',
      status: ProjectStatus.IN_REVIEW,
      deadline: offsetDays(9),
      budget: 132_000,
      clientId: crestview.id,
      tasks: [
        { title: 'Map search performance pass', status: TaskStatus.IN_REVIEW, priority: 3, assigneeId: abdulatef.id, dueDate: offsetDays(2) },
        { title: 'Saved search notifications', status: TaskStatus.DONE, priority: 2, assigneeId: omar.id },
        { title: 'Agent messaging inbox', status: TaskStatus.IN_PROGRESS, priority: 2, assigneeId: lina.id, dueDate: offsetDays(-5) },
        { title: 'Listing card redesign', status: TaskStatus.DONE, priority: 1, assigneeId: karim.id },
        { title: 'SEO metadata pass', status: TaskStatus.TODO, priority: 1, assigneeId: sara.id, dueDate: offsetDays(7) },
      ],
      invoices: [
        { amount: 44_000, status: InvoiceStatus.PAID, dueDate: offsetDays(-50) },
        { amount: 44_000, status: InvoiceStatus.OVERDUE, dueDate: offsetDays(-4) },
        { amount: 44_000, status: InvoiceStatus.PENDING, dueDate: offsetDays(20) },
      ],
      approvals: [
        {
          title: 'Listing card redesign',
          description: 'New listing card with photo carousel and saved-search badge.',
          status: ApprovalStatus.CHANGES_REQUESTED,
          feedback:
            'The price should sit above the address, and we need the agent photo back on the card.',
          decidedAt: activityTime(7),
          requestedById: karim.id,
          createdAt: activityTime(12),
        },
        {
          title: 'Map search interaction',
          description: 'Draw-to-search, cluster behaviour and mobile bottom sheet.',
          status: ApprovalStatus.PENDING,
          requestedById: sara.id,
          createdAt: activityTime(1),
        },
      ],
    },
  ]

  const createdProjects: Record<string, { id: string }> = {}
  for (const { tasks, invoices, approvals, ...project } of projects) {
    const created = await prisma.project.create({
      data: {
        ...project,
        tasks: { create: tasks },
        invoices: { create: invoices },
        approvals: { create: approvals },
      },
      select: { id: true },
    })
    createdProjects[project.title] = created
  }

  // --- Goals ---------------------------------------------------------------
  // Seeded once with the default target from GOAL_DEFS; admins can move these
  // from the dashboard afterward without the seed ever overwriting an edit.
  for (const def of GOAL_DEFS) {
    await prisma.goal.upsert({
      where: { key: def.key },
      update: {},
      create: { key: def.key, label: def.label, targetValue: def.defaultTarget },
    })
  }

  // --- Activity feed ---------------------------------------------------------
  // A short backdated history so the dashboard's feed isn't empty on first
  // run — real usage appends to this going forward via `logActivity`.
  await prisma.activity.createMany({
    data: [
      {
        type: ActivityType.PROJECT_CREATED,
        message: 'Atlas Trading Dashboard was created.',
        actorId: admin.id,
        projectId: createdProjects['Atlas Trading Dashboard']!.id,
        createdAt: activityTime(2),
      },
      {
        type: ActivityType.TASK_COMPLETED,
        message: 'Market data websocket layer was completed.',
        actorId: omar.id,
        projectId: createdProjects['Atlas Trading Dashboard']!.id,
        createdAt: activityTime(1),
      },
      {
        type: ActivityType.INVOICE_PAID,
        message: '$88,000 invoice paid for Atlas Trading Dashboard.',
        actorId: admin.id,
        projectId: createdProjects['Atlas Trading Dashboard']!.id,
        createdAt: activityTime(0),
      },
      {
        type: ActivityType.TASK_COMPLETED,
        message: 'Saved search notifications was completed.',
        actorId: omar.id,
        projectId: createdProjects['Crestview Listings Platform']!.id,
        createdAt: activityTime(3),
      },
      {
        type: ActivityType.PROJECT_COMPLETED,
        message: 'Borealis Brand Refresh was marked complete.',
        actorId: admin.id,
        projectId: createdProjects['Borealis Brand Refresh']!.id,
        createdAt: activityTime(6),
      },
      {
        type: ActivityType.APPROVAL_REQUESTED,
        message: 'Checkout flow prototype was sent to Helios Retail for approval.',
        actorId: sara.id,
        projectId: createdProjects['Helios Commerce Replatform']!.id,
        createdAt: activityTime(2),
      },
      {
        type: ActivityType.APPROVAL_APPROVED,
        message: 'Helios Retail approved Homepage and category templates.',
        actorId: helios.id,
        projectId: createdProjects['Helios Commerce Replatform']!.id,
        createdAt: activityTime(6),
      },
      {
        type: ActivityType.APPROVAL_CHANGES_REQUESTED,
        message: 'Crestview Realty requested changes on Listing card redesign.',
        actorId: crestview.id,
        projectId: createdProjects['Crestview Listings Platform']!.id,
        createdAt: activityTime(7),
      },
      {
        type: ActivityType.USER_JOINED,
        message: 'Tarek Hassan joined as developer.',
        actorId: admin.id,
        createdAt: activityTime(9),
      },
      {
        type: ActivityType.INVOICE_CREATED,
        message: '$44,000 invoice created for Crestview Listings Platform.',
        actorId: admin.id,
        projectId: createdProjects['Crestview Listings Platform']!.id,
        createdAt: activityTime(12),
      },
    ],
  })

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    invoices: await prisma.invoice.count(),
    approvals: await prisma.approval.count(),
    goals: await prisma.goal.count(),
    activity: await prisma.activity.count(),
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
