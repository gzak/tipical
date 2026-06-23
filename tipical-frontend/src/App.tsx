import { useState, useEffect } from 'react';
import { APIProvider, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import { useInitialLocation } from './hooks/useInitialLocation';
import { useBusinessSearch } from './hooks/useBusinessSearch';
import { SearchStoreProvider, useSearchStore } from './stores/searchStore';
import { useShallow } from 'zustand/react/shallow';
import { GoogleMap } from './components/map';
import { SearchBar } from './components/search';
import { BusinessDetailPanel } from './components/business';
import { UserProfile, GoogleAuthModal } from './components/auth';
import { Loading } from './components/common';
import { useUIStore } from './stores/uiStore';
import type { Business } from './types';

function accuracyToZoom(accuracy: number): number {
  return Math.max(10, Math.min(17, Math.round(16 - Math.log2(accuracy / 50))));
}

interface AppLayoutProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

function BusinessDetailPanelWrapper() {
  const selectedBusiness = useUIStore(s => s.selectedBusiness);
  const [displayBusiness, setDisplayBusiness] = useState<Business | null>(selectedBusiness);
  useEffect(() => {
    if (selectedBusiness) setDisplayBusiness(selectedBusiness);
  }, [selectedBusiness]);

  if (!displayBusiness) return null;
  return <BusinessDetailPanel business={displayBusiness} />;
}

function AppLayout({ initialCenter, initialZoom }: AppLayoutProps) {
  const { searchCenter, query, placeId, sessionToken } = useSearchStore(
    useShallow(s => ({ searchCenter: s.searchCenter, query: s.query, placeId: s.placeId, sessionToken: s.sessionToken }))
  );

  const { data: businesses = [], isLoading, isPlaceholderData } = useBusinessSearch({
    query,
    searchCenter,
    placeId,
    sessionToken,
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GoogleMap
        businesses={businesses}
        isSearching={isLoading || isPlaceholderData}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        placeId={placeId}
        searchBarSlot={<SearchBar />}
        userProfileSlot={<UserProfile />}
      />

      <BusinessDetailPanelWrapper />
      <GoogleAuthModal />
    </div>
  );
}

function AppContent() {
  const status = useApiLoadingStatus();
  const initialLocation = useInitialLocation();

  if (status === 'FAILED' || status === 'AUTH_FAILURE') {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <p className="text-red-600 font-medium">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!initialLocation || status !== 'LOADED') return <Loading fullScreen />;

  const zoom = accuracyToZoom(initialLocation.accuracy);
  const initialCenter = { lat: initialLocation.latitude, lng: initialLocation.longitude };

  return (
    <SearchStoreProvider initialCenter={{ latitude: initialLocation.latitude, longitude: initialLocation.longitude, zoom }}>
      <AppLayout initialCenter={initialCenter} initialZoom={zoom} />
    </SearchStoreProvider>
  );
}

function App() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <AppContent />
    </APIProvider>
  );
}

export default App;
