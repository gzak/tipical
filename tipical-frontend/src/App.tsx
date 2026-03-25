import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLocationInit } from './hooks/useLocationInit';
import { useBusinessSearch } from './hooks/useBusinessSearch';
import { useSearchStore } from './stores/searchStore';
import { useMapStore } from './stores/mapStore';
import { GoogleMap } from './components/map';
import { SearchBar, SearchResults } from './components/search';
import { BusinessDetailPanel } from './components/business';
import { UserProfile, GoogleAuthModal } from './components/auth';
import { Loading } from './components/common';

function AppLayout() {
  const { location, query } = useSearchStore(
    useShallow(s => ({ location: s.location, query: s.query }))
  );
  const setCenter = useMapStore(s => s.setCenter);

  useEffect(() => {
    setCenter({ lat: location!.latitude, lng: location!.longitude });
  }, [location, setCenter]);

  const { data: businesses = [] } = useBusinessSearch({
    query: query.trim() || undefined,
    latitude: location!.latitude,
    longitude: location!.longitude,
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
  const { isLoading } = useLocationInit();

  if (isLoading) return <Loading fullScreen />;

  return <AppLayout />;
}

export default App;
