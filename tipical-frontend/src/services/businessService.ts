import { apiClient } from './api';
import type { Business } from '../types';

export const businessService = {
  async search(query: string | undefined, latitude: number, longitude: number, radius: number): Promise<Business[]> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });
    if (query) params.append('query', query);
    const response = await apiClient.get<Business[]>(`/businesses/search?${params}`);
    return response.data;
  },

  async searchByPlaceId(placeId: string, sessionToken: string): Promise<Business[]> {
    const params = new URLSearchParams({ placeId, sessionToken });
    const response = await apiClient.get<Business[]>(`/businesses/search?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Business> {
    const response = await apiClient.get<Business>(`/businesses/${id}`);
    return response.data;
  },
};
