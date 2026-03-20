import { create } from 'zustand'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { loadData, saveData, removeData } from './storage'
import type { LivePoint, LiveSession, SavedLiveSession } from '../types'

const LIVE_SESSION_KEY = 'livesession'
const SAVED_SESSIONS_KEY = 'saved_live_sessions'
let pointsBuffer = 0

function calcDistanceKm(points: LivePoint[]): number {
  let d = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i]
    const R = 6371
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLon = (b.lon - a.lon) * Math.PI / 180
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    d += 2 * R * Math.asin(Math.sqrt(s))
  }
  return Math.round(d * 100) / 100
}

interface LiveTrackState {
  session: LiveSession | null
  isTracking: boolean
  watchId: string | null
  loaded: boolean
  error: string | null
  savedSessions: SavedLiveSession[]

  loadSession: () => Promise<void>
  loadSavedSessions: () => Promise<void>
  startTracking: () => Promise<void>
  stopTracking: () => Promise<void>
  addPoint: (p: LivePoint) => Promise<void>
  clearSession: () => Promise<void>
  saveCurrentSession: (name: string) => Promise<void>
  deleteSavedSession: (id: string) => Promise<void>
  setError: (err: string | null) => void
}

export const useLiveTrackStore = create<LiveTrackState>((set, get) => ({
  session: null,
  isTracking: false,
  watchId: null,
  loaded: false,
  error: null,
  savedSessions: [],

  loadSession: async () => {
    const saved = await loadData<LiveSession>(LIVE_SESSION_KEY)
    set({ session: saved ?? null, loaded: true })
  },

  loadSavedSessions: async () => {
    const saved = await loadData<SavedLiveSession[]>(SAVED_SESSIONS_KEY)
    set({ savedSessions: saved ?? [] })
  },

  startTracking: async () => {
    set({ error: null })
    try {
      // Richiedi permessi GPS solo su piattaforme native (Android/iOS)
      // Sul web il browser gestisce i permessi automaticamente alla prima chiamata watchPosition
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.requestPermissions()
        if (perm.location !== 'granted') {
          set({ error: 'Permesso GPS negato. Abilitalo nelle impostazioni.' })
          return
        }
      }

      const state = get()
      // Riusa sessione esistente o crea una nuova
      let session = state.session
      if (!session) {
        session = {
          id: Date.now().toString(),
          startedAt: new Date().toISOString(),
          points: [],
        }
      }

      // Avvia watchPosition
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000 },
        (position, err) => {
          if (err || !position) return
          const point: LivePoint = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: position.timestamp ?? Date.now(),
          }
          get().addPoint(point)
        }
      )

      set({ session, isTracking: true, watchId })
      await saveData(LIVE_SESSION_KEY, session)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Errore GPS' })
    }
  },

  stopTracking: async () => {
    const { watchId, session } = get()
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId })
    }
    if (session) {
      await saveData(LIVE_SESSION_KEY, session)
    }
    set({ isTracking: false, watchId: null })
  },

  addPoint: async (p: LivePoint) => {
    const { session } = get()
    if (!session) return

    const updatedSession: LiveSession = {
      ...session,
      points: [...session.points, p],
    }

    pointsBuffer++
    set({ session: updatedSession })

    // Salvataggio incrementale ogni 5 punti
    if (pointsBuffer >= 5) {
      pointsBuffer = 0
      await saveData(LIVE_SESSION_KEY, updatedSession)
    }
  },

  clearSession: async () => {
    const { watchId } = get()
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId })
    }
    await removeData(LIVE_SESSION_KEY)
    pointsBuffer = 0
    set({ session: null, isTracking: false, watchId: null, error: null })
  },

  saveCurrentSession: async (name: string) => {
    const { session } = get()
    if (!session || session.points.length === 0) return
    const entry: SavedLiveSession = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      points: session.points,
      distanceKm: calcDistanceKm(session.points),
    }
    const updated = [entry, ...get().savedSessions]
    set({ savedSessions: updated })
    await saveData(SAVED_SESSIONS_KEY, updated)
    await get().clearSession()
  },

  deleteSavedSession: async (id: string) => {
    const updated = get().savedSessions.filter((s) => s.id !== id)
    set({ savedSessions: updated })
    await saveData(SAVED_SESSIONS_KEY, updated)
  },

  setError: (err) => set({ error: err }),
}))
