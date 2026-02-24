import { useCallback, useMemo, useState } from 'react';
import { GoogleMap as GoogleMapBase, Marker, useLoadScript } from '@react-google-maps/api';
import { useMapStore } from '../../stores/mapStore';
import { useUIStore } from '../../stores/uiStore';
import { useGeolocation } from '../../hooks';
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
  const closeBusinessPanel = useUIStore(s => s.closeBusinessPanel);

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const { isSupported, latitude, longitude } = useGeolocation();

  const mapOptions = useMemo(
    () => ({
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    }),
    []
  );

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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <GoogleMapBase
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={zoom}
      options={mapOptions}
      onClick={handleMapClick}
    >
      {/* User location blue dot */}
      {isSupported && latitude !== null && longitude !== null && (
        <Marker
          position={{ lat: latitude, lng: longitude }}
          icon={{
            url: USER_LOCATION_ICON_URL,
            scaledSize: new google.maps.Size(20, 20),
          }}
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
  );
}
