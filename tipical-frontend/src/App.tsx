import { APIProvider, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import { useInitialLocation } from './hooks/useInitialLocation';
import { useBusinessSearch } from './hooks/useBusinessSearch';
import { SearchStoreProvider, useSearchStore } from './stores/searchStore';
import { useShallow } from 'zustand/react/shallow';
import { GoogleMap } from './components/map';
import { SearchBar, SearchResults } from './components/search';
import { BusinessDetailPanel } from './components/business';
import { UserProfile, GoogleAuthModal } from './components/auth';
import { Loading } from './components/common';

function accuracyToZoom(accuracy: number): number {
  return Math.max(10, Math.min(17, Math.round(16 - Math.log2(accuracy / 50))));
}

interface AppLayoutProps {
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

function AppLayout({ initialCenter, initialZoom }: AppLayoutProps) {
  const { searchCenter, query } = useSearchStore(
    useShallow(s => ({ searchCenter: s.searchCenter, query: s.query }))
  );

  const { data: businesses = [], isPlaceholderData } = useBusinessSearch({
    query: query.trim() || undefined,
    searchCenter,
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GoogleMap
        businesses={businesses}
        isSearching={isPlaceholderData}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        searchBarSlot={<SearchBar />}
        userProfileSlot={<UserProfile />}
      />

      <SearchResults />
      <BusinessDetailPanel />
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
