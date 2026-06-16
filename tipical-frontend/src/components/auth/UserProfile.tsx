import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Button } from '../common/Button';

const SignInButton = () => {
  const setShowAuthModal = useUIStore(s => s.setShowAuthModal);
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="!rounded-full"
      onClick={() => setShowAuthModal(true)}
    >
      Sign in
    </Button>
  );
};

const ProfileDropdown = () => {
  const { user, clearAuth } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen]);

  if (!user) return null;

  const handleLogout = () => {
    clearAuth();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Generate fallback avatar color based on user name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-orange-400',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={toggleDropdown}
        className={`
          flex items-center justify-center
          w-9 h-9 sm:w-10 sm:h-10
          rounded-full
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isDropdownOpen ? 'ring-2 ring-blue-600' : 'hover:ring-2 hover:ring-gray-300'}
        `}
        aria-label="User menu"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        {user.picture && !imgError ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`
              flex w-full h-full rounded-full items-center justify-center
              text-white font-semibold text-sm
              ${getAvatarColor(user.name)}
            `}
          >
            {getInitials(user.name)}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div
          className={`
            absolute top-12 right-0
            w-[calc(100vw-2rem)] sm:w-60
            max-w-sm
            bg-white rounded-lg shadow-xl
            border border-gray-200
            z-40
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
          role="menu"
        >
          {/* User Info Section */}
          <div className="p-3 border-b border-gray-200">
            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>

          {/* Actions Section */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className={`
                w-full px-3 py-2
                text-left text-sm text-gray-700
                hover:bg-gray-100 rounded-md
                transition-colors duration-150
                flex items-center space-x-2
                min-h-[44px]
              `}
              role="menuitem"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const UserProfile = () => {
  const isAuthenticated = useAuthStore(s => !!s.token);
  return isAuthenticated ? <ProfileDropdown /> : <SignInButton />;
};
