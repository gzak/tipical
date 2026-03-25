import { useEffect } from 'react';
import { useIpGeolocation } from './useIpGeolocation';
import { useSearchStore } from '../stores/searchStore';

/** Initializes the store with IP-based coordinates on app load.
 *  Runs once; browser geolocation ("Near me") can overwrite later. */
export function useLocationInit() {
  const { data, isLoading } = useIpGeolocation();
  const setLocation = useSearchStore(s => s.setLocation);

  useEffect(() => {
    if (data) {
      setLocation({ latitude: data.lat, longitude: data.lng });
    }
  }, [data, setLocation]);

  return { isLoading };
}
