import type { Participant } from '@prisma/client'
import type { Person } from '@/lib/paguetti'

export function participantToPerson(participant: Participant): Person {
  return {
    id: participant.id,
    name: participant.name,
    alias: participant.alias,
    amount: participant.amount,
    didNotPay: participant.didNotPay || undefined,
  }
}

export function participantsToPeople(participants: Participant[]): Person[] {
  return participants.map(participantToPerson)
}

export type EventParticipantDto = {
  id: string
  name: string
  alias: string
  amount: number
  didNotPay: boolean
  addedBy: 'self' | 'host'
  profileId: string | null
  createdAt: string
}

export function toParticipantDto(participant: Participant): EventParticipantDto {
  return {
    id: participant.id,
    name: participant.name,
    alias: participant.alias,
    amount: participant.amount,
    didNotPay: participant.didNotPay,
    addedBy: participant.addedBy,
    profileId: participant.profileId,
    createdAt: participant.createdAt.toISOString(),
  }
}
