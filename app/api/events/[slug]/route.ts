import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helpers'
import { toParticipantDto } from '@/lib/events-mapper'
import { isHost } from '@/lib/api/event-auth'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  const user = await getAuthUser()

  const event = await getPrisma().event.findUnique({
    where: { slug },
    include: {
      participants: { orderBy: { createdAt: 'asc' } },
      host: { select: { id: true, name: true } },
    },
  })

  if (!event) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  const host = isHost(event, user?.id ?? null)

  return NextResponse.json({
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      status: event.status,
      hostId: event.hostId,
      hostName: event.host.name,
      createdAt: event.createdAt.toISOString(),
      isHost: host,
    },
    participants: event.participants.map(toParticipantDto),
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await context.params
  const user = await getAuthUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const event = await getPrisma().event.findUnique({ where: { slug } })
  if (!event) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  if (!isHost(event, user.id)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: { title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const title =
    typeof body.title === 'string' ? body.title.trim().slice(0, 80) || null : event.title

  const updated = await getPrisma().event.update({
    where: { id: event.id },
    data: { title },
  })

  return NextResponse.json({
    event: {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      status: updated.status,
      hostId: updated.hostId,
      createdAt: updated.createdAt.toISOString(),
      isHost: true,
    },
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  const user = await getAuthUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const event = await getPrisma().event.findUnique({ where: { slug } })
  if (!event) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  if (!isHost(event, user.id)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await getPrisma().event.delete({ where: { id: event.id } })

  return NextResponse.json({ ok: true })
}
