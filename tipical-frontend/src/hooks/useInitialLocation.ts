import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
}

const FALLBACK: Location = { latitude: 47.6062, longitude: -122.3321 }; // Seattle

// Resolves an initial map center without triggering permission prompts.
// Priority: silent browser geolocation (if already granted) → IP geolocation → hardcoded fallback
export function useInitialLocation(): Location | null {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (navigator.geolocation && navigator.permissions) {
        try {
          const { state } = await navigator.permissions.query({ name: 'geolocation' });
          if (state === 'granted') {
            const pos = await getBrowserPosition();
            if (!cancelled) {
              setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
              return;
            }
          }
        } catch {
          // Permissions API or geolocation unavailable — fall through to IP
        }
      }

      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          if (!cancelled) setLocation({ latitude: data.latitude as number, longitude: data.longitude as number });
          return;
        }
      } catch {
        // IP geolocation failed — fall through to hardcoded fallback
      }

      if (!cancelled) setLocation(FALLBACK);
    }

    resolve();
    return () => { cancelled = true; };
  }, []);

  return location;
}

function getBrowserPosition(timeout = 5000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout, maximumAge: 300_000 })
  );
}
