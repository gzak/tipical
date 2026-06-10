import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { businessService } from '../services/businessService';
import { radiusFromZoom } from '../utils/geo';
import type { SearchCenter } from '../stores/searchStore';
import type { Business } from '../types';

interface UseBusinessSearchOptions {
  query?: string;
  searchCenter: SearchCenter;
  placeId?: string | null;
  sessionToken?: string | null;
}

export function useBusinessSearch({ query, searchCenter, placeId, sessionToken }: UseBusinessSearchOptions) {
  const normalizedQuery = query?.trim() || undefined;
  const radius = radiusFromZoom(searchCenter.zoom);
  const roundedLat = Math.round(searchCenter.latitude * 1e4) / 1e4;
  const roundedLng = Math.round(searchCenter.longitude * 1e4) / 1e4;

  return useQuery<Business[]>({
    queryKey: placeId
      ? ['businesses', 'place', placeId, sessionToken]
      : ['businesses', 'search', { query: normalizedQuery, latitude: roundedLat, longitude: roundedLng, radius }],
    queryFn: () =>
      placeId
        ? businessService.searchByPlaceId(placeId, sessionToken!)
        : businessService.search(normalizedQuery, searchCenter.latitude, searchCenter.longitude, radius),
    placeholderData: keepPreviousData,
  });
}

export function useBusinessById(id: string | null) {
  return useQuery<Business>({
    queryKey: ['businesses', id],
    queryFn: () => businessService.getById(id!),
    enabled: Boolean(id),
  });
}
