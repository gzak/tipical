import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const FALLBACK: Location = { latitude: 47.6062, longitude: -122.3321, accuracy: 5000 }; // Seattle

// Resolves an initial map center without triggering permission prompts.
// Priority: silent browser geolocation (if already granted) → IP geolocation → hardcoded fallback
export function useInitialLocation(): Location | null {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    async function resolve() {
      if (navigator.geolocation && navigator.permissions) {
        try {
          const { state } = await navigator.permissions.query({ name: 'geolocation' });
          if (state === 'granted') {
            const pos = await getBrowserPosition();
            setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
            return;
          }
        } catch {
          // Permissions API or geolocation unavailable — fall through to IP
        }
      }

      try {
        const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (!res.ok) throw new Error();
        const { location: { lat: latitude, lng: longitude }, accuracy } = await res.json();
        setLocation({ latitude, longitude, accuracy });
        return;
      } catch {
        // IP geolocation failed — fall through to hardcoded fallback
      }

      setLocation(FALLBACK);
    }

    resolve();
  }, []);

  return location;
}

function getBrowserPosition(timeout = 5000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout, maximumAge: 300_000 })
  );
}
