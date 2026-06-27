import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, MapControl, ControlPosition, useMap } from '@vis.gl/react-google-maps';
import { useUIStore } from '../../stores/uiStore';
import { useSearchStore } from '../../stores/searchStore';
import { useGeolocation } from '../../hooks';
import type { Business } from '../../types';
import { BusinessMarker, INFO_WINDOW_OFFSET } from './BusinessMarker';
import { BusinessInfoWindow } from './BusinessInfoWindow';
import { SearchThisAreaButton } from './SearchThisAreaButton';

const MAP_CONTAINER_STYLE: React.CSSProperties = { width: '100%', height: '100%' };
const mapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) || 'DEMO_MAP_ID';

interface GoogleMapProps {
  businesses?: Business[];
  isSearching?: boolean;
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
  placeId?: string | null;
  searchBarSlot?: React.ReactNode;
  userProfileSlot?: React.ReactNode;
}

const MAX_FIT_ZOOM = 17;
// Pixels to shift the pin below viewport center so the InfoWindow above it is centered vertically.
// InfoWindow sits ~274px above the pin tip (34px pixelOffset + ~240px content height).
// Centering: half of 274 ≈ 137px; 120px gives a slightly below-center result which feels natural.
const INFO_WINDOW_VERTICAL_OFFSET_PX = 120;

function FitBoundsController({ businesses }: { businesses: Business[] }) {
  const map = useMap();
  const fitBoundsOnResults = useSearchStore(s => s.fitBoundsOnResults);
  const clearFitBounds = useSearchStore(s => s.clearFitBounds);
  const syncButtonBase = useSearchStore(s => s.syncButtonBase);

  const fitBoundsRef = useRef(fitBoundsOnResults);
  fitBoundsRef.current = fitBoundsOnResults;

  useEffect(() => {
    if (!map || !fitBoundsRef.current || !businesses.length) return;
    clearFitBounds();

    const bounds = new google.maps.LatLngBounds();
    businesses.forEach(b => bounds.extend({ lat: b.latitude, lng: b.longitude }));
    map.fitBounds(bounds, 80);

    const listener = map.addListener('idle', () => {
      listener.remove();
      const c = map.getCenter();
      const z = map.getZoom();
      if (c && z !== undefined) {
        const clampedZoom = Math.min(z, MAX_FIT_ZOOM);
        if (clampedZoom !== z) map.setZoom(clampedZoom);
        syncButtonBase({ latitude: c.lat(), longitude: c.lng(), zoom: clampedZoom });
      }
    });

    return () => listener.remove();
  }, [businesses, map, clearFitBounds, syncButtonBase]);

  return null;
}

// Only rendered when placeId is set, so it implicitly knows it's in autocomplete mode —
// no need to pass or track placeId as a dep.
function AutocompletePanController({ businesses }: { businesses: Business[] }) {
  const map = useMap();
  const fitBoundsOnResults = useSearchStore(s => s.fitBoundsOnResults);
  const clearFitBounds = useSearchStore(s => s.clearFitBounds);
  const syncButtonBase = useSearchStore(s => s.syncButtonBase);

  const fitBoundsRef = useRef(fitBoundsOnResults);
  fitBoundsRef.current = fitBoundsOnResults;

  useEffect(() => {
    if (!map || !fitBoundsRef.current || businesses.length !== 1) return;
    clearFitBounds();

    const { latitude, longitude } = businesses[0];
    const latDegreesPerPixel = 360 / (256 * Math.pow(2, MAX_FIT_ZOOM)) * Math.cos(latitude * Math.PI / 180);
    const offsetTarget = { lat: latitude + INFO_WINDOW_VERTICAL_OFFSET_PX * latDegreesPerPixel, lng: longitude };

    if (map.getZoom() === MAX_FIT_ZOOM) {
      map.panTo(offsetTarget);
    } else {
      map.setCenter(offsetTarget);
      map.setZoom(MAX_FIT_ZOOM);
    }

    const listener = map.addListener('idle', () => {
      listener.remove();
      syncButtonBase({ latitude: map.getCenter()!.lat(), longitude: map.getCenter()!.lng(), zoom: map.getZoom()! });
    });

    return () => listener.remove();
  }, [businesses, map, clearFitBounds, syncButtonBase]);

  return null;
}

// Inner component — uses useMap() which requires being inside <Map>'s React tree
function MapPanner({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) map.panTo({ lat: latitude, lng: longitude });
  }, [map, latitude, longitude]);
  return null;
}

function UserLocationMarker({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <AdvancedMarker position={{ lat: latitude, lng: longitude }} title="Your location" zIndex={1000}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#3b82f6', border: '2px solid white', boxShadow: '0 0 0 3px rgba(59,130,246,0.3)' }} />
    </AdvancedMarker>
  );
}

interface MapMarkersProps {
  businesses: Business[];
  activeMarkerId: string | null;
  disableAutoPan: boolean;
  onMarkerClick: (id: string) => void;
  onInfoWindowClose: () => void;
}

const MapMarkers = memo(function MapMarkers({ businesses, activeMarkerId, disableAutoPan, onMarkerClick, onInfoWindowClose }: MapMarkersProps) {
  const activeBusiness = activeMarkerId
    ? businesses.find(b => b.googlePlaceId === activeMarkerId) ?? null
    : null;

  return (
    <>
      {businesses.map(business => (
        <BusinessMarker
          key={business.googlePlaceId}
          business={business}
          isActive={activeMarkerId === business.googlePlaceId}
          onMarkerClick={onMarkerClick}
        />
      ))}
      {activeBusiness && (
        <InfoWindow
          position={{ lat: activeBusiness.latitude, lng: activeBusiness.longitude }}
          pixelOffset={INFO_WINDOW_OFFSET}
          onCloseClick={onInfoWindowClose}
          disableAutoPan={disableAutoPan || undefined}
          zIndex={50}
        >
          <BusinessInfoWindow business={activeBusiness} />
        </InfoWindow>
      )}
    </>
  );
});

interface MyLocationButtonProps {
  latitude: number | null;
  longitude: number | null;
  gpsLoading: boolean;
  requestLocation: () => void;
}

function MyLocationButton({ latitude, longitude, gpsLoading, requestLocation }: MyLocationButtonProps) {
  const map = useMap();

  const handleClick = useCallback(() => {
    if (latitude !== null && longitude !== null) {
      map?.panTo({ lat: latitude, lng: longitude });
    } else {
      requestLocation();
    }
  }, [map, latitude, longitude, requestLocation]);

  return (
    <button
      onClick={handleClick}
      disabled={gpsLoading}
      title="My location"
      aria-label="Center map on my location"
      className="m-2.5 bg-white rounded-sm shadow-md p-2 hover:bg-gray-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {gpsLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-hidden="true" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
      )}
    </button>
  );
}

export function GoogleMap({ businesses = [], isSearching = false, initialCenter, initialZoom, placeId, searchBarSlot, userProfileSlot }: GoogleMapProps) {
  const closeBusinessPanel = useUIStore(s => s.closeBusinessPanel);
  const activeMarkerId = useUIStore(s => s.activeMarkerId);
  const setActiveMarkerId = useUIStore(s => s.setActiveMarkerId);
  const clearAutocompleteUI = useUIStore(s => s.clearAutocompleteUI);
  const fitBoundsOnResults = useSearchStore(s => s.fitBoundsOnResults);
  const clearSearch = useSearchStore(s => s.clearSearch);
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);
  const centerRef = useRef(initialCenter);
  const zoomRef = useRef(initialZoom);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const { isSupported, latitude, longitude, isLoading: gpsLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    setActiveMarkerId(placeId ?? null);
    setAutocompleteOpen(!!placeId);
    if (!placeId) closeBusinessPanel();
  }, [placeId, setActiveMarkerId, closeBusinessPanel]);

  // Re-open the info window if the user reselects the same autocomplete suggestion
  // (placeId unchanged so the effect above doesn't fire, but fitBoundsOnResults resets to true).
  useEffect(() => {
    if (placeId && fitBoundsOnResults) {
      setActiveMarkerId(placeId);
      setAutocompleteOpen(true);
    }
  }, [placeId, fitBoundsOnResults, setActiveMarkerId]);

  const handleMapClick = useCallback(() => {
    setActiveMarkerId(null);
    closeBusinessPanel();
  }, [setActiveMarkerId, closeBusinessPanel]);

  const handleMarkerClick = useCallback((id: string) => {
    setAutocompleteOpen(false);
    setActiveMarkerId(useUIStore.getState().activeMarkerId === id ? null : id);
  }, [setActiveMarkerId]);

  const handleInfoWindowClose = useCallback(() => {
    setAutocompleteOpen(false);
    if (placeId) {
      clearSearch({ latitude: centerRef.current.lat, longitude: centerRef.current.lng, zoom: zoomRef.current });
      clearAutocompleteUI();
    } else {
      setActiveMarkerId(null);
    }
  }, [placeId, clearSearch, clearAutocompleteUI, setActiveMarkerId]);

  return (
    <div className="relative w-full h-full">
      {!tilesLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white" role="status" aria-label="Map loading">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" aria-hidden="true" />
        </div>
      )}
      <Map
        mapId={mapId}
        defaultCenter={initialCenter}
        defaultZoom={initialZoom}
        style={MAP_CONTAINER_STYLE}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        clickableIcons={false}
        onTilesLoaded={() => setTilesLoaded(true)}
        onIdle={e => {
          const c = e.map.getCenter()!;
          const val = { lat: c.lat(), lng: c.lng() };
          const z = e.map.getZoom()!;
          setCenter(val);
          centerRef.current = val;
          setZoom(z);
          zoomRef.current = z;
        }}
        onClick={handleMapClick}
      >
        {placeId
          ? <AutocompletePanController businesses={businesses} />
          : <FitBoundsController businesses={businesses} />
        }
        {latitude !== null && longitude !== null && (
          <>
            <MapPanner latitude={latitude} longitude={longitude} />
            <UserLocationMarker latitude={latitude} longitude={longitude} />
          </>
        )}
        {tilesLoaded && (
          <MapMarkers
            businesses={businesses}
            activeMarkerId={activeMarkerId}
            disableAutoPan={autocompleteOpen}
            onMarkerClick={handleMarkerClick}
            onInfoWindowClose={handleInfoWindowClose}
          />
        )}

        {searchBarSlot && (
          <MapControl position={ControlPosition.TOP_LEFT}>
            <div className="m-2.5">{searchBarSlot}</div>
          </MapControl>
        )}

        <MapControl position={ControlPosition.TOP_CENTER}>
          <SearchThisAreaButton center={center} zoom={zoom} isSearching={isSearching} />
        </MapControl>

        {userProfileSlot && (
          <MapControl position={ControlPosition.TOP_RIGHT}>
            <div className="m-2.5">{userProfileSlot}</div>
          </MapControl>
        )}

        {isSupported && (
          <MapControl position={ControlPosition.RIGHT_BOTTOM}>
            <MyLocationButton
              latitude={latitude}
              longitude={longitude}
              gpsLoading={gpsLoading}
              requestLocation={requestLocation}
            />
          </MapControl>
        )}
      </Map>
    </div>
  );
}
