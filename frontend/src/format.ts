const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const full = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

export const fmtMonth = (d: string | null | undefined) => (d ? monthYear.format(new Date(d)) : '')
export const fmtRange = (start: string | null | undefined, end: string | null | undefined) =>
  start ? `${fmtMonth(start)} – ${end ? fmtMonth(end) : 'Present'}` : fmtMonth(end)
export const fmtDate = (d: string) => full.format(new Date(d))
export const prettyUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
