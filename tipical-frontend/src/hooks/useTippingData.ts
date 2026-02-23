import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tippingService } from '../services/tippingService';
import { useAuthStore } from '../stores/authStore';
import type { TippingVote, TippingVotesAggregate, TippingPolicy } from '../types';

export function useTippingData(businessId: string | null) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated());

  const votesQuery = useQuery<TippingVotesAggregate>({
    queryKey: ['tipping', 'votes', businessId],
    queryFn: () => tippingService.getVotes(businessId!),
    enabled: Boolean(businessId),
  });

  const userVoteQuery = useQuery<TippingVote | null>({
    queryKey: ['tipping', 'userVote', businessId],
    queryFn: () => tippingService.getUserVote(businessId!),
    enabled: Boolean(businessId) && isAuthenticated,
  });

  const submitVoteMutation = useMutation<
    TippingVote,
    Error,
    { policy: TippingPolicy; businessId: string }
  >({
    mutationFn: ({ policy, businessId: id }) =>
      tippingService.submitVote(id, { tippingPolicy: policy }),
    onSuccess: (_data, { businessId: id }) => {
      queryClient.invalidateQueries({ queryKey: ['tipping', 'votes', id] });
      queryClient.invalidateQueries({ queryKey: ['tipping', 'userVote', id] });
    },
  });

  return {
    votes: votesQuery.data ?? null,
    userVote: userVoteQuery.data ?? null,
    isLoading: votesQuery.isLoading || userVoteQuery.isLoading,
    error: votesQuery.error ?? userVoteQuery.error,
    submitVote: (policy: TippingPolicy) => {
      if (!businessId) return;
      submitVoteMutation.mutate({ policy, businessId });
    },
    isSubmitting: submitVoteMutation.isPending,
    submitError: submitVoteMutation.error,
  };
}
