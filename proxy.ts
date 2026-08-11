import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16 renamed `middleware` to `proxy`. It runs on the Node.js runtime
// and cannot be configured to use the edge runtime.
//
// This is an *optimistic* check only: it looks for the presence of the Auth.js
// session cookie so unauthenticated visitors are bounced before a page renders.
// The cookie is never trusted for authorization — `lib/dal.ts` verifies the
// signed session next to the data on every page and Server Action.

// Reachable without a session. `/` and `/ar` are the two language versions of
// the marketing page, which renders for signed-in and signed-out visitors
// alike — it just swaps its call to action.
const PUBLIC_PATHS = ['/', '/ar', '/login']

function hasSessionCookie(request: NextRequest) {
  return (
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token')
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.includes(pathname)
  const signedIn = hasSessionCookie(request)

  if (!signedIn && !isPublic) {
    const login = new URL('/login', request.nextUrl)
    // Preserve where the user was heading so login can send them back.
    login.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(login)
  }

  // Only the sign-in form is pointless once signed in; `/` is not.
  if (signedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  // Skip Next internals, the Auth.js endpoints, and static assets — including
  // ones the image optimizer fetches internally, which carry no session cookie.
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
