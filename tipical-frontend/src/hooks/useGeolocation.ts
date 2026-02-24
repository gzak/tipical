import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  isLoading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  /** When true, requests location immediately on mount. Default: false. */
  enabled?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
    enabled = false,
  } = options;

  const isSupported = !!navigator.geolocation;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
  });

  // Tracks whether a location request has been initiated (either via enabled:true or requestLocation())
  const [requested, setRequested] = useState(enabled);

  useEffect(() => {
    if (!requested) return;

    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const positionOptions: PositionOptions = { enableHighAccuracy, timeout, maximumAge };

    const onSuccess = (position: GeolocationPosition) => {
      setState({ position, error: null, isLoading: false });
    };

    const onError = (error: GeolocationPositionError) => {
      setState({ position: null, error, isLoading: false });
    };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(onSuccess, onError, positionOptions);
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, positionOptions);
    }
  }, [requested, enableHighAccuracy, timeout, maximumAge, watch]);

  /** Trigger a GPS location request. No-op if geolocation is unsupported. */
  const requestLocation = useCallback(() => {
    if (isSupported) setRequested(true);
  }, [isSupported]);

  return {
    isSupported,
    latitude: state.position?.coords.latitude ?? null,
    longitude: state.position?.coords.longitude ?? null,
    accuracy: state.position?.coords.accuracy ?? null,
    error: state.error,
    isLoading: state.isLoading,
    requestLocation,
  };
}
