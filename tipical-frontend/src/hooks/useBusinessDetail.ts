import { useQuery } from '@tanstack/react-query';
import { businessService } from '../services/businessService';
import type { BusinessDetail } from '../types';

export function useBusinessDetail(googlePlaceId: string, options?: { enabled?: boolean }) {
  return useQuery<BusinessDetail>({
    queryKey: ['businessDetail', googlePlaceId],
    queryFn: () => businessService.getDetails(googlePlaceId),
    enabled: options?.enabled ?? true,
  });
}
