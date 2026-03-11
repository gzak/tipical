import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap as GoogleMapBase, Marker, useLoadScript } from '@react-google-maps/api';
import { useMapStore } from '../../stores/mapStore';
import { useUIStore } from '../../stores/uiStore';
import { useGeolocation, useIpGeolocation } from '../../hooks';
import type { Business } from '../../types';
import { BusinessMarker } from './BusinessMarker';

// Stable reference — must not be recreated on each render
const LIBRARIES: ['places'] = ['places'];

const MAP_CONTAINER_STYLE: React.CSSProperties = { width: '100%', height: '100%' };

const USER_LOCATION_SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">' +
  '<circle cx="10" cy="10" r="9" fill="#3b82f6" stroke="white" stroke-width="2"/>' +
  '<circle cx="10" cy="10" r="3.5" fill="white"/>' +
  '</svg>'
);
const USER_LOCATION_ICON_URL = `data:image/svg+xml;charset=UTF-8,${USER_LOCATION_SVG}`;

interface GoogleMapProps {
  businesses?: Business[];
}

export function GoogleMap({ businesses = [] }: GoogleMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  });

  const center = useMapStore(s => s.center);
  const zoom = useMapStore(s => s.zoom);
  const setCenter = useMapStore(s => s.setCenter);
  const setZoom = useMapStore(s => s.setZoom);
  const closeBusinessPanel = useUIStore(s => s.closeBusinessPanel);

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Approximate location from the user's IP — no permission required.
  // Populates the store center on first resolve; map render is gated on center being set.
  const { data: ipLocation } = useIpGeolocation();

  // Precise GPS location — only requested when the user clicks "My Location".
  const { isSupported, latitude, longitude, isLoading: gpsLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    if (ipLocation && !center) {
      setCenter(ipLocation);
    }
  }, [ipLocation, center, setCenter]);

  // Center the map on GPS coordinates once when they first become available.
  // Reset by handleMyLocation so repeated button presses re-center.
  const gpsCenteredRef = useRef(false);
  useEffect(() => {
    if (latitude !== null && longitude !== null && !gpsCenteredRef.current) {
      gpsCenteredRef.current = true;
      setCenter({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude, setCenter]);

  const handleMyLocation = useCallback(() => {
    if (latitude !== null && longitude !== null) {
      // GPS already acquired — just re-center without re-requesting.
      setCenter({ lat: latitude, lng: longitude });
    } else {
      // First press — trigger the browser permission prompt and acquire GPS.
      gpsCenteredRef.current = false;
      requestLocation();
    }
  }, [latitude, longitude, setCenter, requestLocation]);

  const mapOptions = useMemo(
    () => ({
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    }),
    []
  );

  const handleLoad = useCallback((m: google.maps.Map) => setMap(m), []);

  const handleCenterChanged = useCallback(() => {
    const c = map?.getCenter();
    if (c) setCenter({ lat: c.lat(), lng: c.lng() });
  }, [map, setCenter]);

  const handleZoomChanged = useCallback(() => {
    const z = map?.getZoom();
    if (z !== undefined) setZoom(z);
  }, [map, setZoom]);

  const handleMapClick = useCallback(() => {
    setActiveMarkerId(null);
    closeBusinessPanel();
  }, [closeBusinessPanel]);

  const handleMarkerClick = useCallback((id: string) => {
    setActiveMarkerId(prev => (prev === id ? null : id));
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setActiveMarkerId(null);
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <p className="text-red-600 font-medium">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded || !center) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // google.maps is available from this point on
  const userLocationIcon = {
    url: USER_LOCATION_ICON_URL,
    scaledSize: new google.maps.Size(20, 20),
  };

  return (
    <div className="relative w-full h-full">
      <GoogleMapBase
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={handleLoad}
        onCenterChanged={handleCenterChanged}
        onZoomChanged={handleZoomChanged}
        onClick={handleMapClick}
      >
        {/* GPS user location blue dot — only shown after permission is granted */}
        {latitude !== null && longitude !== null && (
          <Marker
            position={{ lat: latitude, lng: longitude }}
            icon={userLocationIcon}
            title="Your location"
            zIndex={1000}
          />
        )}

        {/* Business markers */}
        {businesses.map(business => (
          <BusinessMarker
            key={business.id}
            business={business}
            isActive={activeMarkerId === business.id}
            onMarkerClick={handleMarkerClick}
            onInfoWindowClose={handleInfoWindowClose}
          />
        ))}
      </GoogleMapBase>

      {/* My Location button — mirrors Google Maps' own control */}
      {isSupported && (
        <button
          onClick={handleMyLocation}
          disabled={gpsLoading}
          title="My location"
          aria-label="Center map on my location"
          className="absolute bottom-8 right-2.5 bg-white rounded-sm shadow-md p-2 hover:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {gpsLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-hidden="true" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Material gps_fixed icon */}
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
