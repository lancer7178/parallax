import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const SITE_URL = process.env.AUTH_URL ?? 'https://parallax-agency.vercel.app'

const TITLE = 'Parallax — The operating system for your agency'
const DESCRIPTION =
  'Projects, clients, invoices, and revenue — connected in one workspace built for modern agencies.'

export const metadata: Metadata = {
  // Resolves the relative OG/Twitter image paths below to absolute URLs, which
  // social scrapers require.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Parallax',
  },
  description: DESCRIPTION,
  applicationName: 'Parallax',
  openGraph: {
    type: 'website',
    siteName: 'Parallax',
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  // The workspace is private; only the marketing page is worth indexing, and
  // signed-in routes are behind the proxy anyway.
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // The pre-paint theme script below adds `.dark` before hydration, so the
      // class list legitimately differs from the server render.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the stored theme before first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('parallax-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
