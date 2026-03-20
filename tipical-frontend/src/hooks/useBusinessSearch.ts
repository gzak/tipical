import { useQuery } from '@tanstack/react-query';
import { businessService } from '../services/businessService';
import type { Business } from '../types';

interface UseBusinessSearchOptions {
  query?: string;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
}

export function useBusinessSearch({
  query,
  latitude,
  longitude,
  radius = 5000,
}: UseBusinessSearchOptions = {}) {
  const hasQuery = Boolean(query && query.trim().length > 0);
  const hasLocation = latitude != null && longitude != null;

  const roundedLat = latitude != null ? Math.round(latitude * 1e4) / 1e4 : null;
  const roundedLng = longitude != null ? Math.round(longitude * 1e4) / 1e4 : null;

  return useQuery<Business[]>({
    queryKey: ['businesses', 'search', { query, latitude: roundedLat, longitude: roundedLng, radius }],
    queryFn: () =>
      businessService.search(
        hasQuery ? query : undefined,
        hasLocation ? latitude! : undefined,
        hasLocation ? longitude! : undefined,
        radius
      ),
    enabled: hasQuery || hasLocation,
  });
}

export function useBusinessById(id: string | null) {
  return useQuery<Business>({
    queryKey: ['businesses', id],
    queryFn: () => businessService.getById(id!),
    enabled: Boolean(id),
  });
}
