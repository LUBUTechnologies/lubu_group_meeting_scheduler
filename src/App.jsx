import { Routes, Route } from 'react-router-dom'
import CreateMeeting from './pages/CreateMeeting.jsx'
import MeetingView from './pages/MeetingView.jsx'
import ResultsView from './pages/ResultsView.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateMeeting />} />
      <Route path="/meeting/:id" element={<MeetingView />} />
      <Route path="/meeting/:id/results" element={<ResultsView />} />
    </Routes>
  )
}

export default App
