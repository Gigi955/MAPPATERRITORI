import { create } from 'zustand'
import { Geolocation } from '@capacitor/geolocation'
import { loadData, saveData, removeData } from './storage'
import type { LivePoint, LiveSession } from '../types'

const LIVE_SESSION_KEY = 'livesession'
let pointsBuffer = 0

interface LiveTrackState {
  session: LiveSession | null
  isTracking: boolean
  watchId: string | null
  loaded: boolean
  error: string | null

  loadSession: () => Promise<void>
  startTracking: () => Promise<void>
  stopTracking: () => Promise<void>
  addPoint: (p: LivePoint) => Promise<void>
  clearSession: () => Promise<void>
  setError: (err: string | null) => void
}

export const useLiveTrackStore = create<LiveTrackState>((set, get) => ({
  session: null,
  isTracking: false,
  watchId: null,
  loaded: false,
  error: null,

  loadSession: async () => {
    const saved = await loadData<LiveSession>(LIVE_SESSION_KEY)
    set({ session: saved ?? null, loaded: true })
  },

  startTracking: async () => {
    set({ error: null })
    try {
      // Richiedi permessi GPS
      const perm = await Geolocation.requestPermissions()
      if (perm.location !== 'granted') {
        set({ error: 'Permesso GPS negato. Abilitalo nelle impostazioni.' })
        return
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

  setError: (err) => set({ error: err }),
}))
