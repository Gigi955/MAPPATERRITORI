import type { GpxTrack, TrackPoint, Waypoint } from '../types'

function getTextContent(el: Element, tag: string): string {
  return el.querySelector(tag)?.textContent?.trim() ?? ''
}

export function parseGpx(xmlString: string): GpxTrack {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  // Check parse errors
  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('File GPX non valido')

  const root = doc.documentElement

  // Track name
  const name =
    getTextContent(root, 'trk > name') ||
    getTextContent(root, 'name') ||
    'Traccia senza nome'

  // Track points
  const trkpts = root.querySelectorAll('trkpt')
  const points: TrackPoint[] = []
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') ?? '0')
    const lon = parseFloat(pt.getAttribute('lon') ?? '0')
    const eleText = pt.querySelector('ele')?.textContent
    const ele = eleText ? parseFloat(eleText) : 0
    const timeText = pt.querySelector('time')?.textContent
    const time = timeText ? new Date(timeText) : undefined
    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({ lat, lon, ele, time })
    }
  })

  // Waypoints
  const wpts = root.querySelectorAll('wpt')
  const waypoints: Waypoint[] = []
  wpts.forEach((wpt) => {
    const lat = parseFloat(wpt.getAttribute('lat') ?? '0')
    const lon = parseFloat(wpt.getAttribute('lon') ?? '0')
    const wptName = getTextContent(wpt, 'name') || 'Waypoint'
    const desc = getTextContent(wpt, 'desc') || undefined
    if (!isNaN(lat) && !isNaN(lon)) {
      waypoints.push({ lat, lon, name: wptName, desc })
    }
  })

  return { name, points, waypoints }
}
