# Parallax — Digital Agency Workspace

A cloud workspace for running a digital agency: client communication, project
delivery and agency finances in one dashboard.

Built on **Next.js 16 (App Router)** with **React 19**, TypeScript, Tailwind
CSS v4, Radix UI primitives, dnd-kit, Recharts, Prisma and Auth.js v5 against
PostgreSQL on Neon. Validation is Zod end-to-end; passwords are hashed with
bcrypt.

---

## Getting started

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, ADMIN_*
npm run db:migrate          # creates the schema
npm run db:seed             # demo agency, team, clients, projects, invoices
npm run dev
```

Open <http://localhost:3000>.

### Environment

| Variable        | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `DATABASE_URL`  | Neon **pooled** connection (host contains `-pooler`), used at runtime |
| `DIRECT_URL`    | Neon **direct** connection, used by `prisma migrate` (pgBouncer can't run DDL in a transaction) |
| `AUTH_SECRET`   | Signs the session JWT — `openssl rand -base64 32`               |
| `AUTH_URL`      | Leave unset — inferred from the request `Host` header in dev and on every Vercel environment. Only set it if deploying behind something that doesn't forward a trustworthy `Host`, and then use the exact deployed origin (`https://your-app.example.com`), **never** a `localhost` value — a stray `localhost` here sends every sign-in/sign-out redirect to that literal URL instead of the real site |
| `ADMIN_EMAIL`   | Used only to *create* the admin if it doesn't exist yet (default `admin@parallax.agency`) |
| `ADMIN_NAME`    | Display name for that same bootstrap                            |
| `ADMIN_PASSWORD`| Required the first time the admin is created; seeding fails loudly if unset |
| `SUPPORT_EMAIL` | Optional — shown on the login page as a "request access" contact. Omit to hide it; never put the admin's email here |
| `SEED_PASSWORD` | Shared password given to every non-admin seeded account (default `Parallax!2026`) |

### Accounts

The **admin is private**. It is never given `SEED_PASSWORD`, never listed on the
login page, and re-seeding never resets its password. Set it up once with:

```bash
npm run admin:password -- admin@parallax.agency        # generates and prints one
npm run admin:password -- admin@parallax.agency 'pw'   # or choose your own
```

If the admin row does not exist yet, `npm run db:seed` creates it from
`ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` and fails loudly if
`ADMIN_PASSWORD` is unset — so a public admin can never be created by accident.

**Demo accounts** share `SEED_PASSWORD` (default `Parallax!2026`) and are
re-hashed on every seed, each with its own salt. None of them may be an admin:
the seed types the demo list as `Exclude<Role, 'ADMIN'>`, so adding one is a
compile error rather than a silent privilege grant.

| Email                       | Role      | Lands on     |
| --------------------------- | --------- | ------------ |
| `abdulatef@parallax.agency` | Developer | `/dashboard` |
| `sara@parallax.agency`      | Designer  | `/dashboard` |
| `ops@helios-retail.com`     | Client    | `/portal`    |
| `hello@northwindlabs.io`    | Client    | `/portal`    |
| `it@meridianhealth.co`      | Client    | `/portal`    |

The login page (`app/login/page.tsx`) also offers one-click demo sign-in
buttons for a Developer, a Designer and a Client. Its `DEMO_ACCOUNTS` list is
hand-maintained separately from `prisma/seed.ts` rather than generated from
it, so if you rename or remove a seeded account, check that list too.

---

## Features

**Client portal** — clients sign in to `/portal` and see only their own
engagements: live delivery progress, deadlines, budget and every invoice raised
against them.

**Kanban board** — drag tasks between To Do / In Progress / In Review / Done on
any project. Moves are optimistic and roll back with a toast if the server
rejects them. Pointer and keyboard sensors are both wired up (`@dnd-kit`).

**Financial dashboard** — collected revenue, outstanding and overdue balances, a
six-month billing trend, invoice-status breakdown and the delivery pipeline.

**Account settings** — every signed-in user, regardless of role, can update
their own name, email and password from `/settings`
(`lib/actions/account.ts`). There is deliberately no `requireRole()` gate here
— unlike everything else in the app, it's open to every role.

**Admin user management** — admins create, edit and delete team members and
clients from `/team` and `/clients` (`lib/actions/users.ts`). Deleting a
client walks through the same reassign-or-cascade choice as the CLI script
below, but as a confirmation dialog (`components/users/delete-user-dialog.tsx`)
instead of a terminal command, and it additionally blocks an admin from
deleting their own account.

**Role-based access control** — four roles with genuinely different views:

| | Admin | Developer / Designer | Client |
| --- | :-: | :-: | :-: |
| Dashboard | ✓ | ✓ (no financials) | — |
| Client portal | — | — | ✓ |
| All projects | ✓ | ✓ | own only |
| Create / edit projects | ✓ | — | — |
| Create / move / edit tasks | ✓ | ✓ | — |
| Budgets, revenue, invoices | ✓ | — | own only |
| Manage clients & team | ✓ | — | — |
| Edit own account (`/settings`) | ✓ | ✓ | ✓ |

---

## Architecture

### Next.js 16 specifics

This project targets Next.js 16, which differs from earlier App Router versions:

- **`proxy.ts`, not `middleware.ts`.** Middleware was renamed to Proxy and runs
  on the Node.js runtime. It performs an *optimistic* session-cookie check only.
- **Async request APIs.** `params`, `searchParams`, `cookies()` and `headers()`
  are Promises with no synchronous fallback. Pages use the generated
  `PageProps<'/route'>` helpers (`npx next typegen`).
- **Turbopack by default** for both `next dev` and `next build`.
- **`next lint` is gone** — `npm run lint` calls the ESLint CLI directly
  (`eslint`), and `next build` no longer lints.

### Streaming and status codes

There are **no `loading.tsx` files**, and that is deliberate. A `loading.tsx`
puts its Suspense boundary *above* the page, so the response begins streaming
before the page body runs — and a streamed response can no longer set its status
line. In practice that silently turned `notFound()` on `/projects/[id]` into a
`200`, and every `requireRole()` redirect into a `200` with a client-side hop.

Instead each page runs its DAL gate first, then wraps only the slow database
work in an in-page `<Suspense>` (see `components/skeletons.tsx`). Skeletons still
stream; 404s stay 404s and role redirects stay 307s.

### Authorization

Security lives in the **Data Access Layer** (`lib/dal.ts`), close to the data —
never in the UI and never in the proxy:

```
proxy.ts          optimistic cookie check → bounce anonymous visitors
   ↓
lib/dal.ts        requireUser() / requireRole() / authorize()  ← the real gate
   ↓
lib/queries.ts    every query filtered through projectScope(user)
lib/actions/*     every Server Action re-checks the role and re-validates input
```

`projectScope()` reduces to `{ clientId: user.id }` for clients, so a client
requesting another client's project gets a 404 rather than a 403 — the row is
simply not in their scope. Server Actions are treated as public endpoints: each
one calls `authorize()` and re-parses its input with Zod, because a client
component can never be trusted to have restricted itself. `lib/actions/account.ts`
is the one deliberate exception — it authorizes against the caller's own id
rather than a role, since every role may manage its own account.

Financial data is *omitted from the response*, not hidden with CSS — a
designer's project page contains no budget or invoice markup at all.

### Layout

```
app/
  (workspace)/            authenticated shell — sidebar, top bar, role-aware nav
    layout.tsx             shell chrome shared by every workspace route
    error.tsx               workspace-level error boundary
    not-found.tsx
    dashboard/             financial + delivery dashboard (staff)
    projects/[id]/         project detail: Kanban board, invoices
    tasks/                 cross-project task list with filters
    invoices/              billing (admin: all, client: own)
    clients/  team/        account management (admin)
    settings/              self-service account editing (every role)
    portal/                client portal
  login/                  credentials sign-in + demo quick sign-in
  api/auth/[...nextauth]/ Auth.js route handlers
auth.ts                   NextAuth v5 config (Credentials + JWT sessions)
proxy.ts                  optimistic route gate
lib/
  dal.ts  rbac.ts         authorization
  queries.ts              role-scoped reads
  actions/                Server Actions (mutations): account, auth, invoices,
                           projects, tasks, users
  validation.ts           Zod schemas + form state
  prisma.ts  constants.ts utils.ts
components/
  ui/                     Radix-based primitives
  charts/                 Recharts wrappers
  kanban/                 drag-and-drop board
  projects/  invoices/  tasks/  settings/  users/  shell/
prisma/                   schema.prisma, seed.ts, migrations/
scripts/                  set-password.ts, delete-user.ts
types/                    next-auth.d.ts (session/JWT augmentation)
```

### Charts

The categorical chart palette in `app/globals.css` (`--chart-1`…`--chart-4`) is
hand-tuned in OKLCH against a specific bar: each slot targets a consistent
lightness band, a chroma floor, adjacent-pair colour-vision-deficiency
separation and sufficient contrast against its surface — **separately for
light and dark**, since dark mode is stepped independently rather than
flipped. There is no automated validator script yet (see Known gaps) — treat
the criteria in the CSS comments as the bar to hit if you touch those values.

Invoice status uses reserved status tokens (`--success` / `--warning` /
`--destructive`, never a categorical slot) and always ships with a visible
label, so state is never encoded by colour alone.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Run the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed demo data (idempotent) |
| `npm run admin:password -- <email> [pw]` | Set or rotate an account password |
| `npm run user:delete -- <email\|id>` | Delete a user safely (see below) |
| `npm run db:studio` | Prisma Studio |

---

## Deleting users

Deleting a client straight from SQL fails:

```
update or delete on table "User" violates RESTRICT setting of
foreign key constraint "Project_clientId_fkey" on table "Project"
```

That is the schema working as intended. `Project.clientId` is a **required**
relation, which Prisma defaults to `onDelete: Restrict`, so a client cannot
vanish while projects — and their paid invoices — still point at them.
`Task.assigneeId` is **optional**, so it's declared with `onDelete: SetNull`:
team members delete cleanly and their tasks simply become unassigned. Same
DELETE, two outcomes, decided purely by whether the relation is optional.

Two ways to do it safely, both going through the same reassign-or-cascade
decision:

- **In the app**: an admin can delete a user from `/team` or `/clients`; the
  confirmation dialog surfaces the reassign/cascade choice and blocks
  self-deletion (`lib/actions/users.ts`).
- **From the CLI** (`scripts/delete-user.ts`), useful for scripting or when
  you don't have a browser session:

```bash
npm run user:delete -- <email|id>                          # report; deletes nothing if blocked
npm run user:delete -- <email|id> --reassign-to <email>    # move projects to another CLIENT, then delete
npm run user:delete -- <email|id> --with-projects          # delete their projects, tasks and invoices too
```

Both paths refuse to remove the last remaining admin. If the account is still
listed in `prisma/seed.ts`, the next `npm run db:seed` recreates it — remove it
there too to make the deletion stick.

## Known gaps

The database schema is implemented exactly as specified. A few consequences
worth noting:

- **Design review / feedback comments** are described in the feature list but
  have no model in the schema. Adding them needs a `Comment` (or `Feedback`)
  model related to `Project` and `User`; the portal currently surfaces progress
  and invoices only.
- **Kanban column ordering** is not persisted — `Task` has no `order` field, so
  cards within a column sort by priority then recency.
- **No automated test suite.** There's no `tests/`, e2e runner, or `npm test`
  script yet — role/route access is currently verified by hand. Adding an
  HTTP-level regression suite (real sessions per role, asserting redirect
  targets, the out-of-scope 404, and the anonymous bounce) would be the
  highest-leverage addition given how central `lib/dal.ts` is to the security
  model.
- **No chart-palette validator.** The OKLCH criteria described above are
  documented in `app/globals.css` but not enforced by a script — see Charts.

Both schema gaps are additive changes rather than rework.
