import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGpxStore } from '../store/gpxStore'
import { parseGpx } from '../utils/gpxParser'
import type { SavedTrack } from '../types'

export default function TracksScreen() {
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { savedTracks, loadSavedTrack, loadTrack, deleteSavedTrack } =
    useGpxStore()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const text = await file.text()
      const track = parseGpx(text)
      await loadTrack(track)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il parsing')
    }
    e.target.value = ''
  }

  function handleLoad(saved: SavedTrack) {
    loadSavedTrack(saved)
    navigate('/')
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteSavedTrack(id)
    setDeletingId(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100svh - 56px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-gray-800">Tracce salvate</h1>
        <button
          onClick={() => fileRef.current?.click()}
          className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"
        >
          <span>+</span> Importa GPX
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 text-red-700 text-xs px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto pb-4">
        {savedTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-8">
            <span className="text-5xl">📁</span>
            <p className="text-center text-sm">
              Nessuna traccia salvata. Importa un file GPX per iniziare.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {savedTracks.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center gap-3 px-4 py-3 bg-white active:bg-gray-50"
              >
                <button
                  onClick={() => handleLoad(saved)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    🗺️ {saved.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {saved.track.points.length} punti ·{' '}
                    {saved.track.waypoints.length} waypoint
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(saved.loadedAt)}
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(saved.id)}
                  disabled={deletingId === saved.id}
                  className="text-red-400 p-2 rounded-full hover:bg-red-50 disabled:opacity-40"
                  title="Elimina"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
