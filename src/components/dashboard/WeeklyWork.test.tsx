import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import WeeklyWork from './WeeklyWork'
vi.mock('@/lib/product-events', () => ({ trackProductEvent: vi.fn() }))

describe('weekly dashboard', () => {
  afterEach(cleanup)
  it('offers a first task instead of a misleading empty success state', () => {
    const onAdd = vi.fn()
    render(
      <WeeklyWork activities={[]} loading={false} error={null} onRetry={vi.fn()} onAdd={onAdd} />
    )
    expect(screen.getByText('Χώρος για την επόμενη επίσκεψη')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Προγραμματισμός εργασίας' }))
    expect(onAdd).toHaveBeenCalledOnce()
  })
  it('does not present missing data as zero tasks when loading fails', () => {
    const retry = vi.fn()
    render(
      <WeeklyWork
        activities={[]}
        loading={false}
        error="Δεν φορτώθηκαν οι εργασίες"
        onRetry={retry}
        onAdd={vi.fn()}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Δεν φορτώθηκαν οι εργασίες')
    expect(screen.queryByText('Χώρος για την επόμενη επίσκεψη')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Δοκιμάστε ξανά' }))
    expect(retry).toHaveBeenCalledOnce()
  })
  it('links scheduled tasks to the activities tab', () => {
    render(
      <WeeklyWork
        activities={[
          {
            id: 'task',
            title: 'Έλεγχος δικτύου',
            date: new Date(),
            completed: false,
            farmId: 'grove',
            farmName: 'Νότιος',
          },
        ]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        onAdd={vi.fn()}
      />
    )
    expect(screen.getByRole('link', { name: /Έλεγχος δικτύου/ })).toHaveAttribute(
      'href',
      '/dashboard/farms/grove?tab=activities'
    )
  })
})
