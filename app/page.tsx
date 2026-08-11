import type { Metadata } from 'next'

import { Landing } from '@/components/marketing/landing'
import { getDictionary, LOCALE_PATH } from '@/lib/i18n'

const t = getDictionary('en')

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  // `hreflang` pairs the two versions so search engines serve the right one
  // and neither is treated as duplicate content.
  alternates: {
    canonical: LOCALE_PATH.en,
    languages: {
      en: LOCALE_PATH.en,
      ar: LOCALE_PATH.ar,
      'x-default': LOCALE_PATH.en,
    },
  },
  openGraph: {
    locale: 'en_US',
    alternateLocale: ['ar_AR'],
    title: t.meta.title,
    description: t.meta.description,
    url: LOCALE_PATH.en,
  },
}

export default function LandingPage() {
  return <Landing locale="en" />
}
