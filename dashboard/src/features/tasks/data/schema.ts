import { z } from 'zod'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
  // Structured extracted fields (e.g. expiration date, policy number,
  // coverage type). Keys are product-specific — set by the backend poller.
  details: z.record(z.string(), z.unknown()).nullable().optional(),
  // Path in the 'uploads' bucket to the original document this record
  // came from, for verifying extraction against the source.
  source_file_path: z.string().nullable().optional(),
  // Optional deadline/expiration/renewal date, if this product has one.
  due_date: z.string().nullable().optional(),
})

export type Task = z.infer<typeof taskSchema>
