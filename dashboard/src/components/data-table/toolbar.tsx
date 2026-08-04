import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableFacetedFilter } from './faceted-filter'
import { DataTableViewOptions } from './view-options'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { supabase, PRODUCT_ID } from '@/lib/supabase'
import { Download } from 'lucide-react'

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  searchPlaceholder?: string
  searchKey?: string
  filters?: {
    columnId: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]
}

async function exportToCSV<TData>(table: Table<TData>) {
  const rows = table.getFilteredRowModel().rows
  if (rows.length === 0) return
  const cols = table.getAllColumns().filter(c => c.getIsVisible() && c.id !== 'select' && c.id !== 'actions')
  const headers = cols.map(c => c.id)
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      cols.map(col => {
        const val = row.getValue(col.id)
        const str = val == null ? '' : String(val)
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(',')
    )
  ]
  // Audit log
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) void supabase.from('audit_log').insert({ product_id: PRODUCT_ID, customer_id: user.id, action: 'export.csv', entity: 'records', entity_id: String(rows.length) })
  } catch {}
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Filter...',
  searchKey,
  filters = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || table.getState().globalFilter

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        {searchKey ? (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className='h-8 w-37.5 lg:w-62.5'
          />
        ) : (
          <Input
            placeholder={searchPlaceholder}
            value={table.getState().globalFilter ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className='h-8 w-37.5 lg:w-62.5'
          />
        )}
        <div className='flex gap-x-2'>
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            )
          })}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter('')
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ms-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <ShimmerButton
          shimmerColor='#5e6ad2'
          background='rgba(94,106,210,0.08)'
          className='h-8 px-3 text-xs border border-[#5e6ad2]/30 text-foreground'
          onClick={() => exportToCSV(table)}
        >
          <Download className='mr-1.5 h-3.5 w-3.5' />
          Export CSV
        </ShimmerButton>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
