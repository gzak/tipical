import { apiClient } from './api';
import { AuthResponse, GoogleAuthRequest, UserInfo } from '../types';

export const authService = {
  async googleAuth(idToken: string): Promise<AuthResponse> {
    const request: GoogleAuthRequest = { idToken };
    const response = await apiClient.post<AuthResponse>('/auth/google', request);
    return response.data;
  },

  async getCurrentUser(): Promise<UserInfo> {
    const response = await apiClient.get<UserInfo>('/auth/me');
    return response.data;
  },
};
