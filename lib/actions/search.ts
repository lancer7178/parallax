'use server'

import { requireUser } from '@/lib/dal'
import { searchWorkspace, type SearchResult } from '@/lib/queries'

/**
 * Command-palette search. A Server Action rather than a route handler so the
 * session check and the query stay on the same side of the wire — the client
 * sends a string and gets back only rows the caller is allowed to reach.
 */
export async function search(term: string): Promise<SearchResult[]> {
  const user = await requireUser()
  if (typeof term !== 'string') return []
  return searchWorkspace(user, term.slice(0, 100))
}
