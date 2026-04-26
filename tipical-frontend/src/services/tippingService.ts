import { apiClient } from './api';
import type { TippingVote, TippingVotesAggregate, TippingVoteRequest } from '../types';

export const tippingService = {
  async getVotes(googlePlaceId: string): Promise<TippingVotesAggregate> {
    const response = await apiClient.get<TippingVotesAggregate>(`/tipping/votes/${googlePlaceId}`);
    return response.data;
  },

  async getUserVote(googlePlaceId: string): Promise<TippingVote | null> {
    try {
      const response = await apiClient.get<TippingVote>(`/tipping/votes/${googlePlaceId}/user`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async submitVote(googlePlaceId: string, request: TippingVoteRequest): Promise<TippingVote> {
    const response = await apiClient.put<TippingVote>(`/tipping/votes/${googlePlaceId}`, request);
    return response.data;
  },
};
