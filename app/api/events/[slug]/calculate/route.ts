import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helpers'
import { isHost } from '@/lib/api/event-auth'
import { calculateTransfers } from '@/lib/paguetti'
import { participantsToPeople } from '@/lib/events-mapper'

type RouteContext = { params: Promise<{ slug: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  const user = await getAuthUser()

  const event = await getPrisma().event.findUnique({
    where: { slug },
    include: { participants: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  }

  if (!isHost(event, user?.id ?? null)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (event.participants.length < 2) {
    return NextResponse.json(
      { error: 'Se necesitan al menos 2 personas para calcular.' },
      { status: 400 }
    )
  }

  await getPrisma().event.update({
    where: { id: event.id },
    data: { status: 'calculated' },
  })

  const result = calculateTransfers(participantsToPeople(event.participants))

  return NextResponse.json({ result })
}
