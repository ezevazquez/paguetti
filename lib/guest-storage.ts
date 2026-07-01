const PREFIX = 'paguetti-guest-'

export type GuestEntry = {
  participantId: string
  token: string
}

export function getGuestEntry(eventId: string): GuestEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${PREFIX}${eventId}`)
    if (!raw) return null
    return JSON.parse(raw) as GuestEntry
  } catch {
    return null
  }
}

export function setGuestEntry(eventId: string, entry: GuestEntry) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${PREFIX}${eventId}`, JSON.stringify(entry))
}

export function clearGuestEntry(eventId: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${PREFIX}${eventId}`)
}
