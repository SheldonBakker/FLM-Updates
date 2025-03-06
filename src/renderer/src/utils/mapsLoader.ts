/* eslint-disable prettier/prettier */
import { useEffect, useRef } from 'react'

// Fallback to hardcoded key if env variable is not available
const MAPS_API_KEY = 'AIzaSyCWBibqdDMv9SsTXzOISBOQ6tpY59ZQpnE'
const SCRIPT_ID = 'google-maps-script'

export const useGoogleMapsScript = (onLoad: () => void): void => {
  const hasScriptLoaded = useRef(false)

  useEffect(() => {
    const existingScript = document.getElementById(SCRIPT_ID)
    
    if (window.google?.maps?.places) {
      onLoad()
      return
    }

    if (existingScript || hasScriptLoaded.current) {
      return
    }

    hasScriptLoaded.current = true
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true

    window.initGoogleMaps = (): void => {
      if (window.google?.maps?.places) {
        onLoad()
      }
    }

    script.onerror = (): void => {
      console.error('Google Maps script failed to load')
      hasScriptLoaded.current = false
      delete window.initGoogleMaps
    }

    document.head.appendChild(script)

    return (): void => {
      hasScriptLoaded.current = false
      delete window.initGoogleMaps
    }
  }, [onLoad])
}

declare global {
  interface Window {
    initGoogleMaps?: () => void
  }
}
