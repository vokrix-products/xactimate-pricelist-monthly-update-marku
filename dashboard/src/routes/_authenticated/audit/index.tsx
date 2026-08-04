import { createFileRoute } from '@tanstack/react-router'
import { AuditLog } from '@/features/audit'

export const Route = createFileRoute('/_authenticated/audit/')({
  component: AuditLog,
})
