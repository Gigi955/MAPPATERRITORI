/**
 * Controlla se un punto [lat, lon] è dentro il poligono definito da coords.
 * Per linestring (percorso aperto), chiude virtualmente il poligono collegando
 * l'ultimo punto al primo. Algoritmo: Ray Casting.
 *
 * @param lat - Latitudine del punto da testare
 * @param lon - Longitudine del punto da testare
 * @param coords - Array di coordinate [lat, lon][] che definisce il confine
 */
export function pointInPolygon(
  lat: number,
  lon: number,
  coords: [number, number][]
): boolean {
  if (coords.length < 3) return false
  let inside = false
  const n = coords.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [latI, lonI] = coords[i]
    const [latJ, lonJ] = coords[j]
    const intersect =
      (latI > lat) !== (latJ > lat) &&
      lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI
    if (intersect) inside = !inside
  }
  return inside
}
