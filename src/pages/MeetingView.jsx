import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MeetingHeader from '../components/MeetingHeader.jsx'
import AvailabilityGrid from '../components/AvailabilityGrid.jsx'

export default function MeetingView() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [allAvailability, setAllAvailability] = useState([])
  const [selectedSlots, setSelectedSlots] = useState(new Set())
  const [name, setName] = useState('')
  const [nameInput, setNameInput] = useState('') // always starts empty
  const [showModal, setShowModal] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

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

      setAllAvailability(avail || [])
      setLoading(false)
    }
    load()
  }, [id])

  // When name is confirmed, load that person's existing slots
  useEffect(() => {
    if (!name) return
    const existing = allAvailability.find(r => r.participant_name === name)
    if (existing) setSelectedSlots(new Set(existing.slots || []))
    else setSelectedSlots(new Set())
  }, [name, allAvailability])

  const handleNameSubmit = (e) => {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) return
    localStorage.setItem(`meeting_name_${id}`, trimmed)
    setName(trimmed)
    setShowModal(false)
  }

  const handleSave = async () => {
    if (!name) { setShowModal(true); return }
    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('availability')
      .upsert(
        { meeting_id: id, participant_name: name, slots: [...selectedSlots] },
        { onConflict: 'meeting_id,participant_name' }
      )

    setSaving(false)
    if (dbError) { setError(dbError.message); return }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    const { data: avail } = await supabase
      .from('availability')
      .select('*')
      .eq('meeting_id', id)
    setAllAvailability(avail || [])
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-[#6B6860]">Loading…</div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="h-screen bg-[#FAF9F5] flex items-center justify-center">
        <div className="text-red-500">{error || 'Meeting not found.'}</div>
      </div>
    )
  }

  return (
    // Full-viewport column: header + grid (grows) + footer (always visible)
    <div className="h-screen bg-[#FAF9F5] flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full px-4">

        {/* Header + toolbar — fixed height */}
        <div className="shrink-0 pt-7 pb-3">
          <MeetingHeader
            title={meeting.title}
            description={meeting.description}
            meetingUrl={meeting.meeting_url}
          />

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {name && (
                <>
                  <span className="text-sm text-[#6B6860]">Filling in as</span>
                  <span className="text-sm font-semibold text-brand-600 bg-brand-500/10 border border-brand-500/25 px-3 py-1 rounded-full">
                    {name}
                  </span>
                  <button
                    onClick={() => { setShowModal(true); setNameInput(name) }}
                    className="text-xs text-[#6B6860] hover:text-[#1F1E1D] transition-colors"
                  >
                    change
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm bg-white border border-[#E8E5DC] hover:border-[#C5C1BA] text-[#1F1E1D] px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy link'}
              </button>

              <Link
                to={`/meeting/${id}/results`}
                className="text-sm bg-white border border-[#E8E5DC] hover:border-[#C5C1BA] text-[#1F1E1D] px-3 py-1.5 rounded-lg transition-colors"
              >
                View results →
              </Link>
            </div>
          </div>
        </div>

        {/* Grid — fills all remaining height, scrolls internally */}
        <div className="flex-1 min-h-0 py-2">
          <AvailabilityGrid
            meeting={meeting}
            selectedSlots={selectedSlots}
            onSlotsChange={setSelectedSlots}
            heightClass="h-full"
          />
        </div>

        {/* Footer — always visible, save button here */}
        <div className="shrink-0 py-3 border-t border-[#E8E5DC] flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-[#6B6860]">
            Click or drag to toggle 30-minute slots.
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !name}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Save availability'}
          </button>
        </div>

        {error && (
          <div className="shrink-0 pb-3 -mt-1">
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Success toast */}
      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1F1E1D] text-white text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5">
          <svg className="w-4 h-4 text-[#4A9060] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Availability saved
        </div>
      )}

      {/* Name modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E5DC] rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-[#1F1E1D] mb-2">What's your name?</h2>
            <p className="text-sm text-[#6B6860] mb-5">So we know whose availability this is.</p>
            <form onSubmit={handleNameSubmit}>
              <input
                autoFocus
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Your name…"
                className="w-full bg-[#F5F4ED] border border-[#E8E5DC] rounded-lg px-4 py-2.5 text-[#1F1E1D] placeholder-[#C5C1BA] focus:outline-none focus:border-brand-500 transition-colors mb-4"
              />
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Continue
              </button>
            </form>

            {allAvailability.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#E8E5DC]">
                <p className="text-xs text-[#6B6860] mb-3">Already responded — update your availability:</p>
                <div className="flex flex-wrap gap-2">
                  {allAvailability.map(row => (
                    <button
                      key={row.participant_name}
                      type="button"
                      onClick={() => setNameInput(row.participant_name)}
                      className={[
                        'text-sm px-3 py-1.5 rounded-full border transition-colors',
                        nameInput === row.participant_name
                          ? 'bg-brand-500/10 border-brand-500/40 text-brand-600'
                          : 'bg-[#F5F4ED] border-[#E8E5DC] text-[#1F1E1D] hover:border-[#C5C1BA]',
                      ].join(' ')}
                    >
                      {row.participant_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
