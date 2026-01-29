import { apiClient } from './api';
import type { TippingVote, TippingVotesAggregate, TippingVoteRequest } from '../types';

export const tippingService = {
  async getVotes(businessId: string): Promise<TippingVotesAggregate> {
    const response = await apiClient.get<TippingVotesAggregate>(`/tipping/votes/${businessId}`);
    return response.data;
  },

  async getUserVote(businessId: string): Promise<TippingVote | null> {
    try {
      const response = await apiClient.get<TippingVote>(`/tipping/votes/${businessId}/user`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async submitVote(businessId: string, request: TippingVoteRequest): Promise<TippingVote> {
    const response = await apiClient.put<TippingVote>(`/tipping/votes/${businessId}`, request);
    return response.data;
  },
};
