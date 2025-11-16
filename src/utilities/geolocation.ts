import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'

export interface LocationCoords {
  lat: number
  lon: number
}

export async function getDeviceLocation(): Promise<LocationCoords | null> {
  const isNative = Capacitor.isNativePlatform()

  if (isNative) {
    try {
      // Request permissions for native platforms
      const perm = await Geolocation.requestPermissions()
      if (perm.location !== 'granted') {
        console.warn('Geolocation permission not granted')
        return null
      }

      // Get current position
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      })
      
      return {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      }
    } catch (error) {
      console.error('Native geolocation error:', error)
      return null
    }
  }

  // Fallback for web use
  if ('geolocation' in navigator) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        (error) => {
          console.error('Web geolocation error:', error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      )
    })
  }

  return null
}
