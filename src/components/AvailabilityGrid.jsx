import { useRef, useState, useCallback, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import {
  generateSlots, formatSlotDate, heatmapColor,
  applyOffsetToTime, formatSlotTime, formatSlotRangeOffset,
  getUtcOffsetMinutes,
} from '../utils/timeSlots.js'

export default function AvailabilityGrid({
  meeting,
  selectedSlots = new Set(),
  onSlotsChange,
  heatmap,
  allParticipants = [],
  highlightSlots = null,
  readOnly = false,
  heightClass = 'max-h-[75vh]',
  meetingTimezone = 'UTC',
  displayTimezone = null,
}) {
  const isHeatmap = !!heatmap
  const allSlots = generateSlots(meeting.dates, meeting.start_time, meeting.end_time)

  // Minutes to add to meeting-TZ times for display (0 when same timezone)
  const effectiveTZ = displayTimezone || meetingTimezone
  const offsetMins = (effectiveTZ !== meetingTimezone)
    ? getUtcOffsetMinutes(effectiveTZ) - getUtcOffsetMinutes(meetingTimezone)
    : 0

  // Format a "HH:MM" string with the display offset applied
  const fmtTime = (hhmm) => formatSlotTime(
    '2000-01-01 ' + (offsetMins ? applyOffsetToTime(hhmm, offsetMins) : hhmm)
  )

  const meetingDateSet = new Set(allSlots.map(s => s.split(' ')[0]))
  const timeStrings = [...new Set(allSlots.map(s => s.split(' ')[1]))]

  // Expand to full Mon–Sun weeks
  const sortedMeetingDates = [...meetingDateSet].sort()
  const firstDate = new Date(sortedMeetingDates[0] + 'T12:00:00')
  const lastDate  = new Date(sortedMeetingDates[sortedMeetingDates.length - 1] + 'T12:00:00')
  const weekStart = startOfWeek(firstDate, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(lastDate,   { weekStartsOn: 1 })
  const dateStrings = eachDayOfInterval({ start: weekStart, end: weekEnd })
    .map(d => format(d, 'yyyy-MM-dd'))

  // End-time label for the final row (handles "HH:MM:SS" from DB), with display offset
  const endTimePart = meeting.end_time.split(':').slice(0, 2).join(':')
  const endTimeLabel = fmtTime(endTimePart)

  const dragModeRef = useRef(null)
  const isDragging = useRef(false)
  const [tooltip, setTooltip] = useState(null) // { slot, x, y, entry? }

  const toggleSlot = useCallback((slot, mode) => {
    if (readOnly || !onSlotsChange) return
    const next = new Set(selectedSlots)
    if (mode === 'select') next.add(slot)
    else next.delete(slot)
    onSlotsChange(next)
  }, [selectedSlots, onSlotsChange, readOnly])

  const handleMouseDown = useCallback((slot) => (e) => {
    if (readOnly) return
    e.preventDefault()
    setTooltip(null) // hide tooltip while dragging
    isDragging.current = true
    dragModeRef.current = selectedSlots.has(slot) ? 'deselect' : 'select'
    toggleSlot(slot, dragModeRef.current)
  }, [readOnly, selectedSlots, toggleSlot])

  const handleMouseEnter = useCallback((slot) => () => {
    if (!isDragging.current || readOnly) return
    toggleSlot(slot, dragModeRef.current)
  }, [readOnly, toggleSlot])

  useEffect(() => {
    const onUp = () => { isDragging.current = false }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (readOnly) return
    e.preventDefault()
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const slot = el?.dataset?.slot
    if (!slot) return
    isDragging.current = true
    dragModeRef.current = selectedSlots.has(slot) ? 'deselect' : 'select'
    toggleSlot(slot, dragModeRef.current)
  }, [readOnly, selectedSlots, toggleSlot])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || readOnly) return
    e.preventDefault()
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const slot = el?.dataset?.slot
    if (slot) toggleSlot(slot, dragModeRef.current)
  }, [readOnly, toggleSlot])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
  }, [])

  const getCellStyle = (slot) => {
    if (isHeatmap) {
      const entry = heatmap.get(slot)
      if (highlightSlots !== null) {
        if (highlightSlots.has(slot)) return { backgroundColor: '#C96442' }
        if (entry && entry.count > 0) return { backgroundColor: 'rgba(177, 173, 161, 0.18)' }
        return {}
      }
      if (!entry || entry.count === 0) return {}
      return { backgroundColor: heatmapColor(entry.count, entry.total) }
    }
    if (selectedSlots.has(slot)) return { backgroundColor: '#C96442' }
    return {}
  }

  const getCellClass = (slot) => {
    const base = 'h-7 border border-surface-50 transition-colors select-none'
    if (readOnly) return base + ' cursor-default'
    if (isHeatmap) return base + ' cursor-default'
    if (selectedSlots.has(slot)) return base + ' cursor-pointer slot-glow'
    return base + ' cursor-pointer hover:bg-brand-500/10'
  }

  const numCols = dateStrings.length
  const gridTemplateColumns = `64px repeat(${numCols}, minmax(70px, 1fr))`

  return (
    <div className="relative h-full">
      <div
        className={`${heightClass} overflow-auto rounded-xl border border-surface-50 pb-3`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ display: 'grid', gridTemplateColumns }}>
          {/* Corner — also hosts the first time label so it isn't hidden behind this z-20 cell */}
          <div className="sticky top-0 left-0 z-20 bg-surface-300 border-b border-r border-surface-50 relative">
            {timeStrings.length > 0 && (
              <span className="absolute bottom-0 right-2 text-xs text-[#6B6860] whitespace-nowrap translate-y-[50%]">
                {fmtTime(timeStrings[0])}
              </span>
            )}
          </div>

          {/* Date headers */}
          {dateStrings.map(date => {
            const isActive = meetingDateSet.has(date)
            const { weekday, month, day } = formatSlotDate(date + ' 00:00')
            return (
              <div
                key={date}
                className={`sticky top-0 z-10 bg-surface-300 border-b border-r border-surface-50 px-2 py-2 text-center ${!isActive ? 'opacity-30' : ''}`}
              >
                <div className="text-xs text-[#6B6860]">{weekday}</div>
                <div className="text-sm font-semibold text-[#1F1E1D]">{month} {day}</div>
              </div>
            )
          })}

          {/* Time rows — label sits at the TOP of each row (= at the grid line).
               The first row's label lives in the corner cell above; skip it here. */}
          {timeStrings.map((time, index) => (
            <div key={time} style={{ display: 'contents' }}>
              {/* Time label — skip index 0 (shown in corner), show all others on the grid line */}
              <div className="sticky left-0 z-10 bg-surface-300 border-b border-r border-surface-50 pr-2 flex items-start justify-end">
                {index > 0 && (
                  <span className="text-xs text-[#6B6860] whitespace-nowrap -translate-y-[7px]">
                    {fmtTime(time)}
                  </span>
                )}
              </div>

              {/* Cells */}
              {dateStrings.map(date => {
                const slot = `${date} ${time}`

                // Inactive day — gray, non-interactive
                if (!meetingDateSet.has(date)) {
                  return (
                    <div
                      key={slot}
                      className="h-7 border border-surface-50 bg-[#F5F4ED] cursor-default"
                    />
                  )
                }

                const entry = isHeatmap ? heatmap.get(slot) : null
                return (
                  <div
                    key={slot}
                    data-slot={slot}
                    className={getCellClass(slot)}
                    style={getCellStyle(slot)}
                    onMouseDown={handleMouseDown(slot)}
                    onMouseEnter={handleMouseEnter(slot)}
                    onMouseMove={(e) => {
                      if (isDragging.current) return
                      if (isHeatmap && entry && entry.total > 0) {
                        setTooltip({ slot, x: e.clientX, y: e.clientY, entry })
                      } else if (!isHeatmap) {
                        setTooltip({ slot, x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}

          {/* End-time label row — shows the closing time at the bottom grid line */}
          <div className="sticky left-0 z-10 bg-surface-300 border-r border-surface-50 pr-2 flex items-start justify-end h-4">
            <span className="text-xs text-[#6B6860] whitespace-nowrap -translate-y-[7px]">
              {endTimeLabel}
            </span>
          </div>
          {dateStrings.map(date => (
            <div
              key={`end_${date}`}
              className={`h-4 border-r border-surface-50 ${!meetingDateSet.has(date) ? 'bg-[#F5F4ED]' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Tooltip — selection mode: shows time range; heatmap mode: shows availability */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-[#E8E5DC] rounded-lg px-3 py-2 shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          {isHeatmap && tooltip.entry ? (
            <>
              <div className="text-xs font-semibold text-[#1F1E1D] mb-1">
                {formatSlotRangeOffset(tooltip.slot, offsetMins)} — {tooltip.entry.count}/{tooltip.entry.total} available
              </div>
              {(() => {
                const missing = allParticipants.filter(p => !tooltip.entry.participants.includes(p))
                if (missing.length === 0) return (
                  <div className="text-xs text-[#4A9060] font-medium">Everyone available</div>
                )
                return missing.map(p => (
                  <div key={p} className="text-xs text-[#6B6860]">✕ {p}</div>
                ))
              })()}
            </>
          ) : (
            <div className="text-xs font-medium text-[#1F1E1D]">
              {formatSlotRangeOffset(tooltip.slot, offsetMins)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
