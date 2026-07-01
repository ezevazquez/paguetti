import { EventPageClient } from '@/components/paguetti/event-page-client'

type PageProps = { params: Promise<{ slug: string }> }

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params
  return <EventPageClient slug={slug} />
}
