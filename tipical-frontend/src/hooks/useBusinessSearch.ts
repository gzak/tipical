import { useQuery } from '@tanstack/react-query';
import { businessService } from '../services/businessService';
import type { Business } from '../types';

interface UseBusinessSearchOptions {
  query?: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

export function useBusinessSearch({
  query,
  latitude,
  longitude,
  radius = 5000,
}: UseBusinessSearchOptions) {
  const roundedLat = Math.round(latitude * 1e4) / 1e4;
  const roundedLng = Math.round(longitude * 1e4) / 1e4;

  return useQuery<Business[]>({
    queryKey: ['businesses', 'search', { query, latitude: roundedLat, longitude: roundedLng, radius }],
    queryFn: () => businessService.search(query?.trim() || undefined, latitude, longitude, radius),
    enabled: true,
  });
}

export function useBusinessById(id: string | null) {
  return useQuery<Business>({
    queryKey: ['businesses', id],
    queryFn: () => businessService.getById(id!),
    enabled: Boolean(id),
  });
}
