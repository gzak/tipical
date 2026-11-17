import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { queryClient } from './services/api'

// iOS Safari ignores user-scalable=no; block its native pinch-zoom.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false })
}

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
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
