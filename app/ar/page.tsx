import type { Metadata } from 'next'
import { Noto_Sans_Arabic } from 'next/font/google'

import { Landing } from '@/components/marketing/landing'
import { getDictionary, LOCALE_PATH } from '@/lib/i18n'

/**
 * Geist has no Arabic glyphs, so without this every letter would fall back to
 * whatever the OS happens to pick — a different face per visitor, and usually
 * a poor one. Declared here rather than in the root layout so the workspace
 * and the English page never download it.
 */
const arabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
})

const t = getDictionary('ar')

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: LOCALE_PATH.ar,
    languages: {
      en: LOCALE_PATH.en,
      ar: LOCALE_PATH.ar,
      'x-default': LOCALE_PATH.en,
    },
  },
  openGraph: {
    locale: 'ar_AR',
    alternateLocale: ['en_US'],
    title: t.meta.title,
    description: t.meta.description,
    url: LOCALE_PATH.ar,
  },
}

export default function ArabicLandingPage() {
  // The font class sits on the page wrapper, and everything inside inherits
  // it: `font-sans` lives on <body>, an ancestor, so this wins for the
  // subtree. The `font-mono` invoice references stay monospace.
  return <Landing locale="ar" className={arabic.className} />
}
