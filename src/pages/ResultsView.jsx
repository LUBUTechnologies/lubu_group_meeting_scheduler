import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MeetingHeader from '../components/MeetingHeader.jsx'
import AvailabilityGrid from '../components/AvailabilityGrid.jsx'
import { generateSlots, computeHeatmap, findBestSlots } from '../utils/timeSlots.js'

export default function ResultsView() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedParticipant, setSelectedParticipant] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: meetingData, error: mErr } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single()

      if (mErr || !meetingData) { setError('Meeting not found.'); setLoading(false); return }
      setMeeting(meetingData)

      const { data: avail } = await supabase
        .from('availability')
        .select('*')
        .eq('meeting_id', id)

      setAvailability(avail || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-[#6B6860]">Loading…</div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-red-500">{error || 'Meeting not found.'}</div>
      </div>
    )
  }

  const allSlots = generateSlots(meeting.dates, meeting.start_time, meeting.end_time)
  const heatmap = computeHeatmap(allSlots, availability)
  const allParticipants = availability.map(r => r.participant_name)

  // When a participant is selected, build the set of their slots to highlight
  const highlightSlots = selectedParticipant
    ? new Set(availability.find(r => r.participant_name === selectedParticipant)?.slots || [])
    : null

  const toggleParticipant = (name) => {
    setSelectedParticipant(prev => prev === name ? null : name)
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          to={`/meeting/${id}`}
          className="inline-flex items-center gap-1 text-sm text-[#6B6860] hover:text-[#1F1E1D] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to availability
        </Link>

        <MeetingHeader
          title={meeting.title}
          description={meeting.description}
          meetingUrl={meeting.meeting_url}
        />

        {/* Participants — clickable to highlight their slots on the grid */}
        {availability.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-[#6B6860] mb-3 uppercase tracking-wider">
              Participants
              {selectedParticipant && (
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="ml-3 normal-case font-normal text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {availability.map(row => {
                const isActive = selectedParticipant === row.participant_name
                return (
                  <button
                    key={row.id}
                    onClick={() => toggleParticipant(row.participant_name)}
                    className={[
                      'text-sm px-3 py-1.5 rounded-full border transition-colors',
                      isActive
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-white border-[#E8E5DC] text-[#1F1E1D] hover:border-brand-500',
                    ].join(' ')}
                  >
                    {row.participant_name}
                  </button>
                )
              })}
            </div>
            {selectedParticipant && (
              <p className="mt-2 text-xs text-[#6B6860]">
                Showing {selectedParticipant}'s availability. Click their name again or "Clear filter" to show everyone.
              </p>
            )}
          </div>
        )}

        {/* No responses yet */}
        {availability.length === 0 && (
          <div className="mb-6 bg-white border border-[#E8E5DC] rounded-xl px-5 py-8 text-center">
            <p className="text-[#6B6860]">No responses yet.</p>
            <Link
              to={`/meeting/${id}`}
              className="mt-3 inline-block text-brand-500 hover:text-brand-600 text-sm transition-colors"
            >
              Be the first to fill in availability →
            </Link>
          </div>
        )}

        <AvailabilityGrid
          meeting={meeting}
          heatmap={heatmap}
          allParticipants={allParticipants}
          highlightSlots={highlightSlots}
          readOnly
        />
      </div>
    </div>
  )
}
