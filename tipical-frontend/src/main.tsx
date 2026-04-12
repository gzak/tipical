import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// Configure React Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && error.response) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
})

// Get Google OAuth Client ID from environment variables
const googleClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

if (!googleClientId) {
  console.error('VITE_GOOGLE_OAUTH_CLIENT_ID is not defined in environment variables')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
