import { apiClient } from './api';
import type { TipReport, TipReportsAggregate, TipReportRequest } from '../types';

export const tippingService = {
  async getReports(googlePlaceId: string): Promise<TipReportsAggregate> {
    const response = await apiClient.get<TipReportsAggregate>(`/tipping/votes/${googlePlaceId}`);
    return response.data;
  },

  async getUserReport(googlePlaceId: string): Promise<TipReport | null> {
    try {
      const response = await apiClient.get<TipReport>(`/tipping/votes/${googlePlaceId}/user`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async submitReport(googlePlaceId: string, request: TipReportRequest): Promise<TipReport> {
    const response = await apiClient.put<TipReport>(`/tipping/votes/${googlePlaceId}`, request);
    return response.data;
  },
};
