import { useRef, useState, useEffect } from 'react'
import MapView from '../components/MapView'
import { useGpxStore } from '../store/gpxStore'
import { useLiveTrackStore } from '../store/liveTrackStore'
import { useKmlStore } from '../store/kmlStore'
import { parseKmz } from '../utils/kmlParser'
import { pointInPolygon } from '../utils/geometry'
import { playBoundaryAlert } from '../utils/audio'
import type { MapLayer, LivePoint } from '../types'

const LAYER_LABELS: Record<MapLayer, string> = {
  osm: 'Mappa',
  topo: 'Topo',
  satellite: 'Satellite',
}

export default function MapScreen() {
  const kmlFileRef = useRef<HTMLInputElement>(null)
  const prevInsideRef = useRef<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [headingUpMode, setHeadingUpMode] = useState(false)
  const [heading, setHeading] = useState(0)

  const { activeLayer, setLayer } = useGpxStore()
  const { session, isTracking, error: gpsError, startTracking, stopTracking, clearSession, saveCurrentSession, setError: setGpsError } = useLiveTrackStore()
  const { kmlLayers, addKmlLayer, removeKmlLayer, toggleKmlLayer } = useKmlStore()

  const livePoints = session?.points ?? []
  const userPosition = livePoints.length > 0 ? livePoints[livePoints.length - 1] : null

  // Calcola bearing dai punti GPS per heading-up mode
  useEffect(() => {
    if (livePoints.length >= 2) {
      const p1 = livePoints[livePoints.length - 2]
      const p2 = livePoints[livePoints.length - 1]
      setHeading(calcBearing(p1, p2))
    }
  }, [livePoints])

  // Rilevamento uscita dal territorio: suona un doppio beep quando si esce
  useEffect(() => {
    if (!isTracking || !userPosition || kmlLayers.length === 0) return

    const nowInside = new Set<string>()
    for (const layer of kmlLayers) {
      if (!layer.visible) continue
      for (const pm of layer.placemarks) {
        if (pm.type === 'point') continue
        if (!pm.coordinates || pm.coordinates.length < 3) continue
        const id = `${layer.id}::${pm.name}`
        if (pointInPolygon(userPosition.lat, userPosition.lon, pm.coordinates)) {
          nowInside.add(id)
        }
      }
    }

    // Suona se si è appena usciti da almeno un territorio
    for (const id of prevInsideRef.current) {
      if (!nowInside.has(id)) {
        playBoundaryAlert()
        break // un solo segnale anche se si escono più territori contemporaneamente
      }
    }

    prevInsideRef.current = nowInside
  }, [userPosition, isTracking, kmlLayers])

  async function handleKmlFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const { name, placemarks } = await parseKmz(buffer)
      addKmlLayer(name, placemarks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il parsing KMZ')
    }
    e.target.value = ''
  }

  async function handleGpsFab() {
    if (isTracking) {
      await stopTracking()
    } else {
      await startTracking()
    }
  }

  function openClearConfirm() {
    const now = new Date()
    const label = now.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    setSessionName(label)
    setShowClearConfirm(true)
  }

  async function handleSaveSession() {
    setShowClearConfirm(false)
    await saveCurrentSession(sessionName.trim() || 'Sessione senza nome')
  }

  async function handleDiscardSession() {
    setShowClearConfirm(false)
    await clearSession()
  }

  function getLiveDistanceKm(): string {
    if (livePoints.length < 2) return '0.0'
    let d = 0
    for (let i = 1; i < livePoints.length; i++) {
      const a = livePoints[i - 1]
      const b = livePoints[i]
      const R = 6371
      const dLat = ((b.lat - a.lat) * Math.PI) / 180
      const dLon = ((b.lon - a.lon) * Math.PI) / 180
      const sin2 =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
          Math.cos((b.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2
      d += 2 * R * Math.asin(Math.sqrt(sin2))
    }
    return d.toFixed(2)
  }

  return (
    <div className="relative flex flex-col" style={{ height: 'calc(100svh - 56px)' }}>
      <div className="flex-1 relative overflow-hidden">
        <MapView
          track={null}
          layer={activeLayer}
          livePoints={livePoints}
          userPosition={userPosition}
          isTracking={isTracking}
          kmlLayers={kmlLayers}
          bearing={headingUpMode ? heading : 0}
        />

        {/* Layer switcher */}
        <div className="absolute top-3 right-3 z-[999] flex flex-col gap-1">
          {(Object.keys(LAYER_LABELS) as MapLayer[]).map((l) => (
            <button
              key={l}
              onClick={() => setLayer(l)}
              className={`px-2 py-1 text-xs rounded shadow font-medium transition-colors ${
                activeLayer === l
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {LAYER_LABELS[l]}
            </button>
          ))}
        </div>

        {/* Banner sessione in sospeso */}
        {session && !isTracking && (
          <div className="absolute top-32 left-3 right-16 z-[999] bg-amber-50 border border-amber-300 text-amber-800 text-xs px-3 py-2 rounded-lg shadow flex items-center gap-2">
            <span className="text-amber-500">⏸</span>
            <span className="flex-1 font-medium">Sessione in sospeso · {getLiveDistanceKm()} km</span>
            <button
              onClick={handleGpsFab}
              className="bg-amber-500 text-white px-2 py-1 rounded font-semibold text-xs"
            >
              ▶ Riprendi
            </button>
            <button
              onClick={openClearConfirm}
              className="text-amber-600 px-1 py-1 text-base"
            >
              🗑
            </button>
          </div>
        )}

        {/* Badge GPS attivo */}
        {isTracking && (
          <div className="absolute top-3 left-3 z-[999] bg-green-600 text-white text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse inline-block" />
            GPS ATTIVO · {getLiveDistanceKm()} km
          </div>
        )}

        {/* Barra pulsanti in basso: Avvia | Carica KMZ */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2">
          {/* Avvia / Ferma GPS */}
          {!session && (
            <button
              onClick={handleGpsFab}
              className="bg-green-600 text-white px-4 py-3 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform"
            >
              📍 Avvia
            </button>
          )}
          {isTracking && (
            <button
              onClick={handleGpsFab}
              className="bg-red-600 text-white px-4 py-3 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform animate-pulse"
            >
              ⏹ Ferma
            </button>
          )}

          {/* Carica KMZ */}
          <button
            onClick={() => kmlFileRef.current?.click()}
            className="bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform"
          >
            <span>🗺</span> Carica KMZ
          </button>
          <input
            ref={kmlFileRef}
            type="file"
            accept=".kmz,application/vnd.google-earth.kmz"
            className="hidden"
            onChange={handleKmlFile}
          />

        </div>

        {/* Mini-lista KML caricati */}
        {kmlLayers.length > 0 && (
          <div className="absolute top-14 left-3 z-[999] flex flex-col gap-1 max-w-[200px]">
            {kmlLayers.map((kml) => (
              <div
                key={kml.id}
                className="bg-white/90 backdrop-blur-sm rounded-lg shadow px-2.5 py-1.5 flex items-center gap-2 text-xs"
              >
                <button
                  onClick={() => toggleKmlLayer(kml.id)}
                  className="w-3 h-3 rounded-full flex-shrink-0 border-2 transition-opacity"
                  style={{
                    backgroundColor: kml.visible ? kml.color : 'transparent',
                    borderColor: kml.color,
                  }}
                  title={kml.visible ? 'Nascondi' : 'Mostra'}
                />
                <span
                  className="flex-1 truncate font-medium text-gray-700"
                  style={{ opacity: kml.visible ? 1 : 0.5 }}
                >
                  {kml.name}
                </span>
                <button
                  onClick={() => removeKmlLayer(kml.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-xs leading-none flex-shrink-0"
                  title="Rimuovi"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}


        {/* Bottone Fine territorio */}
        {session && !isTracking && (
          <button
            onClick={openClearConfirm}
            className="absolute bottom-4 right-3 z-[999] bg-white border border-gray-300 text-gray-600 px-3 py-3 rounded-full shadow text-sm font-semibold active:scale-95 transition-transform"
          >
            ✓ Fine
          </button>
        )}

        {/* Pulsante bussola: orienta nel senso di marcia / torna a nord */}
        <button
          onClick={() => setHeadingUpMode((v) => !v)}
          className={`absolute bottom-28 right-3 z-[999] rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl transition-all active:scale-95 ${
            headingUpMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
          title={headingUpMode ? 'Torna a Nord' : 'Orienta nel senso di marcia'}
        >
          <span
            style={{
              display: 'inline-block',
              transform: headingUpMode ? `rotate(${heading}deg)` : 'none',
              transition: 'transform 0.3s ease',
            }}
          >
            ⬆
          </span>
        </button>

        {/* Errori */}
        {(error || gpsError) && (
          <div
            className="absolute top-14 left-3 right-16 z-[999] bg-red-100 text-red-700 text-xs px-3 py-2 rounded shadow cursor-pointer"
            onClick={() => { setError(null); setGpsError(null) }}
          >
            {error || gpsError} &nbsp;✕
          </div>
        )}
      </div>

      {/* Dialog fine sessione: salva o scarta */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-gray-800 mb-1">Territorio completato?</h3>
            <p className="text-sm text-gray-500 mb-4">Vuoi salvare questa traccia prima di pulire la mappa?</p>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Nome sessione"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:border-blue-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700"
              >
                Annulla
              </button>
              <button
                onClick={handleDiscardSession}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                🗑 Scarta
              </button>
              <button
                onClick={handleSaveSession}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
              >
                💾 Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function calcBearing(p1: LivePoint, p2: LivePoint): number {
  const lat1 = (p1.lat * Math.PI) / 180
  const lat2 = (p2.lat * Math.PI) / 180
  const dLon = ((p2.lon - p1.lon) * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}
