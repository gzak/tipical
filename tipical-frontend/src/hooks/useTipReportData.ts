import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tippingService } from '../services/tippingService';
import { useAuthStore } from '../stores/authStore';
import type { Business, TipReport, TipReportsAggregate, TipSuggestion } from '../types';

export function useTipReportData(business: Business) {
  const { googlePlaceId } = business;
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated());

  const reportsQuery = useQuery<TipReportsAggregate>({
    queryKey: ['tipping', 'votes', googlePlaceId],
    queryFn: () => tippingService.getReports(googlePlaceId),
  });

  const userReportQuery = useQuery<TipReport | null>({
    queryKey: ['tipping', 'userVote', googlePlaceId],
    queryFn: () => tippingService.getUserReport(googlePlaceId),
    enabled: isAuthenticated,
  });

  // Mirror the latest aggregate into every business search cache entry so map
  // pins reflect the current winning suggestion without a separate search refetch.
  useEffect(() => {
    if (!reportsQuery.data) return;
    const { winningPolicy, winningPolicyVoteCount } = reportsQuery.data;
    queryClient.setQueriesData<Business[]>(
      { queryKey: ['businesses', 'search'], exact: false },
      (businesses) =>
        businesses?.map(b =>
          b.googlePlaceId === googlePlaceId
            ? { ...b, winningPolicy, winningPolicyVoteCount: winningPolicyVoteCount ?? undefined }
            : b
        )
    );
  }, [reportsQuery.data, googlePlaceId, queryClient]);

  const submitReportMutation = useMutation<TipReport, Error, TipSuggestion>({
    mutationFn: (policy) =>
      tippingService.submitReport(googlePlaceId, {
        tippingPolicy: policy,
        name: business.name,
        latitude: business.latitude,
        longitude: business.longitude,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['tipping', 'userVote', googlePlaceId], data);
      queryClient.invalidateQueries({ queryKey: ['tipping', 'votes', googlePlaceId] });
    },
  });

  return {
    reports: reportsQuery.data ?? null,
    userReport: userReportQuery.data ?? null,
    isLoading: reportsQuery.isLoading || userReportQuery.isLoading,
    error: reportsQuery.error ?? userReportQuery.error,
    submitReport: (policy: TipSuggestion) => submitReportMutation.mutate(policy),
    isSubmitting: submitReportMutation.isPending,
    submitError: submitReportMutation.error,
  };
}
