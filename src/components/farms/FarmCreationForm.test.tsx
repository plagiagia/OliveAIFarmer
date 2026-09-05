import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/components/map/MapboxMap', () => ({ default: () => null }))
vi.mock('@/components/map/LocationAutocomplete', () => ({
  default: ({
    id,
    value,
    onChange,
  }: {
    id: string
    value: string
    onChange: (value: string) => void
  }) => <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />,
}))
vi.mock('@/lib/meta-pixel', () => ({ trackFirstGroveCreated: vi.fn() }))
vi.mock('@/lib/product-events', () => ({ trackProductEvent: vi.fn() }))
import FarmCreationForm from './FarmCreationForm'

describe('quick grove setup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })
  it('creates a grove with only name and location and opens its first-result page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        json: async () => ({ success: true, isFirstFarm: true, farm: { id: 'grove-new' } }),
      })
    vi.stubGlobal('fetch', fetch)
    render(<FarmCreationForm userId="owner" />)
    fireEvent.change(screen.getByLabelText('Όνομα Ελαιώνα *'), {
      target: { value: 'Νότιος ελαιώνας' },
    })
    fireEvent.change(screen.getByLabelText('Τοποθεσία *'), { target: { value: 'Καλαμάτα' } })
    fireEvent.click(screen.getByRole('button', { name: 'Δείτε τον ελαιώνα σας' }))
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith('/dashboard/farms/grove-new?welcome=true')
    )
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      treeCount: null,
      totalArea: null,
      name: 'Νότιος ελαιώνας',
    })
  })
})
