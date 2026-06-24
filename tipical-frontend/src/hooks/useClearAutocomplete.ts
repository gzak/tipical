import { useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useSearchStore } from '../stores/searchStore';
import { useUIStore } from '../stores/uiStore';

export function useClearAutocomplete() {
  const clearSearch = useSearchStore(s => s.clearSearch);
  const clearAutocompleteUI = useUIStore(s => s.clearAutocompleteUI);
  const map = useMap();

  return useCallback(() => {
    const c = map!.getCenter()!;
    clearSearch({ latitude: c.lat(), longitude: c.lng(), zoom: map!.getZoom()! });
    clearAutocompleteUI();
  }, [map, clearSearch, clearAutocompleteUI]);
}
