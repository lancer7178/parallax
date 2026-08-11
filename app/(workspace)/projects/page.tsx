import type { Metadata } from 'next'
import { BriefcaseIcon, PlusIcon } from 'lucide-react'
import { Suspense } from 'react'

import { EmptyState, PageHeader } from '@/components/page-header'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { ProjectCardsFallback } from '@/components/skeletons'
import { StatusFilter } from '@/components/status-filter'
import { Button } from '@/components/ui/button'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/lib/constants'
import { requireRole, type SessionUser } from '@/lib/dal'
import { listClients, listProjects } from '@/lib/queries'
import { canManageProjects } from '@/lib/rbac'

export const metadata: Metadata = { title: 'Projects' }

/**
 * Suspense lives *inside* the page rather than in a `loading.tsx`, because a
 * `loading.tsx` here would also wrap `/projects/[id]` — and a streamed response
 * cannot carry a 404 status, which that route needs for out-of-scope ids.
 */
async function ProjectGrid({
  user,
  status,
}: {
  user: SessionUser
  status: string
}) {
  const projects = await listProjects(user, status)

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<BriefcaseIcon className="size-6" />}
        title="No projects here"
        description={
          status === 'ALL'
            ? 'Create your first project to start tracking delivery.'
            : 'No projects match this status filter.'
        }
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          href={`/projects/${project.id}`}
        />
      ))}
    </div>
  )
}

async function NewProjectButton() {
  const clients = await listClients()
  return <ProjectDialog clients={clients} />
}

export default async function ProjectsPage(props: PageProps<'/projects'>) {
  // Runs before anything streams, so the role gate can still redirect.
  const user = await requireRole('ADMIN', 'DEVELOPER', 'DESIGNER')

  const { status } = await props.searchParams
  const current = typeof status === 'string' ? status : 'ALL'

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every engagement the agency is delivering."
      >
        {canManageProjects(user.role) ? (
          <Suspense
            fallback={
              <Button disabled>
                <PlusIcon />
                New project
              </Button>
            }
          >
            <NewProjectButton />
          </Suspense>
        ) : null}
      </PageHeader>

      <StatusFilter
        basePath="/projects"
        current={current}
        options={PROJECT_STATUSES.map((value) => ({
          value,
          label: PROJECT_STATUS_LABELS[value],
        }))}
      />

      {/* `key` restarts the boundary when the filter changes, so switching
          tabs shows the skeleton instead of stale cards. */}
      <Suspense key={current} fallback={<ProjectCardsFallback />}>
        <ProjectGrid user={user} status={current} />
      </Suspense>
    </>
  )
}
