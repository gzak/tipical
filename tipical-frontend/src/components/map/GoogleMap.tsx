import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, MapControl, ControlPosition, useMap } from '@vis.gl/react-google-maps';
import { useUIStore } from '../../stores/uiStore';
import { useSearchStore } from '../../stores/searchStore';
import { useGeolocation } from '../../hooks';
import type { Business } from '../../types';
import { BusinessMarker, INFO_WINDOW_OFFSET } from './BusinessMarker';
import { BusinessInfoWindow, INFO_WINDOW_MAX_WIDTH_PX } from './BusinessInfoWindow';
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

// InfoWindow height: full visual stack from the pin's tip to the top of the bubble. Not just
// "34px pixelOffset + ~240px content height" — that undercounts by missing (a) Google's own
// InfoWindow chrome (the bubble reserves space at the top for its built-in close button, which
// is Google's wrapper padding, not our content) and (b) the tail/pointer triangle between the
// bubble and the pin. Measured directly from a real screenshot (using the photo area's fixed
// h-28/112px as a calibration reference) rather than estimated from Tailwind classes, which
// undercounted by roughly 60px. Drives the stack-centering floor below, and the dynamic offset
// formula in getInfoWindowVerticalOffsetPx.
const INFO_WINDOW_HEIGHT_PX = 340;

// Minimum pixels to shift the pin below viewport center so the InfoWindow above it lands roughly
// centered vertically. `panTo` centers the map on the PIN's coordinates, but the InfoWindow only
// extends upward from the pin, so without any offset the pin+InfoWindow "stack" ends up well above
// true center. Shifting the pin down by ~half the InfoWindow's height is what centers the STACK
// (not just the bare pin). Derived from INFO_WINDOW_HEIGHT_PX, rather than an independently
// hardcoded number, so the two values can't drift out of sync. This is a *floor* — confirmed
// working (170px) on tall/desktop viewports, where it's the value actually used. On short
// viewports it isn't enough on its own to also clear the header (see getInfoWindowVerticalOffsetPx
// below); it's also clamped down by BOTTOM_MARGIN_PX if the container is short enough that even
// this floor would push the pin off-screen.
const STACK_CENTERING_OFFSET_PX = Math.round(INFO_WINDOW_HEIGHT_PX / 2);

// Reserved height (px) of the two-row header at the top of the map (search bar/avatar row +
// "Search this area" button row). A static estimate rather than a live DOM measurement — the
// button isn't always rendered (e.g. during the autocomplete flow, or before the search area has
// changed), so a measurement would need this same static fallback anyway; using it unconditionally
// keeps the mobile and desktop code paths identical instead of branching on DOM availability.
const HEADER_HEIGHT_PX = 150;

// Extra breathing room below the header once the InfoWindow clears it.
const OFFSET_MARGIN_PX = 16;

// Minimum breathing room (px) to leave below the pin once it's panned, so it's never placed flush
// against (or past) the bottom edge of the map container.
const BOTTOM_MARGIN_PX = 16;

// Computes how many pixels to shift a pin below the map's true center when panning to it, so that
// the InfoWindow rendered above the pin clears the reserved header space (search bar/avatar row +
// "Search this area" button row) regardless of viewport height.
//
// After `map.panTo`/`setCenter` with a `lat` offset worth `offsetPx` px, the pin ends up
// approximately `offsetPx` px below the new viewport center on screen (shifting the center north
// leaves the pin, which stays put, further south i.e. lower on screen). So:
//   pin_screen_y ≈ containerHeight / 2 + offsetPx
// For the InfoWindow above the pin to clear the header:
//   pin_screen_y - INFO_WINDOW_HEIGHT_PX >= HEADER_HEIGHT_PX + OFFSET_MARGIN_PX
// Rearranged:
//   offsetPx >= HEADER_HEIGHT_PX + INFO_WINDOW_HEIGHT_PX + OFFSET_MARGIN_PX - containerHeight / 2
//
// On short (mobile) viewports containerHeight/2 is small, so the required offset grows well past
// the STACK_CENTERING_OFFSET_PX floor. That growth has no upper bound on its own — on a
// sufficiently short viewport (e.g. a phone in landscape) the desired offset can exceed
// containerHeight/2, which would push the pin below the bottom edge of the map entirely. The
// result is clamped so pin_screen_y never exceeds containerHeight - BOTTOM_MARGIN_PX: the pin may
// not fully clear the header on very short viewports, but it always stays on-screen, which is a
// better failure mode than panning it out of view.
function getInfoWindowVerticalOffsetPx(map: google.maps.Map): number {
  const containerHeight = map.getDiv().clientHeight;
  const requiredOffset = HEADER_HEIGHT_PX + INFO_WINDOW_HEIGHT_PX + OFFSET_MARGIN_PX - containerHeight / 2;
  const desiredOffset = Math.max(STACK_CENTERING_OFFSET_PX, requiredOffset);
  const maxOffsetPx = Math.max(0, containerHeight / 2 - BOTTOM_MARGIN_PX);
  return Math.min(desiredOffset, maxOffsetPx);
}

// Degrees of latitude per pixel at the given zoom, for converting a desired screen-pixel vertical
// offset into a `panTo`/`setCenter` latitude delta. Standard Web Mercator "degrees per pixel"
// resolution (`360 / (256 * 2^zoom)`), scaled by `cos(latitude)` for the projection's local
// vertical stretch away from the equator.
function latDegreesPerPixel(zoom: number, latitude: number): number {
  return 360 / (256 * Math.pow(2, zoom)) * Math.cos(latitude * Math.PI / 180);
}

function FitBoundsController({ businesses }: { businesses: Business[] }) {
  const map = useMap();
  const fitBoundsOnResults = useSearchStore(s => s.fitBoundsOnResults);
  const clearFitBounds = useSearchStore(s => s.clearFitBounds);
  const syncButtonBase = useSearchStore(s => s.syncButtonBase);

  const fitBoundsRef = useRef(fitBoundsOnResults);
  // eslint-disable-next-line react-hooks/refs
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
//
// Only `lat` gets a deliberate offset (to clear the header) — `lng` is always passed through as
// the pin's own exact longitude, unmodified. `panTo`/`setCenter` set an *absolute* new center, so
// passing the pin's own longitude guarantees the pin lands exactly horizontally centered on
// screen after every pan, regardless of where it started — no separate horizontal offset
// calculation is needed as long as the viewport is wider than INFO_WINDOW_MAX_WIDTH_PX (any real
// device).
function AutocompletePanController({ businesses }: { businesses: Business[] }) {
  const map = useMap();
  const fitBoundsOnResults = useSearchStore(s => s.fitBoundsOnResults);
  const clearFitBounds = useSearchStore(s => s.clearFitBounds);
  const syncButtonBase = useSearchStore(s => s.syncButtonBase);

  const fitBoundsRef = useRef(fitBoundsOnResults);
  // eslint-disable-next-line react-hooks/refs
  fitBoundsRef.current = fitBoundsOnResults;

  useEffect(() => {
    if (!map || !fitBoundsRef.current || businesses.length !== 1) return;
    clearFitBounds();

    const { latitude, longitude } = businesses[0];
    const offsetPx = getInfoWindowVerticalOffsetPx(map);
    const offsetTarget = { lat: latitude + offsetPx * latDegreesPerPixel(MAX_FIT_ZOOM, latitude), lng: longitude };

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

// Pans so a marker's InfoWindow (which opens above the pin) isn't left hidden behind the
// TOP_CENTER/TOP_LEFT/TOP_RIGHT MapControls, mirroring what AutocompletePanController already
// does for the single-autocomplete-result flow. Unlike that controller this doesn't force
// MAX_FIT_ZOOM — a marker click shouldn't change the user's current zoom level, just recenter
// around it. Pass `null` for activeMarkerId (e.g. while the autocomplete flow owns panning) to
// no-op.
function MarkerPanController({ activeMarkerId, businesses }: { activeMarkerId: string | null; businesses: Business[] }) {
  const map = useMap();
  const businessesRef = useRef(businesses);
  // eslint-disable-next-line react-hooks/refs
  businessesRef.current = businesses;

  useEffect(() => {
    if (!map || !activeMarkerId) return;
    const business = businessesRef.current.find(b => b.googlePlaceId === activeMarkerId);
    if (!business) return;

    const zoom = map.getZoom();
    if (zoom === undefined) return;
    const offsetPx = getInfoWindowVerticalOffsetPx(map);
    map.panTo({ lat: business.latitude + offsetPx * latDegreesPerPixel(zoom, business.latitude), lng: business.longitude });
  }, [map, activeMarkerId]);

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
  onMarkerClick: (id: string) => void;
  onInfoWindowClose: () => void;
}

const MapMarkers = memo(function MapMarkers({ businesses, activeMarkerId, onMarkerClick, onInfoWindowClose }: MapMarkersProps) {
  const activeBusiness = activeMarkerId
    ? businesses.find(b => b.googlePlaceId === activeMarkerId) ?? null
    : null;

  // Google computes its own default InfoWindow max width from the map container's size, which
  // varies by device and can be narrower than a fixed-width content card, causing Google's
  // `overflow: auto` content wrapper to clip anything that doesn't fit (including the CTA
  // button). `maxWidth` here is just our ceiling ask — Google may still render the bubble
  // narrower than this on a tight mobile map. The content card in BusinessInfoWindow.tsx uses
  // `w-full` rather than a fixed px width specifically so it always exactly fills whatever box
  // Google actually renders, instead of the two needing to independently compute the same
  // pixel value (which doesn't hold across devices).
  //
  // `minWidth` is set to the same value so Google's wrapper is a fixed 260px from the very first
  // paint, rather than shrink-wrapping to fit whatever content happens to be loaded yet. Without
  // it, the bubble would render narrow while BusinessInfoWindow's async photo/detail fetch is
  // still loading (nothing in the loading-skeleton state has an intrinsic width near 260px), then
  // visibly "pop" wider once the real content arrives. Pinning min=max eliminates that content-
  // dependent sizing pass entirely — `w-full` still fills whatever Google renders, so this
  // doesn't reintroduce the narrow-map clipping risk the paragraph above describes.

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
          minWidth={INFO_WINDOW_MAX_WIDTH_PX}
          maxWidth={INFO_WINDOW_MAX_WIDTH_PX}
          onCloseClick={onInfoWindowClose}
          disableAutoPan
          zIndex={50}
        >
          <BusinessInfoWindow key={activeBusiness.googlePlaceId} business={activeBusiness} />
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutocompleteOpen(!!placeId);
    if (!placeId) closeBusinessPanel();
  }, [placeId, setActiveMarkerId, closeBusinessPanel]);

  // Re-open the info window if the user reselects the same autocomplete suggestion
  // (placeId unchanged so the effect above doesn't fire, but fitBoundsOnResults resets to true).
  useEffect(() => {
    if (placeId && fitBoundsOnResults) {
      setActiveMarkerId(placeId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        gestureHandling="greedy"
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
        <MarkerPanController activeMarkerId={autocompleteOpen ? null : activeMarkerId} businesses={businesses} />
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
