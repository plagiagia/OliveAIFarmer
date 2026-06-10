import { describe, expect, it } from 'vitest'
import { buildLogbookHtml, logbookYears } from './logbook'

const farm = {
  name: 'Ελαιώνας Μεσσηνίας',
  location: 'Καλαμάτα',
  totalArea: 12.5,
  treeCount: 320,
  oliveVariety: 'Κορωνέικη',
  user: { firstName: 'Γιώργος', lastName: 'Παπαδόπουλος' },
}

const activities = [
  {
    type: 'FERTILIZING',
    title: 'Βασική λίπανση',
    date: '2026-03-10',
    cost: 180,
    duration: 120,
    notes: '11-15-15',
    completed: true,
  },
  {
    type: 'PEST_CONTROL',
    title: 'Ψεκασμός δάκου',
    date: '2025-07-02',
    cost: 95,
    completed: true,
  },
]

const harvests = [
  {
    year: 2026,
    startDate: '2026-11-05',
    collectionDate: '2026-11-12',
    totalYield: 2400,
    pricePerKg: 0.85,
    totalValue: 2040,
  },
]

describe('logbookYears', () => {
  it('collects distinct years from activities and harvests, newest first', () => {
    expect(logbookYears(activities, harvests)).toEqual([2026, 2025])
  })
})

describe('buildLogbookHtml', () => {
  it('includes holder, parcel details and only the selected year rows', () => {
    const html = buildLogbookHtml(farm, activities, harvests, 2026)
    expect(html).toContain('Καλλιεργητική Περίοδος 2026')
    expect(html).toContain('Γιώργος Παπαδόπουλος')
    expect(html).toContain('Βασική λίπανση')
    expect(html).not.toContain('Ψεκασμός δάκου') // 2025 activity excluded
    expect(html).toContain('2.400 kg')
  })

  it('escapes user-entered HTML', () => {
    const html = buildLogbookHtml(
      farm,
      [{ ...activities[0], title: '<script>alert(1)</script>' }],
      [],
      2026
    )
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renders empty-state rows when the year has no records', () => {
    const html = buildLogbookHtml(farm, [], [], 2024)
    expect(html).toContain('Δεν υπάρχουν καταγεγραμμένες εργασίες')
    expect(html).toContain('Δεν υπάρχουν καταγεγραμμένες συγκομιδές')
  })
})
