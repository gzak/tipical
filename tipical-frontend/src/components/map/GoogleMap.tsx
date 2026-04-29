import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap as GoogleMapBase, Marker } from '@react-google-maps/api';
import { useUIStore } from '../../stores/uiStore';
import { useGeolocation } from '../../hooks';
import type { Business } from '../../types';
import { BusinessMarker } from './BusinessMarker';
import { SearchThisAreaButton } from './SearchThisAreaButton';

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
  isSearching?: boolean;
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
  searchBarSlot?: React.ReactNode;
  userProfileSlot?: React.ReactNode;
}

export function GoogleMap({ businesses = [], isSearching = false, initialCenter, initialZoom, searchBarSlot, userProfileSlot }: GoogleMapProps) {
  const closeBusinessPanel = useUIStore(s => s.closeBusinessPanel);

  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [myLocationContainer, setMyLocationContainer] = useState<HTMLDivElement | null>(null);
  const [searchThisAreaContainer, setSearchThisAreaContainer] = useState<HTMLDivElement | null>(null);
  const [searchBarContainer, setSearchBarContainer] = useState<HTMLDivElement | null>(null);
  const [userProfileContainer, setUserProfileContainer] = useState<HTMLDivElement | null>(null);

  // Safe to create at mount since Maps API is guaranteed loaded before this component renders
  const userLocationIcon = useMemo(
    () => ({ url: USER_LOCATION_ICON_URL, scaledSize: new google.maps.Size(20, 20) }),
    []
  );

  const { isSupported, latitude, longitude, isLoading: gpsLoading, requestLocation } = useGeolocation();

  // useGeolocation defaults to watch:false (getCurrentPosition), so this fires at most once
  useEffect(() => {
    if (map && latitude !== null && longitude !== null) {
      map.panTo({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude, map]);

  const handleMyLocation = useCallback(() => {
    if (latitude !== null && longitude !== null) {
      map?.panTo({ lat: latitude, lng: longitude });
    } else {
      requestLocation();
    }
  }, [latitude, longitude, map, requestLocation]);

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
    setMap(m);
  }, []);

  // onIdle fires after the map settles; safe to close over map state since it only fires post-load
  const handleIdle = useCallback(() => {
    const c = map?.getCenter();
    const z = map?.getZoom();
    if (c) setCenter({ lat: c.lat(), lng: c.lng() });
    if (z !== undefined) setZoom(z);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const slots: [google.maps.ControlPosition, React.Dispatch<React.SetStateAction<HTMLDivElement | null>>][] = [
      [google.maps.ControlPosition.TOP_LEFT, setSearchBarContainer],
      [google.maps.ControlPosition.TOP_CENTER, setSearchThisAreaContainer],
      [google.maps.ControlPosition.TOP_RIGHT, setUserProfileContainer],
      [google.maps.ControlPosition.RIGHT_BOTTOM, setMyLocationContainer],
    ];
    const entries = slots.map(([position, setter]) => {
      const container = document.createElement('div');
      map.controls[position].push(container);
      setter(container);
      return { position, container, setter };
    });
    return () => {
      entries.forEach(({ position, container, setter }) => {
        const slot = map.controls[position];
        const idx = slot.getArray().indexOf(container);
        if (idx !== -1) slot.removeAt(idx);
        setter(null);
      });
    };
  }, [map]);

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

  return (
    <div className="relative w-full h-full">
      <GoogleMapBase
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={initialCenter}
        zoom={initialZoom}
        options={mapOptions}
        onLoad={handleLoad}
        onIdle={handleIdle}
        onClick={handleMapClick}
      >
        {latitude !== null && longitude !== null && (
          <Marker
            position={{ lat: latitude, lng: longitude }}
            icon={userLocationIcon}
            title="Your location"
            zIndex={1000}
          />
        )}

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

      {searchBarContainer && searchBarSlot && createPortal(
        <div className="m-2.5">{searchBarSlot}</div>,
        searchBarContainer
      )}

      {searchThisAreaContainer && createPortal(
        <SearchThisAreaButton center={center} zoom={zoom} isSearching={isSearching} />,
        searchThisAreaContainer
      )}

      {userProfileContainer && userProfileSlot && createPortal(
        <div className="m-2.5">{userProfileSlot}</div>,
        userProfileContainer
      )}

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
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            </svg>
          )}
        </button>,
        myLocationContainer
      )}
    </div>
  );
}
