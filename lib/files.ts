/**
 * Project files are stored as references, not blobs (see `ProjectFile` in
 * `prisma/schema.prisma`), so everything a viewer reads about the *kind* of a
 * file is derived from its name. Deriving it rather than storing it means a
 * renamed file can never disagree with its own badge.
 */

/** Groups that get their own icon and colour. Deliberately few. */
export type FileKind = 'design' | 'document' | 'image' | 'sheet' | 'archive' | 'other'

const KIND_BY_EXTENSION: Record<string, FileKind> = {
  fig: 'design',
  sketch: 'design',
  xd: 'design',
  psd: 'design',
  ai: 'design',
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  txt: 'document',
  md: 'document',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  mp4: 'image',
  mov: 'image',
  csv: 'sheet',
  xls: 'sheet',
  xlsx: 'sheet',
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
}

/** The extension, uppercased, for the badge. `LINK` when there isn't one. */
export function fileExtension(name: string) {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name.trim())
  return match ? match[1]!.toUpperCase() : 'LINK'
}

export function fileKind(name: string): FileKind {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name.trim())
  if (!match) return 'other'
  return KIND_BY_EXTENSION[match[1]!.toLowerCase()] ?? 'other'
}

/**
 * Where a linked file actually lives, for the row's second line — "figma.com"
 * says more about a link than the first 40 characters of its URL do.
 */
export function fileHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}
