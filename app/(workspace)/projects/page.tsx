import type { Metadata } from 'next'
import { BriefcaseIcon } from 'lucide-react'

import { EmptyState, PageHeader } from '@/components/page-header'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { StatusFilter } from '@/components/status-filter'
import { requireRole } from '@/lib/dal'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/lib/constants'
import { listClients, listProjects } from '@/lib/queries'
import { canManageProjects, canViewFinancials } from '@/lib/rbac'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage(props: PageProps<'/projects'>) {
  const user = await requireRole('ADMIN', 'DEVELOPER', 'DESIGNER')

  const { status } = await props.searchParams
  const current = typeof status === 'string' ? status : 'ALL'

  const canManage = canManageProjects(user.role)
  const [projects, clients] = await Promise.all([
    listProjects(user, current),
    canManage ? listClients() : Promise.resolve([]),
  ])

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every engagement the agency is delivering."
      >
        {canManage ? <ProjectDialog clients={clients} /> : null}
      </PageHeader>

      <StatusFilter
        basePath="/projects"
        current={current}
        options={PROJECT_STATUSES.map((value) => ({
          value,
          label: PROJECT_STATUS_LABELS[value],
        }))}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon className="size-6" />}
          title="No projects here"
          description={
            current === 'ALL'
              ? 'Create your first project to start tracking delivery.'
              : 'No projects match this status filter.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              href={`/projects/${project.id}`}
              showBudget={canViewFinancials(user.role)}
            />
          ))}
        </div>
      )}
    </>
  )
}
