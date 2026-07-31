import type { Role } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: Role
  }

  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }
}

// `next-auth/jwt` only re-exports from `@auth/core/jwt`, so the augmentation
// has to target the module that actually declares `JWT`.
declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}

export {}
