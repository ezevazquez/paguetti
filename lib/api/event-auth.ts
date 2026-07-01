import type { Event, Participant } from '@prisma/client'
import { verifyGuestToken } from '@/lib/guest-token'

export function isHost(event: Event, userId: string | null | undefined): boolean {
  return !!userId && event.hostId === userId
}

export function canEditParticipant(
  event: Event,
  participant: Participant,
  userId: string | null | undefined,
  guestToken: string | null | undefined
): boolean {
  if (isHost(event, userId)) return true
  if (userId && participant.profileId === userId) return true
  if (guestToken && verifyGuestToken(guestToken, participant.guestTokenHash)) return true
  return false
}
