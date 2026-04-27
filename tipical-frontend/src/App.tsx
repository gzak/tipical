import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useInitialLocation } from './hooks/useInitialLocation';
import { useBusinessSearch } from './hooks/useBusinessSearch';
import { useSearchStore } from './stores/searchStore';
import { useMapStore } from './stores/mapStore';
import { GoogleMap } from './components/map';
import { SearchBar, SearchResults } from './components/search';
import { BusinessDetailPanel } from './components/business';
import { UserProfile, GoogleAuthModal } from './components/auth';
import { Loading } from './components/common';

function AppLayout() {
  const { searchCenter, query } = useSearchStore(
    useShallow(s => ({ searchCenter: s.searchCenter, query: s.query }))
  );

  const { data: businesses = [] } = useBusinessSearch({
    query: query.trim() || undefined,
    searchCenter: searchCenter!,
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <GoogleMap businesses={businesses} />

      <div className="absolute top-4 inset-x-0 z-10 flex items-center justify-center px-4">
        <SearchBar />
        <div className="absolute right-4">
          <UserProfile />
        </div>
      </div>

      <SearchResults />
      <BusinessDetailPanel />
      <GoogleAuthModal />
    </div>
  );
}

function App() {
  const initialLocation = useInitialLocation();
  const setSearchCenter = useSearchStore(s => s.setSearchCenter);
  const searchCenter = useSearchStore(s => s.searchCenter);
  const setCenter = useMapStore(s => s.setCenter);

  useEffect(() => {
    if (initialLocation) {
      const zoom = useMapStore.getState().zoom;
      setSearchCenter({ ...initialLocation, zoom });
      setCenter({ lat: initialLocation.latitude, lng: initialLocation.longitude });
    }
  }, [initialLocation, setSearchCenter, setCenter]);

  if (!searchCenter) return <Loading fullScreen />;

  return <AppLayout />;
}

export default App;
