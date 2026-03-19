import type { TrackPoint, TrackStats } from '../types'

const R = 6371 // km

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export function haversine(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function calcStats(points: TrackPoint[]): TrackStats {
  if (points.length < 2) {
    return {
      distance: 0,
      duration: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      elevGain: 0,
      elevLoss: 0,
      minElev: 0,
      maxElev: 0,
    }
  }

  let distance = 0
  let elevGain = 0
  let elevLoss = 0
  let maxSpeed = 0
  const elevations = points.map((p) => p.ele)
  const minElev = Math.min(...elevations)
  const maxElev = Math.max(...elevations)

  for (let i = 1; i < points.length; i++) {
    const d = haversine(points[i - 1], points[i])
    distance += d

    const dEle = points[i].ele - points[i - 1].ele
    if (dEle > 0) elevGain += dEle
    else elevLoss += Math.abs(dEle)

    // Speed between points (if timestamps available)
    if (points[i - 1].time && points[i].time) {
      const dt =
        (points[i].time!.getTime() - points[i - 1].time!.getTime()) / 3600000 // hours
      if (dt > 0) {
        const speed = d / dt
        if (speed > maxSpeed) maxSpeed = speed
      }
    }
  }

  const firstTime = points[0].time
  const lastTime = points[points.length - 1].time
  const duration =
    firstTime && lastTime
      ? (lastTime.getTime() - firstTime.getTime()) / 1000
      : 0

  const avgSpeed = duration > 0 ? distance / (duration / 3600) : 0

  return {
    distance: Math.round(distance * 100) / 100,
    duration,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    maxSpeed: Math.round(maxSpeed * 10) / 10,
    elevGain: Math.round(elevGain),
    elevLoss: Math.round(elevLoss),
    minElev: Math.round(minElev),
    maxElev: Math.round(maxElev),
  }
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
