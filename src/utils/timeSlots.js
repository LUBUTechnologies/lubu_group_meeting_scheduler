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
