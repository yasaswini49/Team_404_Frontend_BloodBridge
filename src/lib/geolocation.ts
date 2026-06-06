export interface GeoCoords {
  latitude: number
  longitude: number
}

/** Get device location via the browser Geolocation API. */
export function getCurrentPosition(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
      (err) => reject(new Error(err.message || 'Unable to retrieve location')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}

/** Best-effort location capture — returns null if denied or unavailable. */
export async function tryGetLocation(): Promise<GeoCoords | null> {
  try {
    return await getCurrentPosition()
  } catch {
    return null
  }
}
