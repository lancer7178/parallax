import type { Metadata } from 'next'
import { LayersIcon } from 'lucide-react'

import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage(props: PageProps<'/login'>) {
  const { callbackUrl } = await props.searchParams
  const target = typeof callbackUrl === 'string' ? callbackUrl : undefined

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <LayersIcon className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Parallax</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your agency workspace.
          </p>
        </div>

        <LoginForm callbackUrl={target} />

        <div className="rounded-lg border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Demo accounts</p>
          <ul className="space-y-1">
            <li>
              <code className="font-mono">admin@parallax.agency</code> — Admin
            </li>
            <li>
              <code className="font-mono">omar@parallax.agency</code> — Developer
            </li>
            <li>
              <code className="font-mono">yara@parallax.agency</code> — Designer
            </li>
            <li>
              <code className="font-mono">ops@helios-retail.com</code> — Client
            </li>
          </ul>
          <p className="mt-2">
            Password: <code className="font-mono">Parallax!2026</code>
          </p>
        </div>
      </div>
    </main>
  )
}
