import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { getAuthUser, ensureProfile } from '@/lib/auth-helpers'
import { generateGuestToken, hashGuestToken } from '@/lib/guest-token'
import { toParticipantDto } from '@/lib/events-mapper'
import { isHost } from '@/lib/api/event-auth'

type RouteContext = { params: Promise<{ slug: string }> }

type ParticipantBody = {
  name?: string
  alias?: string
  amount?: number
  didNotPay?: boolean
  asHost?: boolean
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params
  const user = await getAuthUser()

  const event = await getPrisma().event.findUnique({ where: { slug } })
  if (!event) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  if (event.status === 'closed') {
    return NextResponse.json({ error: 'Este evento está cerrado' }, { status: 403 })
  }

  let body: ParticipantBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Sumá un nombre.' }, { status: 400 })
  }

  const asHost = body.asHost === true
  const didNotPay = body.didNotPay === true

  if (asHost) {
    if (!isHost(event, user?.id ?? null)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  } else {
    if (event.status === 'calculated') {
      return NextResponse.json({ error: 'El evento ya fue calculado' }, { status: 403 })
    }
  }

  if (!didNotPay) {
    const amount = body.amount ?? 0
    if (amount <= 0) {
      return NextResponse.json({ error: 'El monto tiene que ser mayor a $0.' }, { status: 400 })
    }
  }

  let guestToken: string | undefined
  let guestTokenHash: string | undefined
  let profileId: string | undefined

  if (asHost) {
    // host-added entries don't need guest token
  } else {
    guestToken = generateGuestToken()
    guestTokenHash = hashGuestToken(guestToken)
    if (user) {
      await ensureProfile(user)
      profileId = user.id
    }
  }

  const participant = await getPrisma().participant.create({
    data: {
      eventId: event.id,
      name,
      alias: didNotPay ? '' : (body.alias?.trim() ?? ''),
      amount: didNotPay ? 0 : (body.amount ?? 0),
      didNotPay,
      addedBy: asHost ? 'host' : 'self',
      guestTokenHash,
      profileId,
    },
  })

  if (event.status === 'calculated') {
    await getPrisma().event.update({
      where: { id: event.id },
      data: { status: 'collecting' },
    })
  }

  return NextResponse.json({
    participant: toParticipantDto(participant),
    guestToken,
  })
}
