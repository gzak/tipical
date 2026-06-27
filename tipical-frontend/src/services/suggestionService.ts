import { apiClient } from './api';

export async function submitSuggestion(body: string): Promise<void> {
  await apiClient.post('/suggestions', { body });
}
