import { create } from 'zustand'
import { loadData, saveData } from './storage'
import type { GpxTrack, SavedTrack, MapLayer } from '../types'

const KEYS = {
  SAVED_TRACKS: 'saved_tracks',
  CURRENT_TRACK_ID: 'current_track_id',
}

interface GpxState {
  currentTrack: GpxTrack | null
  savedTracks: SavedTrack[]
  activeLayer: MapLayer
  loaded: boolean

  load: () => Promise<void>
  loadTrack: (track: GpxTrack) => Promise<void>
  saveTrack: (track: GpxTrack) => Promise<void>
  loadSavedTrack: (saved: SavedTrack) => void
  deleteSavedTrack: (id: string) => Promise<void>
  clearCurrentTrack: () => void
  setLayer: (layer: MapLayer) => void
}

export const useGpxStore = create<GpxState>((set, get) => ({
  currentTrack: null,
  savedTracks: [],
  activeLayer: 'osm',
  loaded: false,

  load: async () => {
    const saved = await loadData<SavedTrack[]>(KEYS.SAVED_TRACKS)
    set({ savedTracks: saved ?? [], loaded: true })
  },

  loadTrack: async (track: GpxTrack) => {
    set({ currentTrack: track })
    await get().saveTrack(track)
  },

  saveTrack: async (track: GpxTrack) => {
    const saved = get().savedTracks
    const existing = saved.find((s) => s.name === track.name)
    let updated: SavedTrack[]
    if (existing) {
      // Aggiorna se già presente con stesso nome
      updated = saved.map((s) =>
        s.name === track.name
          ? { ...s, track, loadedAt: new Date().toISOString() }
          : s
      )
    } else {
      const newEntry: SavedTrack = {
        id: crypto.randomUUID(),
        name: track.name,
        loadedAt: new Date().toISOString(),
        track,
      }
      updated = [newEntry, ...saved]
    }
    set({ savedTracks: updated })
    await saveData(KEYS.SAVED_TRACKS, updated)
  },

  loadSavedTrack: (saved: SavedTrack) => {
    set({ currentTrack: saved.track })
  },

  deleteSavedTrack: async (id: string) => {
    const updated = get().savedTracks.filter((s) => s.id !== id)
    set({ savedTracks: updated })
    await saveData(KEYS.SAVED_TRACKS, updated)
  },

  clearCurrentTrack: () => set({ currentTrack: null }),

  setLayer: (layer: MapLayer) => set({ activeLayer: layer }),
}))
