import { useQuery } from '@tanstack/react-query';

interface IpLocation {
  lat: number;
  lng: number;
}

/** Returns an approximate lat/lng derived from the user's IP address.
 *  No browser permission is required. Suitable for setting an initial map
 *  center that is city-level accurate (~10–50 km).
 *  Uses ipapi.co — free tier, CORS-enabled, HTTPS. */
export function useIpGeolocation() {
  return useQuery<IpLocation>({
    queryKey: ['ipGeolocation'],
    queryFn: async () => {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error(`IP geolocation failed: ${res.status}`);
      const data = await res.json();
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        throw new Error('IP geolocation response missing coordinates');
      }
      return { lat: data.latitude as number, lng: data.longitude as number };
    },
    // Location doesn't change within a session — never refetch automatically
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}
