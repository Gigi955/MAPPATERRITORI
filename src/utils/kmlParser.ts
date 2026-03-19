import JSZip from 'jszip'
import type { KmlPlacemark } from '../types'

function parseCoordinates(text: string): [number, number][] {
  return text
    .trim()
    .split(/\s+/)
    .map((token) => {
      const parts = token.split(',')
      const lon = parseFloat(parts[0])
      const lat = parseFloat(parts[1])
      if (isNaN(lat) || isNaN(lon)) return null
      return [lat, lon] as [number, number]
    })
    .filter((p): p is [number, number] => p !== null)
}

// KML colors are AABBGGRR hex → convert to #RRGGBB
function kmlColorToHex(kmlColor: string): string | null {
  const c = kmlColor.trim().replace('#', '')
  if (c.length !== 8) return null
  const rr = c.slice(6, 8)
  const gg = c.slice(4, 6)
  const bb = c.slice(2, 4)
  return `#${rr}${gg}${bb}`
}

// Build a map of styleId → hex color from all <Style> elements in the document
function buildStyleMap(root: Element): Map<string, string> {
  const map = new Map<string, string>()
  root.querySelectorAll('Style').forEach((style) => {
    const id = style.getAttribute('id')
    if (!id) return
    const colorEl = style.querySelector('LineStyle > color') ?? style.querySelector('PolyStyle > color')
    if (colorEl?.textContent) {
      const hex = kmlColorToHex(colorEl.textContent.trim())
      if (hex) map.set(id, hex)
    }
  })
  // Also handle <StyleMap> that point to normal styles
  root.querySelectorAll('StyleMap').forEach((styleMap) => {
    const id = styleMap.getAttribute('id')
    if (!id) return
    const normalPair = Array.from(styleMap.querySelectorAll('Pair')).find(
      (p) => p.querySelector('key')?.textContent?.trim() === 'normal'
    )
    if (!normalPair) return
    const styleUrl = normalPair.querySelector('styleUrl')?.textContent?.trim().replace('#', '')
    if (styleUrl && map.has(styleUrl)) {
      map.set(id, map.get(styleUrl)!)
    }
  })
  return map
}

function getPlacemarkColor(pm: Element, styleMap: Map<string, string>): string | undefined {
  // Try styleUrl reference
  const styleUrl = pm.querySelector('styleUrl')?.textContent?.trim().replace('#', '')
  if (styleUrl && styleMap.has(styleUrl)) return styleMap.get(styleUrl)

  // Try inline Style
  const colorEl = pm.querySelector('Style > LineStyle > color') ?? pm.querySelector('Style > PolyStyle > color')
  if (colorEl?.textContent) {
    const hex = kmlColorToHex(colorEl.textContent.trim())
    if (hex) return hex
  }

  return undefined
}

function extractPlacemarks(el: Element, result: KmlPlacemark[], styleMap: Map<string, string>): void {
  // Recurse into Folder and Document
  el.querySelectorAll(':scope > Folder, :scope > Document').forEach((child) =>
    extractPlacemarks(child, result, styleMap)
  )

  el.querySelectorAll(':scope > Placemark').forEach((pm) => {
    const name = pm.querySelector('name')?.textContent?.trim() || 'Senza nome'
    const color = getPlacemarkColor(pm, styleMap)

    // LineString
    const lineString = pm.querySelector('LineString > coordinates')
    if (lineString?.textContent) {
      const coords = parseCoordinates(lineString.textContent)
      if (coords.length > 0) {
        result.push({ name, type: 'linestring', coordinates: coords, color })
      }
    }

    // Polygon (outer boundary)
    const polygon = pm.querySelector('outerBoundaryIs > LinearRing > coordinates')
    if (polygon?.textContent) {
      const coords = parseCoordinates(polygon.textContent)
      if (coords.length > 0) {
        result.push({ name, type: 'polygon', coordinates: coords, color })
      }
    }

    // Point
    const point = pm.querySelector('Point > coordinates')
    if (point?.textContent) {
      const coords = parseCoordinates(point.textContent)
      if (coords.length > 0) {
        result.push({ name, type: 'point', coordinates: [coords[0]], color })
      }
    }

    // MultiGeometry
    pm.querySelectorAll('MultiGeometry').forEach((mg) => {
      mg.querySelectorAll('LineString > coordinates').forEach((c) => {
        if (c.textContent) {
          const coords = parseCoordinates(c.textContent)
          if (coords.length > 0) result.push({ name, type: 'linestring', coordinates: coords, color })
        }
      })
      mg.querySelectorAll('outerBoundaryIs > LinearRing > coordinates').forEach((c) => {
        if (c.textContent) {
          const coords = parseCoordinates(c.textContent)
          if (coords.length > 0) result.push({ name, type: 'polygon', coordinates: coords, color })
        }
      })
      mg.querySelectorAll('Point > coordinates').forEach((c) => {
        if (c.textContent) {
          const coords = parseCoordinates(c.textContent)
          if (coords.length > 0) result.push({ name, type: 'point', coordinates: [coords[0]], color })
        }
      })
    })
  })
}

export function parseKml(xmlString: string): { name: string; placemarks: KmlPlacemark[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('File KML non valido')

  const root = doc.documentElement

  const name =
    root.querySelector('Document > name')?.textContent?.trim() ||
    root.querySelector('name')?.textContent?.trim() ||
    'KML senza nome'

  const styleMap = buildStyleMap(root)

  const placemarks: KmlPlacemark[] = []
  const document = root.querySelector('Document')
  extractPlacemarks(document ?? root, placemarks, styleMap)

  if (placemarks.length === 0) {
    throw new Error('Nessun elemento trovato nel file KML')
  }

  return { name, placemarks }
}

export async function parseKmz(buffer: ArrayBuffer): Promise<{ name: string; placemarks: KmlPlacemark[] }> {
  const zip = await JSZip.loadAsync(buffer)
  const kmlFile = zip.file('doc.kml') ?? zip.file(/\.kml$/i)[0]
  if (!kmlFile) throw new Error('Nessun file KML trovato nel KMZ')
  const xmlString = await kmlFile.async('string')
  return parseKml(xmlString)
}
