import { apiClient } from './api';
import type { Business } from '../types';

export const businessService = {
  async search(query: string | undefined, latitude?: number, longitude?: number, radius = 5000): Promise<Business[]> {
    const params = new URLSearchParams({ radius: radius.toString() });
    if (query) params.append('query', query);
    if (latitude !== undefined && longitude !== undefined) {
      params.append('latitude', latitude.toString());
      params.append('longitude', longitude.toString());
    }
    const response = await apiClient.get<Business[]>(`/businesses/search?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Business> {
    const response = await apiClient.get<Business>(`/businesses/${id}`);
    return response.data;
  },
};
