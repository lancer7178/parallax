import {
  ExternalLinkIcon,
  EyeOffIcon,
  FileArchiveIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  PaletteIcon,
  Trash2Icon,
  type LucideIcon,
} from 'lucide-react'

import { AddFileDialog } from '@/components/projects/add-file-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteProjectFile } from '@/lib/actions/files'
import { fileExtension, fileHost, fileKind, type FileKind } from '@/lib/files'
import type { ProjectFileRow } from '@/lib/queries'
import { formatDate } from '@/lib/utils'

const KIND_ICON: Record<FileKind, LucideIcon> = {
  design: PaletteIcon,
  document: FileTextIcon,
  image: FileImageIcon,
  sheet: FileSpreadsheetIcon,
  archive: FileArchiveIcon,
  other: FileIcon,
}

/**
 * The project's files.
 *
 * Deliberately a list and not a drive: name, type, who put it there, when, and
 * which version. Everything a project conversation needs to point at the right
 * asset, and nothing that would turn this into storage to administer.
 *
 * Clients only ever receive the shared rows — the filter runs in
 * `lib/queries.ts`, so the "Internal" badge below is a label for the agency,
 * never the thing doing the hiding.
 */
export function ProjectFiles({
  projectId,
  files,
  canManage,
}: {
  projectId: string
  files: ProjectFileRow[]
  canManage: boolean
}) {
  return (
    <Card id="files" className="scroll-mt-20">
      <CardHeader className="flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Files</CardTitle>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? 'Designs, specs and deliverables attached to this project.'
              : 'Files your team has shared with you.'}
          </p>
        </div>
        {canManage ? <AddFileDialog projectId={projectId} /> : null}
      </CardHeader>

      <CardContent className={files.length === 0 ? '' : 'px-0'}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <FileIcon className="size-6 text-muted-foreground" />
            <p className="font-medium">No files yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {canManage
                ? 'Link the designs, specs and deliverables that belong to this project so everyone points at the same asset.'
                : 'Anything the team shares with you will appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {files.map((file) => {
              const Icon = KIND_ICON[fileKind(file.name)]
              const host = fileHost(file.url)

              return (
                <li
                  key={file.id}
                  className="flex items-center gap-3 px-5 py-3 first:-mt-1"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                  >
                    <Icon className="size-4.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <a
                        href={file.url}
                        target="_blank"
                        // `noopener` matters: the linked document is arbitrary
                        // and must not get a handle on this window.
                        rel="noopener noreferrer"
                        className="truncate rounded text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
                      >
                        {file.name}
                      </a>
                      <Badge tone="outline" className="shrink-0">
                        {fileExtension(file.name)}
                      </Badge>
                      {file.version > 1 ? (
                        <Badge tone="info" className="shrink-0">
                          v{file.version}
                        </Badge>
                      ) : null}
                      {!file.sharedWithClient ? (
                        <Badge tone="neutral" className="shrink-0">
                          <EyeOffIcon className="size-3" />
                          Internal
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {file.uploadedBy ? `${file.uploadedBy.name} · ` : ''}
                      {formatDate(file.createdAt)}
                      {host ? ` · ${host}` : ''}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    asChild
                    className="shrink-0"
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkIcon />
                      <span className="sr-only">Open {file.name}</span>
                    </a>
                  </Button>

                  {canManage ? (
                    <form action={deleteProjectFile} className="shrink-0">
                      <input type="hidden" name="id" value={file.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon />
                        <span className="sr-only">Remove {file.name}</span>
                      </Button>
                    </form>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
