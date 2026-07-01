import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getPrisma } from '@/lib/prisma'
import { getAuthUser, ensureProfile } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const events = await getPrisma().event.findMany({
      where: { hostId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { participants: true } },
      },
    })

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        slug: event.slug,
        title: event.title,
        status: event.status,
        participantCount: event._count.participants,
        createdAt: event.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/events failed:', error)
    return NextResponse.json({ error: 'Error al cargar eventos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await ensureProfile(user)

    let title: string | undefined
    try {
      const body = await request.json()
      title = typeof body.title === 'string' ? body.title.trim() || undefined : undefined
    } catch {
      // body optional
    }

    const slug = nanoid(10)

    const event = await getPrisma().event.create({
      data: {
        slug,
        hostId: user.id,
        title,
      },
    })

    return NextResponse.json({
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        status: event.status,
        createdAt: event.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/events failed:', error)
    return NextResponse.json({ error: 'Error al crear el evento' }, { status: 500 })
  }
}
