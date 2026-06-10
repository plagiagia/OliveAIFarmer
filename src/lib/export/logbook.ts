/**
 * Ημερολόγιο Αγρού (field logbook) PDF export.
 *
 * Generates a print-ready HTML document and opens the browser print
 * dialog, where the user saves it as PDF. This keeps Greek text rendering
 * correct without bundling fonts, and works offline.
 *
 * The layout follows what ΟΣΔΕ/ΟΠΕΚΕΠΕ inspections and accountants expect
 * from a field logbook: holder & parcel details, dated operations with
 * costs, harvest deliveries, and totals with a signature line.
 */

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  WATERING: 'Πότισμα',
  PRUNING: 'Κλάδεμα',
  FERTILIZING: 'Λίπανση',
  PEST_CONTROL: 'Φυτοπροστασία',
  SOIL_WORK: 'Εργασίες εδάφους',
  HARVESTING: 'Συγκομιδή',
  MAINTENANCE: 'Συντήρηση',
  INSPECTION: 'Επιθεώρηση',
  OTHER: 'Άλλο',
}

export interface LogbookFarm {
  name: string
  location: string
  totalArea?: number | null
  treeCount?: number | null
  oliveVariety?: string | null
  user?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}

export interface LogbookActivity {
  type: string
  title: string
  description?: string | null
  date: string | Date
  duration?: number | null
  cost?: number | null
  notes?: string | null
  completed: boolean
}

export interface LogbookHarvest {
  year: number
  collectionDate?: string | Date | null
  startDate: string | Date
  totalYield?: number | null
  pricePerKg?: number | null
  totalValue?: number | null
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('el-GR')
}

function fmtEur(value: number): string {
  return `${value.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

/** Years that have at least one activity or harvest, newest first. */
export function logbookYears(
  activities: LogbookActivity[],
  harvests: LogbookHarvest[]
): number[] {
  const years = new Set<number>()
  activities.forEach((a) => years.add(new Date(a.date).getFullYear()))
  harvests.forEach((h) => years.add(h.year))
  return [...years].sort((a, b) => b - a)
}

export function buildLogbookHtml(
  farm: LogbookFarm,
  activities: LogbookActivity[],
  harvests: LogbookHarvest[],
  year: number
): string {
  const yearActivities = activities
    .filter((a) => new Date(a.date).getFullYear() === year)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const yearHarvests = harvests
    .filter((h) => h.year === year)
    .sort(
      (a, b) =>
        new Date(a.collectionDate ?? a.startDate).getTime() -
        new Date(b.collectionDate ?? b.startDate).getTime()
    )

  const totalCost = yearActivities.reduce((sum, a) => sum + (a.cost || 0), 0)
  const totalYield = yearHarvests.reduce((sum, h) => sum + (h.totalYield || 0), 0)
  const totalValue = yearHarvests.reduce((sum, h) => sum + (h.totalValue || 0), 0)

  const holder = [farm.user?.firstName, farm.user?.lastName].filter(Boolean).join(' ') || '—'

  const activityRows = yearActivities.length
    ? yearActivities
        .map(
          (a) => `
        <tr>
          <td>${esc(fmtDate(a.date))}</td>
          <td>${esc(ACTIVITY_TYPE_LABELS[a.type] || a.type)}</td>
          <td>${esc(a.title)}${a.description ? `<div class="muted">${esc(a.description)}</div>` : ''}</td>
          <td class="num">${a.duration ? `${esc(a.duration)}΄` : ''}</td>
          <td class="num">${a.cost ? esc(fmtEur(a.cost)) : ''}</td>
          <td>${esc(a.notes ?? '')}</td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="6" class="empty">Δεν υπάρχουν καταγεγραμμένες εργασίες για το έτος.</td></tr>'

  const harvestRows = yearHarvests.length
    ? yearHarvests
        .map(
          (h) => `
        <tr>
          <td>${esc(fmtDate(h.collectionDate ?? h.startDate))}</td>
          <td class="num">${h.totalYield ? `${h.totalYield.toLocaleString('el-GR')} kg` : ''}</td>
          <td class="num">${h.pricePerKg ? esc(fmtEur(h.pricePerKg)) : ''}</td>
          <td class="num">${h.totalValue ? esc(fmtEur(h.totalValue)) : ''}</td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="empty">Δεν υπάρχουν καταγεγραμμένες συγκομιδές για το έτος.</td></tr>'

  return `<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="utf-8">
<title>Ημερολόγιο Αγρού ${year} — ${esc(farm.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; margin: 24px; font-size: 12px; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  h2 { font-size: 14px; margin: 24px 0 8px; border-bottom: 2px solid #2E7D32; padding-bottom: 4px; }
  .subtitle { color: #555; margin: 0 0 16px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; border: 1px solid #ccc; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
  .meta div { padding: 2px 0; }
  .meta b { display: inline-block; min-width: 130px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #bbb; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #eef4ee; font-weight: 600; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.empty { text-align: center; color: #777; padding: 14px; }
  .muted { color: #666; font-size: 11px; margin-top: 2px; }
  .totals { margin-top: 10px; display: flex; gap: 24px; justify-content: flex-end; font-weight: 600; }
  .sign { margin-top: 48px; display: flex; justify-content: space-between; gap: 40px; }
  .sign div { flex: 1; border-top: 1px solid #333; padding-top: 6px; text-align: center; color: #444; }
  .footer { margin-top: 32px; color: #888; font-size: 10px; text-align: center; }
  @media print { body { margin: 10mm; } .no-print { display: none; } }
</style>
</head>
<body>
  <h1>Ημερολόγιο Αγρού — Καλλιεργητική Περίοδος ${year}</h1>
  <p class="subtitle">Καλλιέργεια: Ελιά${farm.oliveVariety ? ` (${esc(farm.oliveVariety)})` : ''}</p>

  <div class="meta">
    <div><b>Κάτοχος εκμετάλλευσης:</b> ${esc(holder)}</div>
    <div><b>Αγροτεμάχιο:</b> ${esc(farm.name)}</div>
    <div><b>Τοποθεσία:</b> ${esc(farm.location)}</div>
    <div><b>Έκταση:</b> ${farm.totalArea ? `${esc(farm.totalArea)} στρέμματα` : '—'}</div>
    <div><b>Αριθμός δέντρων:</b> ${farm.treeCount ? esc(farm.treeCount.toLocaleString('el-GR')) : '—'}</div>
    <div><b>Ημερομηνία εκτύπωσης:</b> ${esc(new Date().toLocaleDateString('el-GR'))}</div>
  </div>

  <h2>Α. Καλλιεργητικές Εργασίες</h2>
  <table>
    <thead>
      <tr>
        <th style="width:74px">Ημερομηνία</th>
        <th style="width:95px">Εργασία</th>
        <th>Περιγραφή</th>
        <th class="num" style="width:60px">Διάρκεια</th>
        <th class="num" style="width:80px">Κόστος</th>
        <th style="width:140px">Παρατηρήσεις</th>
      </tr>
    </thead>
    <tbody>${activityRows}</tbody>
  </table>
  <div class="totals"><span>Συνολικό κόστος εργασιών: ${esc(fmtEur(totalCost))}</span></div>

  <h2>Β. Συγκομιδή &amp; Παραδόσεις</h2>
  <table>
    <thead>
      <tr>
        <th style="width:90px">Ημερομηνία</th>
        <th class="num">Ποσότητα</th>
        <th class="num" style="width:90px">Τιμή/kg</th>
        <th class="num" style="width:110px">Αξία</th>
      </tr>
    </thead>
    <tbody>${harvestRows}</tbody>
  </table>
  <div class="totals">
    <span>Συνολική παραγωγή: ${totalYield.toLocaleString('el-GR')} kg</span>
    <span>Συνολική αξία: ${esc(fmtEur(totalValue))}</span>
  </div>

  <div class="sign">
    <div>Ο/Η δηλών/ούσα</div>
    <div>Ημερομηνία &amp; υπογραφή</div>
  </div>

  <div class="footer">Δημιουργήθηκε με το OliveIQ — oliveiq.gr · Τα στοιχεία προέρχονται από τις καταγραφές του χρήστη.</div>
</body>
</html>`
}

/**
 * Open the logbook in a new window and trigger the print dialog
 * (the user selects "Save as PDF").
 */
export function printFieldLogbook(
  farm: LogbookFarm,
  activities: LogbookActivity[],
  harvests: LogbookHarvest[],
  year: number
): boolean {
  const html = buildLogbookHtml(farm, activities, harvests, year)
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  // Give the new window a tick to render before printing.
  setTimeout(() => {
    win.print()
  }, 250)
  return true
}
