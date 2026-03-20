import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveTrackStore } from '../store/liveTrackStore'

export default function TracksScreen() {
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { savedSessions, session, deleteSavedSession, restoreSession } = useLiveTrackStore()

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteSavedSession(id)
    setDeletingId(null)
  }

  async function handleRestore(id: string) {
    await restoreSession(id)
    navigate('/')
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
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="font-bold text-gray-800">Tracce salvate</h1>
        <p className="text-xs text-gray-400 mt-0.5">Sessioni GPS registrate sul dispositivo</p>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto pb-4">
        {savedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-8">
            <span className="text-5xl">📍</span>
            <p className="text-center text-sm">
              Nessuna sessione salvata. Avvia il GPS e salva la tua prima traccia.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {savedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 bg-white"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    📍 {s.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.distanceKm} km · {s.points.length} punti
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(s.savedAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(s.id)}
                  disabled={!!session}
                  className="text-green-600 px-2 py-1.5 rounded-lg bg-green-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  title={session ? 'Hai già una sessione attiva' : 'Riapri per continuare il territorio'}
                >
                  ▶ Continua
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
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
