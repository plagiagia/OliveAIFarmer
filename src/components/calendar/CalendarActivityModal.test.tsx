import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import CalendarActivityModal from './CalendarActivityModal'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
const props = { isOpen: true, onClose: vi.fn(), onSuccess: vi.fn(), selectedDate: new Date('2026-09-05T12:00:00Z'), farms: [{ id: 'farm', name: 'Ελαιώνας', location: 'Μεσσηνία', coordinates: null, treeCount: 100 }] }
describe('calendar suggestion availability', () => {
  it('shows failed requests as unavailable advice, never a positive assessment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Προσωρινή αποτυχία' }) }))
    render(<CalendarActivityModal {...props} />)
    expect(await screen.findByRole('status')).toHaveTextContent('δεν υπάρχει διαθέσιμη εκτίμηση')
    expect(screen.queryByText('Όλα δείχνουν καλά για αυτή τη δραστηριότητα!')).not.toBeInTheDocument()
  })
  it('does not treat an empty result as proof of suitable field conditions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ suggestions: [] }) }))
    render(<CalendarActivityModal {...props} />)
    expect(await screen.findByText(/Δεν προέκυψε ειδική υπόδειξη/)).toBeInTheDocument()
    expect(screen.queryByText('Όλα δείχνουν καλά για αυτή τη δραστηριότητα!')).not.toBeInTheDocument()
  })
})
