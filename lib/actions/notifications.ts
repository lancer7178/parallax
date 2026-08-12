'use server'

import { requireUser } from '@/lib/dal'
import {
  getAttentionItems,
  listRecentActivity,
  type ActivityRow,
  type AttentionItem,
} from '@/lib/queries'

export type NotificationPayload = {
  /** Things waiting on the caller, most severe first. */
  actions: AttentionItem[]
  /** What happened lately, newest first. Context, not a to-do list. */
  recent: ActivityRow[]
}

/**
 * Fills the top bar's notification panel.
 *
 * Loaded on open rather than with every page, because the panel is the only
 * thing that needs it — the badge beside the bell comes from `countAttention`,
 * which is counts alone. Both sides go through the same role-scoped queries
 * the pages use, so the panel can never surface a row its reader could not
 * open.
 */
export async function fetchNotifications(): Promise<NotificationPayload> {
  const user = await requireUser()

  const [actions, recent] = await Promise.all([
    getAttentionItems(user),
    listRecentActivity(user, 6),
  ])

  return { actions, recent }
}
