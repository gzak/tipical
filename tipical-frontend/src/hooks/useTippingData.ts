import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tippingService } from '../services/tippingService';
import { useAuthStore } from '../stores/authStore';
import type { Business, TippingVote, TippingVotesAggregate, TippingPolicy } from '../types';

export function useTippingData(googlePlaceId: string | null) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated());

  const votesQuery = useQuery<TippingVotesAggregate>({
    queryKey: ['tipping', 'votes', googlePlaceId],
    queryFn: () => tippingService.getVotes(googlePlaceId!),
    enabled: Boolean(googlePlaceId),
  });

  const userVoteQuery = useQuery<TippingVote | null>({
    queryKey: ['tipping', 'userVote', googlePlaceId],
    queryFn: () => tippingService.getUserVote(googlePlaceId!),
    enabled: Boolean(googlePlaceId) && isAuthenticated,
  });

  // Mirror the latest aggregate into every business search cache entry so map
  // pins reflect the current winning policy without a separate search refetch.
  useEffect(() => {
    if (!votesQuery.data || !googlePlaceId) return;
    const { winningPolicy, winningPolicyVoteCount } = votesQuery.data;
    queryClient.setQueriesData<Business[]>(
      { queryKey: ['businesses', 'search'], exact: false },
      (businesses) =>
        businesses?.map(b =>
          b.googlePlaceId === googlePlaceId
            ? { ...b, winningPolicy, winningPolicyVoteCount: winningPolicyVoteCount ?? undefined }
            : b
        )
    );
  }, [votesQuery.data, googlePlaceId, queryClient]);

  const submitVoteMutation = useMutation<TippingVote, Error, TippingPolicy>({
    mutationFn: (policy) =>
      tippingService.submitVote(googlePlaceId!, { tippingPolicy: policy }),
    onSuccess: (data) => {
      queryClient.setQueryData(['tipping', 'userVote', googlePlaceId], data);
      queryClient.invalidateQueries({ queryKey: ['tipping', 'votes', googlePlaceId] });
    },
  });

  return {
    votes: votesQuery.data ?? null,
    userVote: userVoteQuery.data ?? null,
    isLoading: votesQuery.isLoading || userVoteQuery.isLoading,
    error: votesQuery.error ?? userVoteQuery.error,
    submitVote: (policy: TippingPolicy) => {
      if (!googlePlaceId) return;
      submitVoteMutation.mutate(policy);
    },
    isSubmitting: submitVoteMutation.isPending,
    submitError: submitVoteMutation.error,
  };
}
