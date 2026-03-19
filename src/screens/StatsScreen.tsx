import { useRef } from 'react'
import { useGpxStore } from '../store/gpxStore'
import { calcStats, formatDuration } from '../utils/calculations'
import { parseGpx } from '../utils/gpxParser'

export default function StatsScreen() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { currentTrack, loadTrack } = useGpxStore()
  const stats = currentTrack ? calcStats(currentTrack.points) : null

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const track = parseGpx(text)
      await loadTrack(track)
    } catch {
      // silently ignore; handled in map screen
    }
    e.target.value = ''
  }

  if (!currentTrack || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 px-8">
        <span className="text-5xl">📊</span>
        <p className="text-center text-sm">
          Nessuna traccia caricata. Vai alla scheda{' '}
          <strong>Mappa</strong> per importare un file GPX.
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold"
        >
          📂 Carica GPX
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".gpx"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    )
  }

  return (
    <div className="overflow-y-auto pb-20" style={{ height: 'calc(100svh - 56px)' }}>
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4">
        <h1 className="font-bold text-lg leading-tight">{currentTrack.name}</h1>
        <p className="text-blue-200 text-xs mt-0.5">
          {currentTrack.points.length} punti GPS ·{' '}
          {currentTrack.waypoints.length} waypoint
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-200 border-b border-gray-200">
        <StatCard
          icon="📏"
          label="Distanza totale"
          value={`${stats.distance} km`}
        />
        <StatCard
          icon="⏱️"
          label="Durata"
          value={formatDuration(stats.duration)}
        />
        <StatCard
          icon="⚡"
          label="Velocità media"
          value={stats.avgSpeed > 0 ? `${stats.avgSpeed} km/h` : '--'}
        />
        <StatCard
          icon="🚀"
          label="Velocità max"
          value={stats.maxSpeed > 0 ? `${stats.maxSpeed} km/h` : '--'}
        />
        <StatCard
          icon="⬆️"
          label="Dislivello +"
          value={`${stats.elevGain} m`}
          color="text-green-600"
        />
        <StatCard
          icon="⬇️"
          label="Dislivello −"
          value={`${stats.elevLoss} m`}
          color="text-red-500"
        />
        <StatCard icon="🏔️" label="Quota max" value={`${stats.maxElev} m`} />
        <StatCard icon="🏕️" label="Quota min" value={`${stats.minElev} m`} />
      </div>

      {/* Waypoints */}
      {currentTrack.waypoints.length > 0 && (
        <div className="px-4 pt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Waypoint ({currentTrack.waypoints.length})
          </h2>
          <div className="space-y-2">
            {currentTrack.waypoints.map((wpt, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-800">
                  📍 {wpt.name}
                </p>
                {wpt.desc && (
                  <p className="text-xs text-gray-500 mt-0.5">{wpt.desc}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {wpt.lat.toFixed(5)}, {wpt.lon.toFixed(5)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date info */}
      {currentTrack.points[0]?.time && (
        <div className="px-4 pt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Info traccia</h2>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 text-sm text-gray-600">
            <p>
              <span className="text-gray-400">Inizio:</span>{' '}
              {currentTrack.points[0].time.toLocaleString('it-IT')}
            </p>
            {currentTrack.points[currentTrack.points.length - 1]?.time && (
              <p className="mt-1">
                <span className="text-gray-400">Fine:</span>{' '}
                {currentTrack.points[
                  currentTrack.points.length - 1
                ].time!.toLocaleString('it-IT')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color = 'text-gray-800',
}: {
  icon: string
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-white flex items-center gap-3 px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-base font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}
