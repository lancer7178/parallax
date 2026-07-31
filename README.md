# Parallax — Digital Agency Workspace

A cloud workspace for running a digital agency: client communication, project
delivery and agency finances in one dashboard.

Built on **Next.js 16 (App Router)** with TypeScript, Tailwind CSS v4,
Radix-based UI primitives, Recharts, Prisma and Auth.js v5 against
PostgreSQL on Neon.

---

## Getting started

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
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
| `AUTH_URL`      | Inferred in dev; set explicitly in production                   |
| `SEED_PASSWORD` | Password given to every seeded account                          |

### Demo accounts

All share the password in `SEED_PASSWORD` (default `Parallax!2026`).

| Email                    | Role      | Lands on     |
| ------------------------ | --------- | ------------ |
| `admin@parallax.agency`  | Admin     | `/dashboard` |
| `omar@parallax.agency`   | Developer | `/dashboard` |
| `yara@parallax.agency`   | Designer  | `/dashboard` |
| `ops@helios-retail.com`  | Client    | `/portal`    |

---

## Features

**Client portal** — clients sign in to `/portal` and see only their own
engagements: live delivery progress, deadlines, budget and every invoice raised
against them.

**Kanban board** — drag tasks between To Do / In Progress / In Review / Done on
any project. Moves are optimistic and roll back with a toast if the server
rejects them. Pointer and keyboard sensors are both wired up.

**Financial dashboard** — collected revenue, outstanding and overdue balances, a
six-month billing trend, invoice-status breakdown and the delivery pipeline.

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
- **`next lint` is gone** — `npm run lint` calls the ESLint CLI directly, and
  `next build` no longer lints. The React Compiler rules are on, so `setState`
  inside an effect is an error; state is adjusted during render or inside the
  action transition instead.

### Streaming and status codes

There are **no `loading.tsx` files**, and that is deliberate. A `loading.tsx`
puts its Suspense boundary *above* the page, so the response begins streaming
before the page body runs — and a streamed response can no longer set its status
line. In practice that silently turned `notFound()` on `/projects/[id]` into a
`200`, and every `requireRole()` redirect into a `200` with a client-side hop.

Instead each page runs its DAL gate first, then wraps only the slow database
work in an in-page `<Suspense>` (see `components/skeletons.tsx`). Skeletons still
stream; 404s stay 404s and role redirects stay 307s. The regression suite in
"Verification" below covers every one of those status codes.

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
component can never be trusted to have restricted itself.

Financial data is *omitted from the response*, not hidden with CSS — a
designer's project page contains no budget or invoice markup at all.

### Verification

The access rules are exercised over HTTP against the built app with real
sessions for each role — 26 assertions covering every route, both redirect
targets, the out-of-scope `404`, and the anonymous bounce. Re-run them after
touching `lib/dal.ts`, `lib/queries.ts`, or anything that adds a Suspense
boundary above a page.

### Layout

```
app/
  (workspace)/            authenticated shell — sidebar, top bar, role-aware nav
    dashboard/            financial + delivery dashboard (staff)
    projects/[id]/        project detail: Kanban board, invoices
    tasks/                cross-project task list with filters
    invoices/             billing (admin: all, client: own)
    clients/  team/       account management (admin)
    portal/               client portal
  login/                  credentials sign-in
  api/auth/[...nextauth]/ Auth.js route handlers
auth.ts                   NextAuth v5 config (Credentials + JWT sessions)
proxy.ts                  optimistic route gate
lib/
  dal.ts  rbac.ts         authorization
  queries.ts              role-scoped reads
  actions/                Server Actions (mutations)
  validation.ts           Zod schemas + form state
components/
  ui/                     Radix-based primitives
  charts/                 Recharts wrappers
  kanban/                 drag-and-drop board
```

### Charts

The categorical chart palette in `app/globals.css` is validated, not eyeballed:
each slot passes the OKLCH lightness band, a chroma floor, adjacent-pair
colour-vision-deficiency separation (ΔE ≥ 8 in OKLab ×100) and ≥ 3:1 contrast
against its surface — **separately for light and dark**, since dark mode is
stepped independently rather than flipped. Re-run the validator before changing
those values.

Invoice status uses reserved status tokens (never a categorical slot) and always
ships with a visible label, so state is never encoded by colour alone.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed demo data (idempotent) |
| `npm run db:studio` | Prisma Studio |

---

## Known gaps

The database schema is implemented exactly as specified. Two consequences worth
noting:

- **Design review / feedback comments** are described in the feature list but
  have no model in the schema. Adding them needs a `Comment` (or `Feedback`)
  model related to `Project` and `User`; the portal currently surfaces progress
  and invoices only.
- **Kanban column ordering** is not persisted — `Task` has no `order` field, so
  cards within a column sort by priority then recency.

Both are additive schema changes rather than rework.
