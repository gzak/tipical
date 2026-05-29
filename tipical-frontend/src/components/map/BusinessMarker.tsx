import { useCallback, useMemo } from 'react';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Business, TippingPolicy as TippingPolicyType } from '../../types';
import { TippingPolicy } from '../../types';
import { BusinessInfoWindow } from './BusinessInfoWindow';

const POLICY_COLORS: Record<TippingPolicyType | 'unknown', string> = {
  [TippingPolicy.NoTips]: '#22c55e',
  [TippingPolicy.TipsExcludeTax]: '#eab308',
  [TippingPolicy.TipsIncludeTax]: '#ef4444',
  unknown: '#9ca3af',
};

interface BusinessMarkerProps {
  business: Business;
  isActive: boolean;
  onMarkerClick: (id: string) => void;
  onInfoWindowClose: () => void;
}

export function BusinessMarker({ business, isActive, onMarkerClick, onInfoWindowClose }: BusinessMarkerProps) {
  const position = useMemo(
    () => ({ lat: business.latitude, lng: business.longitude }),
    [business.latitude, business.longitude]
  );

  const color = POLICY_COLORS[business.winningPolicy ?? 'unknown'];

  const handleClick = useCallback(
    () => onMarkerClick(business.googlePlaceId),
    [onMarkerClick, business.googlePlaceId]
  );

  return (
    <>
      <AdvancedMarker
        position={position}
        title={business.name}
        onClick={handleClick}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: '2.5px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', cursor: 'pointer' }} />
      </AdvancedMarker>

      {isActive && (
        <InfoWindow position={position} onCloseClick={onInfoWindowClose}>
          <BusinessInfoWindow business={business} onClose={onInfoWindowClose} />
        </InfoWindow>
      )}
    </>
  );
}
