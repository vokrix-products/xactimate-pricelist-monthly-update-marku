import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { supabase } from '@/lib/supabase'
import { statuses, severityToBadgeVariant } from '../data/data'
import { type Task } from '../data/schema'
import { useUpsertTask } from '../data/tasks'

type TaskMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  status: z.string().min(1, 'Please select a status.'),
})
type TaskForm = z.infer<typeof formSchema>

async function openSourceFile(path: string) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUrl(path, 60 * 60)
  if (error || !data?.signedUrl) return
  window.open(data.signedUrl, '_blank')
}

function formatDueDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  const diffDays = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const label = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (diffDays < 0) return `${label} (overdue)`
  if (diffDays <= 30) return `${label} (${diffDays}d)`
  return label
}

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow
  const upsertTask = useUpsertTask()

  const form = useForm<TaskForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow
      ? { title: currentRow.title, status: currentRow.status }
      : { title: '', status: '' },
  })

  const onSubmit = (data: TaskForm) => {
    const payload = isUpdate
      ? {
          ...data,
          id: currentRow!.id,
          label: currentRow!.label,
          priority: currentRow!.priority,
        }
      : data

    toast.promise(upsertTask.mutateAsync(payload), {
      loading: isUpdate ? 'Updating...' : 'Creating...',
      success: () => {
        onOpenChange(false)
        form.reset()
        return isUpdate ? 'Saved' : 'Created'
      },
      error: 'Error saving',
    })
  }

  const statusDef = currentRow
    ? statuses.find((s) => s.value === currentRow.status)
    : null
  const severity = statusDef?.severity ?? 'neutral'
  const badgeVariant = severityToBadgeVariant[severity]

  const details = currentRow?.details
  const detailEntries = details
    ? Object.entries(details).filter(([, v]) => v !== null && v !== '')
    : []

  const dueFormatted = formatDueDate(currentRow?.due_date)
  const isOverdue = dueFormatted?.includes('overdue') ?? false
  const isSoon =
    !isOverdue && !!dueFormatted?.includes('d)') &&
    parseInt(dueFormatted.split('(')[1] ?? '999') <= 30

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? currentRow!.title : 'New Record'}</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Extracted data and current status. Edit below if needed.'
              : 'Add a new record by providing the info below.'}
          </SheetDescription>
        </SheetHeader>

        {/* ── Extracted data panel (view only, shown when editing) ── */}
        {isUpdate && (
          <div className='px-4 space-y-3'>
            <div className='flex items-center gap-2 flex-wrap'>
              <Badge variant={badgeVariant}>
                {statusDef?.label ?? currentRow!.status}
              </Badge>
              {dueFormatted && (
                <span
                  className={
                    isOverdue
                      ? 'text-xs text-destructive font-medium'
                      : isSoon
                        ? 'text-xs text-warning font-medium'
                        : 'text-xs text-muted-foreground'
                  }
                >
                  {dueFormatted}
                </span>
              )}
              {currentRow!.source_file_path && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-6 px-2 text-xs'
                  onClick={() => openSourceFile(currentRow!.source_file_path!)}
                >
                  <ExternalLink className='size-3 mr-1' />
                  View source
                </Button>
              )}
            </div>

            {detailEntries.length > 0 && (
              <div className='rounded-md border bg-muted/40 px-3 py-2 space-y-1'>
                {detailEntries.map(([key, value]) => (
                  <div key={key} className='flex gap-2 text-xs'>
                    <span className='text-muted-foreground capitalize min-w-28 shrink-0'>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className='font-medium break-all'>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Separator />
          </div>
        )}

        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Enter a name' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select status'
                    items={statuses.map((s) => ({
                      label: s.label,
                      value: s.value,
                    }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button form='tasks-form' type='submit'>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
