import { createFileRoute } from '@tanstack/react-router'
import { Tickets } from '@/features/tickets'

export const Route = createFileRoute('/_authenticated/tickets/')({
  component: Tickets,
})
