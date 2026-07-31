import type { Metadata } from 'next'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ReceiptIcon,
  WalletIcon,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { InvoiceDialog } from '@/components/invoices/invoice-dialog'
import { InvoiceStatusSelect } from '@/components/invoices/invoice-status-select'
import { ProjectBoard } from '@/components/projects/project-board'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { StatCard } from '@/components/stat-card'
import {
  InvoiceStatusBadge,
  ProjectStatusBadge,
} from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserAvatar } from '@/components/user-avatar'
import { requireUser } from '@/lib/dal'
import { getProject, listAssignees, listClients } from '@/lib/queries'
import {
  canManageInvoices,
  canManageProjects,
  canManageTasks,
  canViewFinancials,
} from '@/lib/rbac'
import { cn, daysUntil, formatCurrency, formatDate } from '@/lib/utils'

export async function generateMetadata(
  props: PageProps<'/projects/[id]'>
): Promise<Metadata> {
  const user = await requireUser()
  const { id } = await props.params
  const project = await getProject(user, id)
  return { title: project?.title ?? 'Project' }
}

export default async function ProjectDetailPage(
  props: PageProps<'/projects/[id]'>
) {
  const user = await requireUser()
  const { id } = await props.params

  // `getProject` is scoped by role, so an out-of-scope id is a 404, not a 403.
  const project = await getProject(user, id)
  if (!project) notFound()

  const canEditProject = canManageProjects(user.role)
  const canEditTasks = canManageTasks(user.role)
  const canBill = canManageInvoices(user.role)
  const seesMoney = canViewFinancials(user.role) || user.role === 'CLIENT'

  const [assignees, clients] = await Promise.all([
    canEditTasks ? listAssignees() : Promise.resolve([]),
    canEditProject ? listClients() : Promise.resolve([]),
  ])

  const done = project.tasks.filter((task) => task.status === 'DONE').length
  const percent =
    project.tasks.length === 0
      ? 0
      : Math.round((done / project.tasks.length) * 100)

  const invoiced = project.invoices
    .filter((invoice) => invoice.status !== 'DRAFT')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const collected = project.invoices
    .filter((invoice) => invoice.status === 'PAID')
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  const days = project.deadline ? daysUntil(project.deadline) : null
  const late = days !== null && days < 0 && project.status !== 'COMPLETED'

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3">
          <Link href={user.role === 'CLIENT' ? '/portal' : '/projects'}>
            <ArrowLeftIcon />
            Back
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.title}
              </h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            {project.description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {project.description}
              </p>
            ) : null}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar
                name={project.client.name}
                avatarUrl={project.client.avatarUrl}
                className="size-6"
              />
              {project.client.name}
            </div>
          </div>

          {canEditProject ? (
            <div className="flex shrink-0 gap-2">
              <ProjectDialog
                clients={clients}
                project={{
                  id: project.id,
                  title: project.title,
                  description: project.description,
                  status: project.status,
                  clientId: project.client.id,
                  deadline: project.deadline,
                  budget: project.budget,
                }}
                trigger={<Button variant="outline">Edit project</Button>}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Only four across when the viewer actually gets the two money cards —
          otherwise two tiles would sit stranded in a four-column track. */}
      <section
        className={cn(
          'grid gap-4 sm:grid-cols-2',
          seesMoney && 'xl:grid-cols-4'
        )}
      >
        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Progress
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{percent}%</p>
          <Progress value={percent} className="mt-3" />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2Icon className="size-3.5" />
            {done} of {project.tasks.length} tasks complete
          </p>
        </Card>

        <StatCard
          label="Deadline"
          value={formatDate(project.deadline)}
          hint={
            days === null
              ? 'No deadline set'
              : late
                ? `${Math.abs(days)} days overdue`
                : `${days} days remaining`
          }
          icon={CalendarIcon}
          tone={late ? 'danger' : 'default'}
        />

        {seesMoney ? (
          <>
            <StatCard
              label="Budget"
              value={
                project.budget ? formatCurrency(project.budget) : 'Not set'
              }
              hint={`${formatCurrency(invoiced)} invoiced`}
              icon={WalletIcon}
            />
            <StatCard
              label="Collected"
              value={formatCurrency(collected)}
              hint={
                invoiced - collected > 0
                  ? `${formatCurrency(invoiced - collected)} outstanding`
                  : 'Fully collected'
              }
              icon={ReceiptIcon}
              tone={invoiced - collected > 0 ? 'warning' : 'success'}
            />
          </>
        ) : null}
      </section>

      <ProjectBoard
        projectId={project.id}
        tasks={project.tasks}
        assignees={assignees}
        canManage={canEditTasks}
      />

      {seesMoney ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            {canBill ? (
              <InvoiceDialog
                projects={[{ id: project.id, title: project.title }]}
                projectId={project.id}
              />
            ) : null}
          </CardHeader>
          <CardContent className="px-0">
            {project.invoices.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                No invoices raised for this project yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs">
                        INV-{invoice.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(invoice.amount, true)}
                      </TableCell>
                      <TableCell>
                        {canBill ? (
                          <InvoiceStatusSelect
                            invoiceId={invoice.id}
                            status={invoice.status}
                          />
                        ) : (
                          <InvoiceStatusBadge status={invoice.status} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
