import { useCallback, useMemo } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import type { Business, TippingPolicy as TippingPolicyType } from '../../types';
import { TippingPolicy } from '../../types';
import { BusinessInfoWindow } from './BusinessInfoWindow';

function buildIconUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const MARKER_ICON_URLS: Record<TippingPolicyType | 'unknown', string> = {
  [TippingPolicy.NoTips]: buildIconUrl('#22c55e'),
  [TippingPolicy.TipsExcludeTax]: buildIconUrl('#eab308'),
  [TippingPolicy.TipsIncludeTax]: buildIconUrl('#ef4444'),
  unknown: buildIconUrl('#9ca3af'),
};

interface BusinessMarkerProps {
  business: Business;
  isActive: boolean;
  onMarkerClick: (id: string) => void;
  onInfoWindowClose: () => void;
}

export function BusinessMarker({
  business,
  isActive,
  onMarkerClick,
  onInfoWindowClose,
}: BusinessMarkerProps) {
  const position = useMemo(
    () => ({ lat: business.latitude, lng: business.longitude }),
    [business.latitude, business.longitude]
  );

  const handleClick = useCallback(
    () => onMarkerClick(business.id),
    [onMarkerClick, business.id]
  );

  const icon = useMemo(
    () => ({
      url: MARKER_ICON_URLS[business.winningPolicy ?? 'unknown'],
      scaledSize: new google.maps.Size(28, 28),
    }),
    [business.winningPolicy]
  );

  return (
    <>
      <Marker
        position={position}
        icon={icon}
        title={business.name}
        onClick={handleClick}
      />
      {isActive && (
        <InfoWindow position={position} onCloseClick={onInfoWindowClose}>
          <BusinessInfoWindow business={business} onClose={onInfoWindowClose} />
        </InfoWindow>
      )}
    </>
  );
}
