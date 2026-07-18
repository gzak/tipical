import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useBusinessDetail } from '../../hooks';
import { Button } from '../common/Button';
import type { Business } from '../../types';
import { POLICY_LABELS, POLICY_BADGE_STYLES } from '../../utils/policy';

interface BusinessInfoWindowProps {
  business: Business;
}

interface CarouselNavButtonProps {
  direction: 'prev' | 'next';
  onClick: (e: React.MouseEvent) => void;
}

function CarouselNavButton({ direction, onClick }: CarouselNavButtonProps) {
  const isPrev = direction === 'prev';
  return (
    <button
      aria-label={isPrev ? 'Previous photo' : 'Next photo'}
      onClick={onClick}
      className={`absolute ${isPrev ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center`}
    >
      <span className="bg-black/40 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center leading-none">
        {isPrev ? '‹' : '›'}
      </span>
    </button>
  );
}

// This card is rendered inside a Google Maps <InfoWindow>, whose own content wrapper has
// `overflow: auto` — anything wider than that wrapper gets clipped (e.g. the CTA button).
// Google computes the wrapper's actual rendered width from `maxWidth` (passed on the
// <InfoWindow> in GoogleMap.tsx) combined with the map container's own size, and can render it
// narrower than the `maxWidth` we ask for on a tight mobile map. Rather than hardcoding a card
// width and hoping it matches whatever Google decides (it doesn't reliably, across devices),
// the card below uses `w-full` so it always exactly fills whatever width Google's wrapper
// actually ends up with — this constant only caps how wide that request is in the first place.
export const INFO_WINDOW_MAX_WIDTH_PX = 260;

export function BusinessInfoWindow({ business }: BusinessInfoWindowProps) {
  const openBusinessPanel = useUIStore(s => s.openBusinessPanel);
  const setShowAuthModal = useUIStore(s => s.setShowAuthModal);
  const isAuthenticated = useAuthStore(s => !!s.token);
  const { data: detail, isLoading: detailLoading, isError: detailError } = useBusinessDetail(business.googlePlaceId);
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = detail?.photos ?? [];

  const handleCTA = () => {
    if (isAuthenticated) {
      openBusinessPanel(business);
    } else {
      setShowAuthModal(true);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(i => (i - 1 + photos.length) % photos.length);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(i => (i + 1) % photos.length);
  };

  const renderPhotoArea = () => {
    if (detailLoading) {
      return <div className="animate-pulse w-full h-28 bg-gray-200 rounded-t" />;
    }
    if (detailError) {
      return (
        <div className="h-28 rounded-t bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Photos unavailable</span>
        </div>
      );
    }
    if (photos.length > 0) {
      return (
        <div className="relative h-28 overflow-hidden rounded-t">
          <img
            src={photos[photoIndex]}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          {photos.length > 1 && (
            <>
              <CarouselNavButton direction="prev" onClick={prevPhoto} />
              <CarouselNavButton direction="next" onClick={nextPhoto} />
              <span className="absolute bottom-1 right-1 bg-black/40 text-white text-xs rounded px-1">
                {photoIndex + 1}/{photos.length}
              </span>
            </>
          )}
        </div>
      );
    }
    return (
      <div className="h-28 rounded-t bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-xs">No photos</span>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderPhotoArea()}

      <div className="p-2">
        <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
          {business.name}
        </p>

        {detailLoading ? (
          <div className="animate-pulse h-3 bg-gray-100 rounded w-20 mb-2" />
        ) : detail?.rating != null ? (
          <p className="text-xs text-gray-500 mb-2">
            ★ {detail.rating.toFixed(1)}
            {detail.reviewCount != null && (
              <span className="ml-1">· {detail.reviewCount.toLocaleString()} reviews</span>
            )}
          </p>
        ) : null}

        {business.winningPolicy !== undefined ? (
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${POLICY_BADGE_STYLES[business.winningPolicy]}`}
          >
            {POLICY_LABELS[business.winningPolicy]}
          </span>
        ) : (
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${POLICY_BADGE_STYLES.unknown}`}>
            No reports
          </span>
        )}

        {business.winningPolicyVoteCount != null && business.winningPolicyVoteCount > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 mb-1">
            Based on {business.winningPolicyVoteCount}{' '}
            {business.winningPolicyVoteCount === 1 ? 'report' : 'reports'}
          </p>
        )}

        <Button
          variant={isAuthenticated ? 'primary' : 'secondary'}
          size="sm"
          fullWidth
          onClick={handleCTA}
          aria-label={isAuthenticated ? `Report for ${business.name}` : `Sign in to report for ${business.name}`}
          className="mt-2"
        >
          {isAuthenticated ? 'Report' : 'Sign in to report'}
        </Button>
      </div>
    </div>
  );
}
