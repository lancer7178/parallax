import type { Metadata } from 'next'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  UsersIcon,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ApprovalPanel } from '@/components/approvals/approval-panel'
import { InvoiceDialog } from '@/components/invoices/invoice-dialog'
import { InvoiceStatusSelect } from '@/components/invoices/invoice-status-select'
import { ProjectBoard } from '@/components/projects/project-board'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { ProjectFinanceCard } from '@/components/projects/project-finance'
import { ProjectTimeline } from '@/components/projects/project-timeline'
import { StatCard } from '@/components/stat-card'
import {
  HealthBadge,
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
import { invoiceReference } from '@/lib/finance'
import {
  getProject,
  listAssignees,
  listClients,
  listProjectActivity,
} from '@/lib/queries'
import {
  canDecideApprovals,
  canManageInvoices,
  canManageProjects,
  canManageTasks,
  canRequestApprovals,
} from '@/lib/rbac'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

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
  // It also strips money from the payload for viewers who may not see it.
  const project = await getProject(user, id)
  if (!project) notFound()

  const canEditProject = canManageProjects(user.role)
  const canEditTasks = canManageTasks(user.role)
  const canBill = canManageInvoices(user.role)

  const [assignees, clients, activity] = await Promise.all([
    canEditTasks ? listAssignees() : Promise.resolve([]),
    canEditProject ? listClients() : Promise.resolve([]),
    listProjectActivity(user, project.id),
  ])

  const done = project.tasks.filter((task) => task.status === 'DONE').length
  const days = project.deadline ? daysUntil(project.deadline) : null
  const late = days !== null && days < 0 && project.status !== 'COMPLETED'

  // The people actually carrying this project, derived from task assignment
  // rather than a separate membership table.
  const team = new Map<
    string,
    { id: string; name: string; avatarUrl: string | null; open: number }
  >()
  for (const task of project.tasks) {
    if (!task.assignee) continue
    const entry = team.get(task.assignee.id) ?? {
      ...task.assignee,
      open: 0,
    }
    if (task.status !== 'DONE') entry.open += 1
    team.set(task.assignee.id, entry)
  }
  const members = [...team.values()].sort((a, b) => b.open - a.open)

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
              <HealthBadge health={project.health} />
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

      {/* Why the project is flagged, stated in the numbers that flagged it.
          Nothing here is a guess — see `lib/health.ts`. */}
      {project.health.reasons.length > 0 ? (
        <Card
          className={
            project.health.level === 'at_risk'
              ? 'border-destructive/30 bg-destructive/5 p-4'
              : 'border-warning/30 bg-warning/5 p-4'
          }
        >
          <p className="text-sm font-medium">
            {project.health.level === 'at_risk'
              ? 'This project is at risk'
              : 'This project needs attention'}
          </p>
          <ul className="mt-2 space-y-1">
            {project.health.reasons.map((reason) => (
              <li key={reason} className="text-sm text-muted-foreground">
                · {reason}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Progress
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {project.progress}%
          </p>
          <Progress value={project.progress} className="mt-3" />
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

        <StatCard
          label="Team"
          value={String(members.length)}
          hint={
            members.length === 0
              ? 'Nobody assigned yet'
              : `${members.reduce((sum, m) => sum + m.open, 0)} open tasks assigned`
          }
          icon={UsersIcon}
        />

        <Card className="p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Working on this
          </p>
          {members.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No assignees yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {members.slice(0, 3).map((member) => (
                <li key={member.id} className="flex items-center gap-2 text-sm">
                  <UserAvatar
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                    className="size-6"
                  />
                  <span className="min-w-0 flex-1 truncate">{member.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {member.open}
                  </span>
                </li>
              ))}
              {members.length > 3 ? (
                <li className="text-xs text-muted-foreground">
                  +{members.length - 3} more
                </li>
              ) : null}
            </ul>
          )}
        </Card>
      </section>

      {project.finance ? (
        <ProjectFinanceCard
          finance={project.finance}
          progress={project.progress}
        />
      ) : null}

      <ApprovalPanel
        projectId={project.id}
        approvals={project.approvals}
        canRequest={canRequestApprovals(user.role)}
        canDecide={
          canDecideApprovals(user.role) && project.client.id === user.id
        }
      />

      {/* Clients follow progress through approvals and the summary above; the
          internal board is agency-only. */}
      {user.role === 'CLIENT' ? null : (
        <ProjectBoard
          projectId={project.id}
          tasks={project.tasks}
          assignees={assignees}
          canManage={canEditTasks}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {project.finance ? (
          <Card className="lg:col-span-2">
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
                <div className="overflow-x-auto">
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
                            {invoiceReference(invoice.id)}
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
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        <div className={project.finance ? '' : 'lg:col-span-3'}>
          <ProjectTimeline activity={activity} />
        </div>
      </div>
    </>
  )
}
