import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTasks } from './tasks-provider'
import { SHOW_CREATE_BUTTON, SHOW_IMPORT_BUTTON } from '@/product-config'

export function TasksPrimaryButtons() {
  const { setOpen } = useTasks()
  if (!SHOW_CREATE_BUTTON && !SHOW_IMPORT_BUTTON) return null
  return (
    <div className='flex gap-2'>
      {SHOW_IMPORT_BUTTON && (
        <Button
          variant='outline'
          className='space-x-1'
          onClick={() => setOpen('import')}
        >
          <span>Import</span> <Download size={18} />
        </Button>
      )}
      {SHOW_CREATE_BUTTON && (
        <Button className='space-x-1' onClick={() => setOpen('create')}>
          <span>Create</span> <Plus size={18} />
        </Button>
      )}
    </div>
  )
}
