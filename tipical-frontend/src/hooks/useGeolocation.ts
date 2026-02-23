import { useState, useEffect } from 'react';

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
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const isSupported = !!navigator.geolocation;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: isSupported,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

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
  }, [enableHighAccuracy, timeout, maximumAge, watch]);

  return {
    isSupported,
    latitude: state.position?.coords.latitude ?? null,
    longitude: state.position?.coords.longitude ?? null,
    accuracy: state.position?.coords.accuracy ?? null,
    error: state.error,
    isLoading: state.isLoading,
  };
}
