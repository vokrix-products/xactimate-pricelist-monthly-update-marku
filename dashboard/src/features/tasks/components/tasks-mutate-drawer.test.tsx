import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Task } from '../data/schema'
import { TasksMutateDrawer } from './tasks-mutate-drawer'

const mutateAsync = vi.fn(() => Promise.resolve())

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({ createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'http://test' }, error: null }) }),
    },
  },
  PRODUCT_ID: 'test-product',
}))

vi.mock('../data/tasks', () => ({
  useUpsertTask: () => ({ mutateAsync }),
}))

const MOCK_TASK = {
  id: 'task-1',
  title: 'Existing task',
  status: 'in progress',
  label: 'feature',
  priority: 'medium',
} as const satisfies Task

describe('TasksMutateDrawer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders create title and description', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /New Record/i,
    })
    const desc = getByText(/Add a new record/i)

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
  })

  it('renders edit title, description, and prefilled values', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} currentRow={MOCK_TASK} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /Existing task/i,
    })
    const desc = getByText(/Extracted data/i)

    const titleInput = getByRole('textbox', { name: /Title/i })
    const statusSelect = getByRole('combobox', { name: /Status/i })

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
    await expect.element(titleInput).toHaveValue(MOCK_TASK.title)
    await expect
      .element(statusSelect)
      .toHaveTextContent(new RegExp(MOCK_TASK.status, 'i'))
  })

  it('shows validation messages when submitting an empty form', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const saveButton = getByRole('button', { name: /Save changes/i })
    await userEvent.click(saveButton)

    await expect.element(getByText(/Title is required.$/i)).toBeInTheDocument()
    await expect
      .element(getByText(/Please select a status.$/i))
      .toBeInTheDocument()
  })

  it('submits create form and calls upsert mutation', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const titleInput = getByRole('textbox', { name: /Title/i })
    await userEvent.fill(titleInput, 'New task title')

    const statusSelect = getByRole('combobox', { name: /Status/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /Todo/i }))

    const saveButton = getByRole('button', { name: /Save changes/i })
    await userEvent.click(saveButton)

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
    expect(mutateAsync).toHaveBeenCalledWith({
      title: 'New task title',
      status: 'todo',
    })
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it('closes when Close is clicked', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const closeButtons = getByRole('dialog')
      .getByRole('button', {
        name: /Close/i,
      })
      .all()
    expect(closeButtons).toHaveLength(2)
    await userEvent.click(closeButtons[1])

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets entered values when the sheet is closed and reopened', async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type='button' onClick={() => setOpen(true)}>
            Reopen
          </button>
          <TasksMutateDrawer open={open} onOpenChange={setOpen} />
        </>
      )
    }

    const { getByRole } = await render(<Harness />)

    const titleInput = getByRole('textbox', { name: /Title/i })
    await userEvent.fill(titleInput, 'Draft title')
    await expect.element(titleInput).toHaveValue('Draft title')

    const statusSelect = getByRole('combobox', { name: /Status/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /Todo/i }))
    await expect.element(statusSelect).toHaveTextContent(/Todo/i)

    const closeButtons = getByRole('dialog')
      .getByRole('button', {
        name: /Close/i,
      })
      .all()
    await userEvent.click(closeButtons[0])

    const reopenButton = getByRole('button', { name: /Reopen/i })
    await userEvent.click(reopenButton)

    await expect.element(titleInput).toHaveValue('')
    await expect.element(statusSelect).not.toHaveTextContent(/Todo/i)
  })
})
