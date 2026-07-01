import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helpers'
import { toParticipantDto } from '@/lib/events-mapper'
import { canEditParticipant } from '@/lib/api/event-auth'

type RouteContext = { params: Promise<{ slug: string; id: string }> }

function getGuestToken(request: Request): string | null {
  return request.headers.get('x-guest-token')
}

export async function PATCH(request: Request, context: RouteContext) {
  const { slug, id } = await context.params
  const user = await getAuthUser()
  const guestToken = getGuestToken(request)

  const event = await getPrisma().event.findUnique({ where: { slug } })
  if (!event) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  const participant = await getPrisma().participant.findFirst({
    where: { id, eventId: event.id },
  })

  if (!participant) {
    return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 })
  }

  if (!canEditParticipant(event, participant, user?.id ?? null, guestToken)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: {
    name?: string
    alias?: string
    amount?: number
    didNotPay?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const name = body.name?.trim() ?? participant.name
  if (!name) {
    return NextResponse.json({ error: 'Sumá un nombre.' }, { status: 400 })
  }

  const didNotPay = body.didNotPay ?? participant.didNotPay
  const amount = didNotPay ? 0 : (body.amount ?? participant.amount)

  if (!didNotPay && amount <= 0) {
    return NextResponse.json({ error: 'El monto tiene que ser mayor a $0.' }, { status: 400 })
  }

  const updated = await getPrisma().participant.update({
    where: { id },
    data: {
      name,
      alias: didNotPay ? '' : (body.alias?.trim() ?? participant.alias),
      amount,
      didNotPay,
    },
  })

  if (event.status === 'calculated') {
    await getPrisma().event.update({
      where: { id: event.id },
      data: { status: 'collecting' },
    })
  }

  return NextResponse.json({ participant: toParticipantDto(updated) })
}

export async function DELETE(request: Request, context: RouteContext) {
  const { slug, id } = await context.params
  const user = await getAuthUser()
  const guestToken = getGuestToken(request)

  const event = await getPrisma().event.findUnique({ where: { slug } })
  if (!event) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  const participant = await getPrisma().participant.findFirst({
    where: { id, eventId: event.id },
  })

  if (!participant) {
    return NextResponse.json({ error: 'Participante no encontrado' }, { status: 404 })
  }

  if (!canEditParticipant(event, participant, user?.id ?? null, guestToken)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await getPrisma().participant.delete({ where: { id } })

  if (event.status === 'calculated') {
    await getPrisma().event.update({
      where: { id: event.id },
      data: { status: 'collecting' },
    })
  }

  return NextResponse.json({ ok: true })
}
