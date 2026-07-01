import { createHash, randomBytes } from 'node:crypto'

export function generateGuestToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashGuestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function verifyGuestToken(token: string, hash: string | null | undefined): boolean {
  if (!hash) return false
  return hashGuestToken(token) === hash
}
