import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import MapScreen from './screens/MapScreen'
import StatsScreen from './screens/StatsScreen'
import TracksScreen from './screens/TracksScreen'
import GuideScreen from './screens/GuideScreen'
import { useGpxStore } from './store/gpxStore'
import { useLiveTrackStore } from './store/liveTrackStore'

function AppInner() {
  const { load, loaded } = useGpxStore()
  const { loadSession, loadSavedSessions } = useLiveTrackStore()

  useEffect(() => {
    load()
    loadSession()
    loadSavedSessions()
  }, [load, loadSession, loadSavedSessions])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-400 text-sm">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto relative bg-gray-50">
      <Routes>
        <Route path="/" element={<MapScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/tracks" element={<TracksScreen />} />
        <Route path="/guide" element={<GuideScreen />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
