import { useEffect, Fragment } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import type { LatLngBounds } from 'leaflet'
import L from 'leaflet'
import type { GpxTrack, MapLayer, LivePoint, KmlLayer } from '../types'
import '../utils/leafletFix'

const TILE_LAYERS: Record<MapLayer, { url: string; attribution: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com">Esri</a>',
  },
}

function FitBounds({ bounds }: { bounds: LatLngBounds | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [20, 20] })
  }, [map, bounds])
  return null
}

function FollowPosition({ position, isTracking }: { position: LivePoint | null; isTracking: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (position && isTracking) {
      map.setView([position.lat, position.lon], Math.max(map.getZoom(), 16))
    }
  }, [position, isTracking, map])
  return null
}

function MapRotator({ bearing }: { bearing: number }) {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    container.style.transform = `rotate(${-bearing}deg)`
    container.style.transformOrigin = '50% 50%'
  }, [map, bearing])
  return null
}

interface Props {
  track: GpxTrack | null
  layer: MapLayer
  livePoints?: LivePoint[]
  userPosition?: LivePoint | null
  isTracking?: boolean
  kmlLayers?: KmlLayer[]
  bearing?: number
}

export default function MapView({ track, layer, livePoints = [], userPosition = null, isTracking = false, kmlLayers = [], bearing = 0 }: Props) {
  const positions = track?.points.map((p) => [p.lat, p.lon] as [number, number]) ?? []
  const livePositions = livePoints.map((p) => [p.lat, p.lon] as [number, number])

  let bounds: LatLngBounds | null = null
  if (positions.length > 0) {
    bounds = L.latLngBounds(positions)
  }

  const tile = TILE_LAYERS[layer]

  return (
    <MapContainer
      center={[41.9, 12.5]}
      zoom={6}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer url={tile.url} attribution={tile.attribution} />

      {/* Traccia GPX caricata (rossa) */}
      {positions.length > 0 && (
        <>
          <Polyline
            positions={positions}
            pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.85 }}
          />
          <Marker position={positions[0]}>
            <Popup>Partenza</Popup>
          </Marker>
          <Marker position={positions[positions.length - 1]}>
            <Popup>Arrivo</Popup>
          </Marker>
        </>
      )}

      {/* Waypoint del GPX */}
      {track?.waypoints.map((wpt, i) => (
        <Marker key={i} position={[wpt.lat, wpt.lon]}>
          <Popup>
            <strong>{wpt.name}</strong>
            {wpt.desc && <><br />{wpt.desc}</>}
          </Popup>
        </Marker>
      ))}

      {/* Traccia live percorsa (blu) */}
      {livePositions.length > 1 && (
        <Polyline
          positions={livePositions}
          pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.9 }}
        />
      )}

      {/* Posizione attuale (cerchio blu) */}
      {userPosition && (
        <>
          {/* Aura */}
          <CircleMarker
            center={[userPosition.lat, userPosition.lon]}
            radius={14}
            pathOptions={{ color: '#2563eb', fillColor: '#93c5fd', fillOpacity: 0.35, weight: 0 }}
          />
          {/* Punto */}
          <CircleMarker
            center={[userPosition.lat, userPosition.lon]}
            radius={7}
            pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
          >
            <Popup>Sei qui</Popup>
          </CircleMarker>
        </>
      )}

      {/* Layer KML */}
      {kmlLayers.map((kml) =>
        kml.visible ? (
          <Fragment key={kml.id}>
            {kml.placemarks.map((pm, i) => {
              const key = `${kml.id}-${i}`
              const pmColor = pm.color ?? kml.color
              // Usa il numero finale nel nome (es. "Caselle 8" → "8"), altrimenti indice
              const label = /(\d+)\s*$/.exec(pm.name)?.[1] ?? String(i + 1)
              // Icona numerata (cerchio colorato con numero) al primo punto del percorso
              const numIcon = L.divIcon({
                className: '',
                html: `<div style="background:${pmColor};color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);font-family:sans-serif">${label}</div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              })

              if (pm.type === 'linestring') {
                return (
                  <Fragment key={key}>
                    <Polyline
                      positions={pm.coordinates}
                      pathOptions={{ color: pmColor, weight: 3, opacity: 0.9 }}
                    >
                      {pm.name && <Popup>{pm.name}</Popup>}
                    </Polyline>
                    {pm.coordinates[0] && (
                      <Marker position={pm.coordinates[0]} icon={numIcon}>
                        <Popup>{pm.name}</Popup>
                      </Marker>
                    )}
                  </Fragment>
                )
              }
              if (pm.type === 'polygon') {
                return (
                  <Fragment key={key}>
                    <Polygon
                      positions={pm.coordinates}
                      pathOptions={{ color: pmColor, fillColor: pmColor, fillOpacity: 0.2, weight: 2, opacity: 0.9 }}
                    >
                      {pm.name && <Popup>{pm.name}</Popup>}
                    </Polygon>
                    {pm.coordinates[0] && (
                      <Marker position={pm.coordinates[0]} icon={numIcon}>
                        <Popup>{pm.name}</Popup>
                      </Marker>
                    )}
                  </Fragment>
                )
              }
              if (pm.type === 'point' && pm.coordinates[0]) {
                return (
                  <CircleMarker
                    key={key}
                    center={pm.coordinates[0]}
                    radius={6}
                    pathOptions={{ color: pmColor, fillColor: pmColor, fillOpacity: 1, weight: 2 }}
                  >
                    <Popup>{pm.name}</Popup>
                  </CircleMarker>
                )
              }
              return null
            })}
          </Fragment>
        ) : null
      )}

      {bounds && <FitBounds bounds={bounds} />}
      <FollowPosition position={userPosition} isTracking={isTracking} />
      <MapRotator bearing={bearing} />
    </MapContainer>
  )
}
