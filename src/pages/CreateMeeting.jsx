import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isBefore,
  startOfDay,
} from 'date-fns'
import { supabase } from '../lib/supabase.js'

const today = startOfDay(new Date())

export default function CreateMeeting() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [selectedDates, setSelectedDates] = useState([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const toggleDate = useCallback((day) => {
    if (isBefore(day, today)) return
    setSelectedDates(prev => {
      const exists = prev.some(d => isSameDay(d, day))
      if (exists) return prev.filter(d => !isSameDay(d, day))
      return [...prev, day].sort((a, b) => a - b)
    })
  }, [])

  const removeDate = useCallback((day) => {
    setSelectedDates(prev => prev.filter(d => !isSameDay(d, day)))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('Meeting title is required.'); return }
    if (selectedDates.length === 0) { setError('Select at least one date.'); return }
    if (startTime >= endTime) { setError('End time must be after start time.'); return }

    setLoading(true)
    const { data, error: dbError } = await supabase
      .from('meetings')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        meeting_url: meetingUrl.trim() || null,
        dates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
        start_time: startTime,
        end_time: endTime,
      })
      .select('id')
      .single()

    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    navigate(`/meeting/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1F1E1D]">Group Meeting Scheduler</h1>
          <p className="mt-2 text-[#6B6860]">Find a time that works for everyone.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Meeting details */}
          <div className="bg-white rounded-2xl border border-[#E8E5DC] p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1F1E1D]">Meeting details</h2>

            <div>
              <label className="block text-sm text-[#6B6860] mb-1">Title <span className="text-brand-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Team standup, Project kickoff…"
                className="w-full bg-[#F5F4ED] border border-[#E8E5DC] rounded-lg px-4 py-2.5 text-[#1F1E1D] placeholder-[#C5C1BA] focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6B6860] mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional context…"
                className="w-full bg-[#F5F4ED] border border-[#E8E5DC] rounded-lg px-4 py-2.5 text-[#1F1E1D] placeholder-[#C5C1BA] focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[#6B6860] mb-1">Meeting link</label>
              <input
                type="url"
                value={meetingUrl}
                onChange={e => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/…"
                className="w-full bg-[#F5F4ED] border border-[#E8E5DC] rounded-lg px-4 py-2.5 text-[#1F1E1D] placeholder-[#C5C1BA] focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Date picker */}
          <div className="bg-white rounded-2xl border border-[#E8E5DC] p-6">
            <h2 className="text-lg font-semibold text-[#1F1E1D] mb-4">Select dates <span className="text-brand-500">*</span></h2>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                className="p-1.5 rounded-lg hover:bg-[#F5F4ED] text-[#6B6860] hover:text-[#1F1E1D] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-[#1F1E1D] font-medium">{format(calendarMonth, 'MMMM yyyy')}</span>
              <button
                type="button"
                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                className="p-1.5 rounded-lg hover:bg-[#F5F4ED] text-[#6B6860] hover:text-[#1F1E1D] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-xs text-[#6B6860] py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map(day => {
                const isSelected = selectedDates.some(d => isSameDay(d, day))
                const isPast = isBefore(day, today)
                const isCurrentMonth = isSameMonth(day, calendarMonth)
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => toggleDate(day)}
                    className={[
                      'h-9 w-full rounded-lg text-sm font-medium transition-colors',
                      !isCurrentMonth && 'opacity-25',
                      isPast && 'text-[#C5C1BA] cursor-not-allowed',
                      !isPast && !isSelected && 'text-[#1F1E1D] hover:bg-[#F5F4ED]',
                      isSelected && 'bg-brand-500 text-white slot-glow',
                    ].filter(Boolean).join(' ')}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>

            {/* Selected date chips */}
            {selectedDates.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedDates.map(d => (
                  <span
                    key={d.toISOString()}
                    className="inline-flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/30 text-brand-600 text-xs px-3 py-1 rounded-full"
                  >
                    {format(d, 'EEE, MMM d')}
                    <button
                      type="button"
                      onClick={() => removeDate(d)}
                      className="text-brand-500 hover:text-brand-700 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time range */}
          <div className="bg-white rounded-2xl border border-[#E8E5DC] p-6">
            <h2 className="text-lg font-semibold text-[#1F1E1D] mb-4">Time range <span className="text-brand-500">*</span></h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm text-[#6B6860] mb-1">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-[#F5F4ED] border border-[#E8E5DC] rounded-lg px-4 py-2.5 text-[#1F1E1D] focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div className="mt-6 text-[#6B6860]">→</div>
              <div className="flex-1">
                <label className="block text-sm text-[#6B6860] mb-1">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-[#F5F4ED] border border-[#E8E5DC] rounded-lg px-4 py-2.5 text-[#1F1E1D] focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creating…' : 'Create Meeting'}
          </button>
        </form>
      </div>
    </div>
  )
}
