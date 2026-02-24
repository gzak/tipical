import { useMemo } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import type { Business, TippingPolicy as TippingPolicyType } from '../../types';
import { TippingPolicy } from '../../types';
import { BusinessInfoWindow } from './BusinessInfoWindow';

const POLICY_COLORS: Record<TippingPolicyType, string> = {
  [TippingPolicy.NoTips]: '#22c55e',         // green
  [TippingPolicy.TipsExcludeTax]: '#eab308', // yellow
  [TippingPolicy.TipsIncludeTax]: '#ef4444', // red
};

function getMarkerIconUrl(policy?: TippingPolicyType): string {
  const color =
    policy !== undefined && policy in POLICY_COLORS
      ? POLICY_COLORS[policy]
      : '#9ca3af'; // gray for unknown

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2.5"/>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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

  const icon = useMemo(
    () => ({
      url: getMarkerIconUrl(business.winningPolicy),
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
        onClick={() => onMarkerClick(business.id)}
      />
      {isActive && (
        <InfoWindow position={position} onCloseClick={onInfoWindowClose}>
          <BusinessInfoWindow business={business} onClose={onInfoWindowClose} />
        </InfoWindow>
      )}
    </>
  );
}
