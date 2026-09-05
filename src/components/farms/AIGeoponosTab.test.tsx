import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AIGeoponosTab from './AIGeoponosTab'

const insight = { id: 'i', title: 'Έλεγχος καρπών', message: 'Καταγράψτε όσα βλέπετε', type: 'TASK_REMINDER', urgency: 'LOW', actionRequired: true, isRead: true, isActioned: false, createdAt: '2026-09-05', source: 'AI_GENERATED', triggerConditions: { evidence: [{ id: 'variety', detail: 'Ποικιλία Κορωνέικη' }], missingData: ['Μετρήσεις παγίδων'], followUpQuestion: 'Τι παρατηρήσατε στους καρπούς;' } }
const fetchMock = vi.fn()
beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); fetchMock.mockResolvedValue({ ok: true, json: async () => ({ insights: [insight] }) }) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
async function open() { fireEvent.click(await screen.findByText(insight.title)) }
describe('AI evidence and observation UI', () => {
  it('shows provenance and missing information instead of a confidence percentage', async () => {
    render(<AIGeoponosTab farmId="farm" />); await open()
    expect(screen.getByText('Ανάλυση AI')).toBeInTheDocument()
    expect(screen.getByText('Ποικιλία Κορωνέικη')).toBeInTheDocument()
    expect(screen.getByText(/Μετρήσεις παγίδων/)).toBeInTheDocument()
  })
  it('does not pretend a failed completion was saved', async () => {
    render(<AIGeoponosTab farmId="farm" />); await open()
    fetchMock.mockResolvedValueOnce({ ok: false })
    fireEvent.click(screen.getByRole('button', { name: 'Ολοκληρώθηκε' }))
    expect(await screen.findByText('Δεν αποθηκεύτηκε η ολοκλήρωση της πρότασης.')).toBeInTheDocument()
    expect(screen.getByText(insight.title)).not.toHaveClass('line-through')
  })
  it('saves a field answer as a completed inspection for the next analysis', async () => {
    render(<AIGeoponosTab farmId="farm" />); await open()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Δεν βρήκα αλλοιώσεις στο δείγμα καρπών.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Αποθήκευση παρατήρησης' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/activities', expect.anything()))
    const body = JSON.parse(fetchMock.mock.calls.find(call => call[0] === '/api/activities')![1].body)
    expect(body).toMatchObject({ farmId: 'farm', type: 'INSPECTION', completed: true })
    expect(body.notes).toContain('Δεν βρήκα αλλοιώσεις')
    expect(await screen.findByRole('status')).toHaveTextContent('Η παρατήρηση αποθηκεύτηκε')
  })
  it('hides every mutation for a read-only farm while keeping evidence accessible', async () => {
    render(<AIGeoponosTab farmId="farm" readOnly />); await open()
    expect(screen.queryByRole('button', { name: /Νέες Προτάσεις|Ολοκληρώθηκε|Διαγραφή|Αποθήκευση/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
