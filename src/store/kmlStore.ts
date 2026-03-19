import { create } from 'zustand'
import type { KmlLayer, KmlPlacemark } from '../types'

const COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#14b8a6', // teal
]

interface KmlState {
  kmlLayers: KmlLayer[]
  addKmlLayer: (name: string, placemarks: KmlPlacemark[]) => void
  removeKmlLayer: (id: string) => void
  toggleKmlLayer: (id: string) => void
}

export const useKmlStore = create<KmlState>((set, get) => ({
  kmlLayers: [],

  addKmlLayer: (name: string, placemarks: KmlPlacemark[]) => {
    const layers = get().kmlLayers
    const color = COLORS[layers.length % COLORS.length]
    // Assign a distinct color to each placemark (use KML style color if present, else cycle palette)
    const coloredPlacemarks = placemarks.map((pm, i) => ({
      ...pm,
      color: COLORS[i % COLORS.length],
    }))
    const newLayer: KmlLayer = {
      id: crypto.randomUUID(),
      name,
      placemarks: coloredPlacemarks,
      color,
      visible: true,
    }
    set({ kmlLayers: [...layers, newLayer] })
  },

  removeKmlLayer: (id: string) => {
    set({ kmlLayers: get().kmlLayers.filter((l) => l.id !== id) })
  },

  toggleKmlLayer: (id: string) => {
    set({
      kmlLayers: get().kmlLayers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })
  },
}))
