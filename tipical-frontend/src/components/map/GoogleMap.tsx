import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap as GoogleMapBase, Marker, useLoadScript } from '@react-google-maps/api';
import { useMapStore } from '../../stores/mapStore';
import { useUIStore } from '../../stores/uiStore';
import { useGeolocation } from '../../hooks';
import type { Business } from '../../types';
import { BusinessMarker } from './BusinessMarker';
import { SearchThisAreaButton } from './SearchThisAreaButton';

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const [myLocationContainer, setMyLocationContainer] = useState<HTMLDivElement | null>(null);

  // Memoized after isLoaded so google.maps.Size is available; deps array is intentionally [isLoaded].
  const userLocationIcon = useMemo(
    () => isLoaded ? { url: USER_LOCATION_ICON_URL, scaledSize: new google.maps.Size(20, 20) } : null,
    [isLoaded] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Precise GPS location — only requested when the user clicks "My Location".
  const { isSupported, latitude, longitude, isLoading: gpsLoading, requestLocation } = useGeolocation();

  // Center the map on GPS coordinates once when they first become available.
  // Reset by handleMyLocation so repeated button presses re-center.
  const gpsCenteredRef = useRef(false);
  // Stable initial center for the map prop — avoids a panTo→onCenterChanged→setCenter→panTo loop.
  const mapCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (map && latitude !== null && longitude !== null && !gpsCenteredRef.current) {
      gpsCenteredRef.current = true;
      const pos = { lat: latitude, lng: longitude };
      setCenter(pos);
      map.panTo(pos);
    }
  }, [latitude, longitude, setCenter, map]);

  const handleMyLocation = useCallback(() => {
    if (latitude !== null && longitude !== null) {
      // GPS already acquired — just re-center without re-requesting.
      const pos = { lat: latitude, lng: longitude };
      setCenter(pos);
      mapRef.current?.panTo(pos);
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
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    }),
    []
  );

  const handleLoad = useCallback((m: google.maps.Map) => {
    mapRef.current = m;
    setMap(m);
  }, []);

  useEffect(() => {
    if (!map) return;
    const container = document.createElement('div');
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(container);
    setMyLocationContainer(container);
    return () => {
      const slot = map.controls[google.maps.ControlPosition.RIGHT_BOTTOM];
      const idx = slot.getArray().indexOf(container);
      if (idx !== -1) slot.removeAt(idx);
      setMyLocationContainer(null);
    };
  }, [map]);

  // Use mapRef (not map state) so these handlers are stable references created once.
  // @react-google-maps/api attaches listeners during map init, before the map state
  // update from handleLoad has been processed — a closure over map state would capture
  // null and remain a permanent no-op, breaking the "Search this area" button.
  const handleCenterChanged = useCallback(() => {
    const c = mapRef.current?.getCenter();
    if (c) setCenter({ lat: c.lat(), lng: c.lng() });
  }, [setCenter]);

  const handleZoomChanged = useCallback(() => {
    const z = mapRef.current?.getZoom();
    if (z !== undefined) setZoom(z);
  }, [setZoom]);

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

  // Capture the initial center once. Passing a reactive store value as the center prop
  // would create a feedback loop: onCenterChanged → setCenter → new object ref → panTo → repeat.
  if (!mapCenterRef.current) mapCenterRef.current = center;

  return (
    <div className="relative w-full h-full">
      <SearchThisAreaButton />
      <GoogleMapBase
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={mapCenterRef.current}
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
            icon={userLocationIcon!}
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

      {/* My Location button — slotted into the map's RIGHT_BOTTOM control layer to avoid overlapping zoom controls */}
      {myLocationContainer && isSupported && createPortal(
        <button
          onClick={handleMyLocation}
          disabled={gpsLoading}
          title="My location"
          aria-label="Center map on my location"
          className="m-2.5 bg-white rounded-sm shadow-md p-2 hover:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
        </button>,
        myLocationContainer
      )}
    </div>
  );
}
