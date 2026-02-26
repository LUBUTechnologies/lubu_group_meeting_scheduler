export default function MeetingHeader({ title, description, meetingUrl }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[#1F1E1D]">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-[#6B6860]">{description}</p>
      )}
      {meetingUrl && (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 underline underline-offset-2"
        >
          {meetingUrl}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  )
}
