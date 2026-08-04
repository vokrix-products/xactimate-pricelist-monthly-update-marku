import { ListTodo, TriangleAlert, Briefcase, type LucideIcon } from 'lucide-react'

// PRODUCT_CUSTOMIZE: set archetype to match this product's UI pattern.
// 'extraction' — upload + tasks table (default, ~24 products)
// 'monitor'    — no upload, schedule-driven; tasks table shows exceptions
// 'report'     — upload + single report card per run, no tasks table
// 'dispatch'   — no upload, create-driven; tasks table shows active jobs
export const PRODUCT_ARCHETYPE = ((import.meta.env.VITE_PRODUCT_ARCHETYPE as string) ?? 'extraction') as 'extraction' | 'monitor' | 'report' | 'dispatch'


// PRODUCT_CUSTOMIZE: set these per product.
export const RECORDS_LABEL = (import.meta.env.VITE_RECORDS_LABEL as string) ?? 'Records'           // sidebar + page heading: 'Contracts', 'Claims', 'Invoices'
export const RECORDS_SUBTITLE = (import.meta.env.VITE_RECORDS_SUBTITLE as string) ?? 'All processed records'  // page subtitle
export const FILTER_PLACEHOLDER = (import.meta.env.VITE_FILTER_PLACEHOLDER as string) ?? 'Search...'  // search box placeholder
export const SHOW_CREATE_BUTTON = false           // true only for dispatch archetype
export const SHOW_IMPORT_BUTTON = false           // true only if CSV import is relevant

// Derived automatically — do not edit below this line
const ARCHETYPE_CONFIG: Record<
  typeof PRODUCT_ARCHETYPE,
  { tasksLabel: string; tasksIcon: LucideIcon; showTasks: boolean }
> = {
  extraction: { tasksLabel: RECORDS_LABEL,    tasksIcon: ListTodo,       showTasks: true  },
  monitor:    { tasksLabel: RECORDS_LABEL, tasksIcon: TriangleAlert,  showTasks: true  },
  report:     { tasksLabel: RECORDS_LABEL,    tasksIcon: ListTodo,       showTasks: false },
  dispatch:   { tasksLabel: RECORDS_LABEL,       tasksIcon: Briefcase,      showTasks: true  },
}

export const { tasksLabel: TASKS_NAV_LABEL, tasksIcon: TASKS_NAV_ICON, showTasks: SHOW_TASKS_NAV } =
  ARCHETYPE_CONFIG[PRODUCT_ARCHETYPE]
