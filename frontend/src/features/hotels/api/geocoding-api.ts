export interface GeocodeResult {
  lat: number
  lng: number
  name: string
  detectedCityName?: string
  district?: string
  displayAddress: string
}

/**
 * Normalizes city names for fuzzy comparison (e.g. "Thành phố Đà Nẵng", "TP. Đà Nẵng", "Đà Nẵng" -> "danang")
 */
export function normalizeCityName(name: string): string {
  return (name || '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(thanh pho|tp\.?|tinh)\s*/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Checks if the geocoded city name matches the user-selected city
 */
export function isCityMatch(detectedCity?: string, selectedCity?: string): boolean {
  if (!detectedCity || !selectedCity) return true
  const normDetected = normalizeCityName(detectedCity)
  const normSelected = normalizeCityName(selectedCity)
  if (!normDetected || !normSelected) return true
  return normDetected.includes(normSelected) || normSelected.includes(normDetected)
}

/**
 * Queries real-time geocoding using Photon Komoot OpenStreetMap service (Free, CORS enabled, no API key)
 */
export async function geocodeAddress(address: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const query = address.trim()
  if (!query || query.length < 3) return []

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Không thể kết nối đến máy chủ định vị địa chỉ.')

  const data = await res.json() as { features?: Array<{
    geometry?: { coordinates?: number[] }
    properties?: Record<string, string | undefined>
  }> }
  if (!data?.features || data.features.length === 0) return []

  return data.features.filter((feat) => {
    const coords = feat.geometry?.coordinates
    return Array.isArray(coords) && coords.length >= 2
      && Number.isFinite(coords[0]) && Number.isFinite(coords[1])
      && Math.abs(coords[0]) <= 180 && Math.abs(coords[1]) <= 90
  }).map((feat) => {
    const [lng, lat] = feat.geometry!.coordinates!
    const props = feat.properties || {}
    const detectedCityName = props.city || props.state || props.county || props.district
    const name = props.name || ''
    const street = props.street || ''
    const district = props.district || ''
    const displayAddress = [name, street, district, detectedCityName, props.country]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(', ')

    return {
      lat: Number(Number(lat).toFixed(6)),
      lng: Number(Number(lng).toFixed(6)),
      name,
      detectedCityName,
      district,
      displayAddress: displayAddress || name || query,
    }
  })
}
