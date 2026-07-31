'use client'

import { Loader2Icon, TriangleAlertIcon } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteUser, type DeleteUserResult } from '@/lib/actions/users'

type Strategy = 'reassign' | 'cascade'

interface Client {
  id: string
  name: string
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  /** Other clients available for reassignment (only needed for client users). */
  otherClients = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
  otherClients?: Client[]
}) {
  const [step, setStep] = React.useState<'confirm' | 'strategy'>('confirm')
  const [projects, setProjects] = React.useState<
    { id: string; title: string; tasks: number; invoices: number }[]
  >([])
  const [strategy, setStrategy] = React.useState<Strategy>('reassign')
  const [reassignToId, setReassignToId] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')

  // Reset state whenever dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setStep('confirm')
      setProjects([])
      setStrategy('reassign')
      setReassignToId(otherClients[0]?.id ?? '')
      setPending(false)
      setError('')
    }
  }, [open, otherClients])

  async function handleDelete(opts?: {
    strategy?: Strategy
    reassignToId?: string
  }) {
    setPending(true)
    setError('')

    try {
      const result: DeleteUserResult = await deleteUser(userId, opts)

      if (result.ok) {
        toast.success(result.message)
        onOpenChange(false)
        return
      }

      // Server says the client owns projects — switch to strategy step
      if (result.needsStrategy && result.projects) {
        setProjects(result.projects)
        setStep('strategy')
        setPending(false)
        return
      }

      // Any other error
      setError(result.message)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  // --- Confirm step (simple delete) ---
  if (step === 'confirm') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {userName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The account will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => handleDelete()}
            >
              {pending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // --- Strategy step (client owns projects) ---
  const totalTasks = projects.reduce((n, p) => n + p.tasks, 0)
  const totalInvoices = projects.reduce((n, p) => n + p.invoices, 0)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlertIcon className="size-5 text-amber-500" />
            {userName} owns {projects.length} project
            {projects.length !== 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            These projects must be handled before the account can be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Project list */}
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border bg-muted/40 p-3 text-sm">
          {projects.map((p) => (
            <div key={p.id} className="flex items-baseline justify-between">
              <span className="font-medium">{p.title}</span>
              <span className="text-xs text-muted-foreground">
                {p.tasks} task{p.tasks !== 1 ? 's' : ''},{' '}
                {p.invoices} invoice{p.invoices !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Strategy options */}
        <fieldset className="space-y-3" disabled={pending}>
          {otherClients.length > 0 && (
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="strategy"
                value="reassign"
                checked={strategy === 'reassign'}
                onChange={() => setStrategy('reassign')}
                className="mt-0.5"
              />
              <div className="space-y-1.5">
                <span className="text-sm font-medium">
                  Reassign projects to another client
                </span>
                <select
                  value={reassignToId}
                  onChange={(e) => setReassignToId(e.target.value)}
                  disabled={strategy !== 'reassign'}
                  className="h-8 w-full rounded-md border border-input bg-card px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-50"
                >
                  {otherClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-destructive/30 p-3 transition-colors has-[:checked]:border-destructive has-[:checked]:bg-destructive/5">
            <input
              type="radio"
              name="strategy"
              value="cascade"
              checked={strategy === 'cascade'}
              onChange={() => setStrategy('cascade')}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-destructive">
                Delete everything
              </span>
              <p className="text-xs text-muted-foreground">
                Permanently removes {projects.length} project
                {projects.length !== 1 ? 's' : ''}, {totalTasks} task
                {totalTasks !== 1 ? 's' : ''}, and {totalInvoices} invoice
                {totalInvoices !== 1 ? 's' : ''}.
              </p>
            </div>
          </label>
        </fieldset>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={
              pending ||
              (strategy === 'reassign' && !reassignToId)
            }
            onClick={() =>
              handleDelete(
                strategy === 'reassign'
                  ? { strategy: 'reassign', reassignToId }
                  : { strategy: 'cascade' }
              )
            }
          >
            {pending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Deleting…
              </>
            ) : strategy === 'reassign' ? (
              'Reassign & Delete'
            ) : (
              'Delete everything'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
