import { apiClient } from './api';
import type { Business } from '../types';

export const businessService = {
  async search(query: string, latitude?: number, longitude?: number, radius = 5000): Promise<Business[]> {
    const params = new URLSearchParams({ query, radius: radius.toString() });
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

  async getNearby(latitude: number, longitude: number, radius = 5000): Promise<Business[]> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });
    const response = await apiClient.get<Business[]>(`/businesses/nearby?${params}`);
    return response.data;
  },
};
