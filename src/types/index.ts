export interface TrackPoint {
  lat: number
  lon: number
  ele: number
  time?: Date
}

export interface Waypoint {
  lat: number
  lon: number
  name: string
  desc?: string
}

export interface GpxTrack {
  name: string
  points: TrackPoint[]
  waypoints: Waypoint[]
}

export interface TrackStats {
  distance: number       // km
  duration: number       // secondi
  avgSpeed: number       // km/h
  maxSpeed: number       // km/h
  elevGain: number       // m
  elevLoss: number       // m
  minElev: number        // m
  maxElev: number        // m
}

export interface SavedTrack {
  id: string
  name: string
  loadedAt: string       // ISO
  track: GpxTrack
}

export type MapLayer = 'osm' | 'topo' | 'satellite'

export interface KmlPlacemark {
  name: string
  type: 'linestring' | 'polygon' | 'point'
  coordinates: [number, number][]  // [lat, lon]
  color?: string  // colore hex opzionale (da stile KML o assegnato automaticamente)
}

export interface KmlLayer {
  id: string
  name: string
  placemarks: KmlPlacemark[]
  color: string
  visible: boolean
}

export interface LivePoint {
  lat: number
  lon: number
  timestamp: number  // Date.now()
}

export interface LiveSession {
  id: string         // Date.now().toString()
  startedAt: string  // ISO string
  points: LivePoint[]
}
