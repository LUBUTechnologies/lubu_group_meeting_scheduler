import { format } from 'date-fns'

/**
 * Generate all 30-minute slots across all dates in the given time range.
 * Returns strings like "2025-01-15 09:00"
 */
export function generateSlots(dates, startTime, endTime) {
  // startTime / endTime may come from DB as "HH:MM:SS" — take only first two parts
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  const slots = []
  for (const date of dates) {
    // Use T12:00:00 to avoid timezone-related off-by-one
    const d = date instanceof Date ? date : new Date(date + 'T12:00:00')
    const dateStr = format(d, 'yyyy-MM-dd')

    let h = startH
    let m = startM

    while (h < endH || (h === endH && m < endM)) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      slots.push(`${dateStr} ${hh}:${mm}`)

      m += 30
      if (m >= 60) {
        m -= 60
        h += 1
      }
    }
  }

  return slots
}

/**
 * Format a slot's time portion: "2025-01-15 09:00" → "9:00 AM"
 */
export function formatSlotTime(slot) {
  const [, timePart] = slot.split(' ')
  const [h, m] = timePart.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Format a slot's date portion: "2025-01-15 09:00" → { weekday: "Wed", month: "Jan", day: "15" }
 */
export function formatSlotDate(slot) {
  const datePart = slot.split(' ')[0]
  const d = new Date(datePart + 'T12:00:00')
  return {
    weekday: format(d, 'EEE'),
    month: format(d, 'MMM'),
    day: format(d, 'd'),
  }
}

/**
 * Compute heatmap data from all participant availability records.
 * Returns a Map<slot, { count, total, participants: string[] }>
 */
export function computeHeatmap(allSlots, participantRows) {
  const map = new Map()

  for (const slot of allSlots) {
    map.set(slot, { count: 0, total: participantRows.length, participants: [] })
  }

  for (const row of participantRows) {
    const participantSlots = new Set(row.slots || [])
    for (const slot of allSlots) {
      if (participantSlots.has(slot)) {
        const entry = map.get(slot)
        if (entry) {
          entry.count += 1
          entry.participants.push(row.participant_name)
        }
      }
    }
  }

  return map
}

/**
 * Find all slots where every participant is available (100% overlap).
 * Returns a Set<slot>.
 */
export function findBestSlots(heatmap, total) {
  const best = new Set()
  if (total === 0) return best

  for (const [slot, { count }] of heatmap) {
    if (count === total) {
      best.add(slot)
    }
  }

  return best
}

/**
 * Format a slot's time range: "2025-01-15 09:30" → "9:30 AM – 10:00 AM"
 */
export function formatSlotRange(slot) {
  const [datePart, timePart] = slot.split(' ')
  let [h, m] = timePart.split(':').map(Number)
  m += 30
  if (m >= 60) { m -= 60; h += 1 }
  const endTimePart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return `${formatSlotTime(slot)} – ${formatSlotTime(datePart + ' ' + endTimePart)}`
}

/**
 * Detect the user's IANA timezone (e.g. "America/New_York").
 */
export function detectTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Get UTC offset in minutes for a given IANA timezone at the current moment.
 * UTC+2 → 120, UTC-5 → -300.
 */
export function getUtcOffsetMinutes(timezone) {
  try {
    const now = new Date()
    const tzStr  = now.toLocaleString('en-US', { timeZone: timezone })
    const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' })
    return (new Date(tzStr) - new Date(utcStr)) / 60000
  } catch {
    return 0
  }
}

/**
 * Apply a minute delta to "HH:MM", wrapping within 24 h.
 * Returns "HH:MM".
 */
export function applyOffsetToTime(timeStr, offsetMins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + offsetMins
  const norm  = ((total % 1440) + 1440) % 1440
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`
}

/**
 * Format a slot's time with an additional UTC-offset delta (displayTZ − meetingTZ, in minutes).
 * offsetMins = 0 is a no-op.
 */
export function formatSlotTimeOffset(slot, offsetMins) {
  if (!offsetMins) return formatSlotTime(slot)
  const [, timePart] = slot.split(' ')
  return formatSlotTime('2000-01-01 ' + applyOffsetToTime(timePart, offsetMins))
}

/**
 * Format a slot's time range with an offset applied.
 * "2025-01-15 09:30" + offsetMins -180 → "6:30 AM – 7:00 AM"
 */
export function formatSlotRangeOffset(slot, offsetMins) {
  if (!offsetMins) return formatSlotRange(slot)
  const [, timePart] = slot.split(' ')
  const adjStart = applyOffsetToTime(timePart, offsetMins)
  const [adjH, adjM] = adjStart.split(':').map(Number)
  let endM = adjM + 30, endH = adjH
  if (endM >= 60) { endM -= 60; endH = (endH + 1) % 24 }
  const adjEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  return `${formatSlotTime('2000-01-01 ' + adjStart)} – ${formatSlotTime('2000-01-01 ' + adjEnd)}`
}

/**
 * Curated list of common IANA timezones for a selector.
 */
export const COMMON_TIMEZONES = [
  { value: 'Pacific/Honolulu',    label: 'Hawaii (UTC−10)' },
  { value: 'America/Anchorage',   label: 'Alaska (UTC−9)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time — US & Canada (UTC−8/−7)' },
  { value: 'America/Denver',      label: 'Mountain Time — US & Canada (UTC−7/−6)' },
  { value: 'America/Chicago',     label: 'Central Time — US & Canada (UTC−6/−5)' },
  { value: 'America/New_York',    label: 'Eastern Time — US & Canada (UTC−5/−4)' },
  { value: 'America/Halifax',     label: 'Atlantic Time — Canada (UTC−4/−3)' },
  { value: 'America/Sao_Paulo',   label: 'São Paulo (UTC−3)' },
  { value: 'Atlantic/Azores',     label: 'Azores (UTC−1)' },
  { value: 'UTC',                 label: 'UTC (UTC+0)' },
  { value: 'Europe/London',       label: 'London (UTC+0/+1)' },
  { value: 'Europe/Paris',        label: 'Paris / Berlin / Rome (UTC+1/+2)' },
  { value: 'Europe/Helsinki',     label: 'Helsinki / Athens (UTC+2/+3)' },
  { value: 'Europe/Moscow',       label: 'Moscow (UTC+3)' },
  { value: 'Asia/Dubai',          label: 'Dubai (UTC+4)' },
  { value: 'Asia/Karachi',        label: 'Karachi / Islamabad (UTC+5)' },
  { value: 'Asia/Kolkata',        label: 'India — Mumbai / Delhi (UTC+5:30)' },
  { value: 'Asia/Dhaka',          label: 'Dhaka (UTC+6)' },
  { value: 'Asia/Bangkok',        label: 'Bangkok / Jakarta (UTC+7)' },
  { value: 'Asia/Singapore',      label: 'Singapore / Beijing (UTC+8)' },
  { value: 'Asia/Tokyo',          label: 'Tokyo / Seoul (UTC+9)' },
  { value: 'Australia/Sydney',    label: 'Sydney / Melbourne (UTC+10/+11)' },
  { value: 'Pacific/Auckland',    label: 'Auckland (UTC+12/+13)' },
]

/**
 * Get the heatmap cell color based on ratio (0–1).
 * Darker terracotta = fewer people available.
 * Green = everyone available (100%).
 */
export function heatmapColor(count, total) {
  if (total === 0 || count === 0) return null

  const ratio = count / total

  if (ratio === 1) {
    return '#4A9060' // warm green — everyone available
  }

  // Invert: lower ratio = more opaque (darker) terracotta
  const opacity = 0.18 + (1 - ratio) * 0.70
  return `rgba(161, 74, 47, ${opacity.toFixed(2)})`
}
