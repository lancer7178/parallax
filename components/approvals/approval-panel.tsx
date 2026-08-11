import { ClipboardCheckIcon } from 'lucide-react'

import { ApprovalDecision } from '@/components/approvals/approval-decision'
import { RequestApprovalDialog } from '@/components/approvals/request-approval-dialog'
import { ApprovalStatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProjectApproval } from '@/lib/queries'
import { formatDate } from '@/lib/utils'

/**
 * Deliverables sent to the client, and what the client said back.
 *
 * The same component serves both sides on purpose: the agency and the client
 * read one shared record of what was sent and what was decided, and only the
 * decision controls differ. `canDecide` is passed down from a server-side role
 * check — the action re-checks both role and project ownership regardless.
 */
export function ApprovalPanel({
  projectId,
  approvals,
  canRequest,
  canDecide,
}: {
  projectId: string
  approvals: ProjectApproval[]
  canRequest: boolean
  canDecide: boolean
}) {
  const pending = approvals.filter((a) => a.status === 'PENDING')
  const decided = approvals.filter((a) => a.status !== 'PENDING')

  return (
    <Card id="approvals" className="scroll-mt-20">
      <CardHeader className="flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Approvals</CardTitle>
          <p className="text-sm text-muted-foreground">
            {canDecide
              ? 'Deliverables waiting on your sign-off.'
              : 'Deliverables sent to the client for sign-off.'}
          </p>
        </div>
        {canRequest ? <RequestApprovalDialog projectId={projectId} /> : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {approvals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <ClipboardCheckIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">Nothing sent for approval</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {canRequest
                ? 'Send a deliverable when it is ready for the client to review.'
                : 'The team will send deliverables here when they are ready for you.'}
            </p>
          </div>
        ) : null}

        {pending.map((approval) => (
          <article
            key={approval.id}
            className="rounded-xl border border-warning/30 bg-warning/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h3 className="font-medium">{approval.title}</h3>
                {approval.description ? (
                  <p className="text-sm text-muted-foreground">
                    {approval.description}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Sent {formatDate(approval.createdAt)}
                  {approval.requestedBy ? ` by ${approval.requestedBy.name}` : ''}
                </p>
              </div>
              <ApprovalStatusBadge status={approval.status} />
            </div>

            {canDecide ? (
              <ApprovalDecision
                approvalId={approval.id}
                title={approval.title}
              />
            ) : null}
          </article>
        ))}

        {decided.length > 0 ? (
          <ul className="divide-y divide-border">
            {decided.map((approval) => (
              <li
                key={approval.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{approval.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {approval.status === 'APPROVED' ? 'Approved' : 'Reviewed'}{' '}
                    {formatDate(approval.decidedAt)}
                  </p>
                  {approval.feedback ? (
                    <p className="mt-1.5 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      “{approval.feedback}”
                    </p>
                  ) : null}
                </div>
                <ApprovalStatusBadge status={approval.status} />
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
