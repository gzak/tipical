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

  return useQuery<Business[]>({
    queryKey: ['businesses', 'search', { query, latitude, longitude, radius }],
    queryFn: () => {
      if (hasQuery) {
        return businessService.search(
          query!,
          hasLocation ? latitude! : undefined,
          hasLocation ? longitude! : undefined,
          radius
        );
      }
      if (hasLocation) {
        return businessService.getNearby(latitude!, longitude!, radius);
      }
      return Promise.resolve([]);
    },
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
