'use client'

import { PaperclipIcon, PlusIcon } from 'lucide-react'
import * as React from 'react'
import { useActionState } from 'react'
import { toast } from 'sonner'

import { FieldError, FormMessage, SubmitButton } from '@/components/form-parts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addProjectFile } from '@/lib/actions/files'
import type { FormState } from '@/lib/validation'

/**
 * Attaches a file to a project by reference.
 *
 * The wording says "link" rather than "upload" because that is what it does —
 * `ProjectFile` records where a file lives, it does not store one. Promising
 * an upload and then asking for a URL would be the worse lie.
 */
export function AddFileDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false)

  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await addProjectFile(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'File added.')
        setOpen(false)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          Add file
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a file</DialogTitle>
          <DialogDescription>
            Link a file that already lives somewhere — Figma, Drive, Dropbox, a
            CDN. Parallax keeps the reference, not a copy.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-1.5">
            <Label htmlFor="file-name">File name</Label>
            <Input
              id="file-name"
              name="name"
              placeholder="Homepage-v3.fig"
              required
              aria-invalid={Boolean(state?.errors?.name)}
              aria-describedby="file-name-hint"
            />
            <p id="file-name-hint" className="text-xs text-muted-foreground">
              Include the extension — it sets the file&apos;s type badge.
            </p>
            <FieldError messages={state?.errors?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file-url">Link</Label>
            <Input
              id="file-url"
              name="url"
              type="url"
              inputMode="url"
              placeholder="https://figma.com/file/…"
              required
              aria-invalid={Boolean(state?.errors?.url)}
            />
            <FieldError messages={state?.errors?.url} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file-version">Version</Label>
            <Input
              id="file-version"
              name="version"
              type="number"
              min={1}
              max={999}
              step={1}
              defaultValue={1}
              className="w-28"
              aria-invalid={Boolean(state?.errors?.version)}
            />
            <FieldError messages={state?.errors?.version} />
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-border bg-card/60 p-3">
            <input
              type="checkbox"
              name="sharedWithClient"
              defaultChecked
              className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring outline-none"
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">
                Share with the client
              </span>
              <span className="block text-xs text-muted-foreground">
                Unshared files stay agency-only and never reach the
                client&apos;s view of this project.
              </span>
            </span>
          </label>

          {state?.message && !state.ok ? (
            <FormMessage>{state.message}</FormMessage>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton pendingLabel="Adding…">
              <PaperclipIcon />
              Add file
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
