import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Modal, Loading, ErrorMessage } from '../common';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { authService } from '../../services/authService';
import type { CredentialResponse } from '../../types';

export const GoogleAuthModal = () => {
  const showAuthModal = useUIStore((state) => state.showAuthModal);
  const setShowAuthModal = useUIStore((state) => state.setShowAuthModal);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isLoading) {
      setShowAuthModal(false);
      setError(null);
    }
  };

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Failed to authenticate with Google. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const authResponse = await authService.googleAuth(credentialResponse.credential);

      setAuth(authResponse.token, {
        userId: authResponse.userId,
        email: authResponse.email,
        name: authResponse.name,
        picture: authResponse.picture,
      });

      setShowAuthModal(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Invalid credentials. Please try again.');
        } else if (err.code === 'ECONNABORTED') {
          setError('Request timeout. Please try again.');
        } else if (err.code === 'ERR_NETWORK') {
          setError('Network error. Please check your connection.');
        } else {
          setError('Unable to sign in. Please try again later.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Failed to authenticate with Google. Please try again.');
  };

  const handleRetry = () => {
    setError(null);
  };

  return (
    <Modal
      isOpen={showAuthModal}
      onClose={handleClose}
      title="Sign In"
      size="sm"
    >
      <div className="py-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loading size="lg" text="Authenticating..." />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <ErrorMessage
              title="Authentication Failed"
              message={error}
              onRetry={handleRetry}
              showIcon
            />
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Sign in with your Google account to vote on tipping policies and contribute to the community.
            </p>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap={false}
              size="large"
              theme="outline"
              text="signin_with"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
