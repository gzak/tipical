import { useCallback, useMemo } from 'react';
import { AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Business } from '../../types';
import { BusinessInfoWindow } from './BusinessInfoWindow';
import { POLICY_HEX_COLORS } from '../../utils/policy';

const PIN_WIDTH = 22;
const PIN_HEIGHT = 32;
const PIN_CX = PIN_WIDTH / 2; // horizontal center and circle head radius

// vis.gl InfoWindow pixelOffset is a [x, y] tuple (it constructs google.maps.Size internally).
// Negative y moves the stem tip upward. PIN_HEIGHT brings the tip to the SVG top edge;
// the extra 2px accounts for the active stroke (2.5px) extending ~1.25px above that edge.
const INFO_WINDOW_OFFSET: [number, number] = [0, -(PIN_HEIGHT + 2)];

// Teardrop path derived from PIN_WIDTH/PIN_HEIGHT: circle head of radius PIN_CX at top,
// tip at bottom-center. AdvancedMarker anchors at center-bottom so the tip aligns with lat/lng.
const PIN_KO = PIN_CX * (1 - 0.5523);                         // Bezier quarter-circle offset
const PIN_TAPER_Y = PIN_CX + (PIN_HEIGHT - PIN_CX) * 0.19;    // taper control-point y
const PIN_PATH = `M${PIN_CX} 0 C${PIN_KO} 0 0 ${PIN_KO} 0 ${PIN_CX} C0 ${PIN_TAPER_Y} ${PIN_CX} ${PIN_HEIGHT} ${PIN_CX} ${PIN_HEIGHT} C${PIN_CX} ${PIN_HEIGHT} ${PIN_WIDTH} ${PIN_TAPER_Y} ${PIN_WIDTH} ${PIN_CX} C${PIN_WIDTH} ${PIN_KO} ${PIN_WIDTH - PIN_KO} 0 ${PIN_CX} 0 Z`;

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

  const color = POLICY_HEX_COLORS[business.winningPolicy ?? 'unknown'];

  const handleClick = useCallback(
    () => onMarkerClick(business.googlePlaceId),
    [onMarkerClick, business.googlePlaceId]
  );

  // Each pin needs a unique filter id to avoid SVG filter collisions between markers.
  const filterId = `pin-shadow-${business.googlePlaceId}`;

  return (
    <>
      <AdvancedMarker
        position={position}
        title={business.name}
        onClick={handleClick}
        zIndex={isActive ? 10 : 0}
      >
        <svg
          width={PIN_WIDTH}
          height={PIN_HEIGHT}
          viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`}
          style={{ cursor: 'pointer', display: 'block', overflow: 'visible' }}
        >
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation={isActive ? 3 : 1.5}
                floodColor={isActive ? color : '#000000'}
                floodOpacity={isActive ? 0.5 : 0.3}
              />
            </filter>
          </defs>
          <path
            d={PIN_PATH}
            fill={color}
            stroke="white"
            strokeWidth={isActive ? 2.5 : 1.5}
            filter={`url(#${filterId})`}
          />
          <circle cx={PIN_CX} cy={PIN_CX} r={4} fill="white" opacity={0.4} />
        </svg>
      </AdvancedMarker>

      {isActive && (
        <InfoWindow position={position} pixelOffset={INFO_WINDOW_OFFSET} onCloseClick={onInfoWindowClose}>
          <BusinessInfoWindow business={business} onClose={onInfoWindowClose} />
        </InfoWindow>
      )}
    </>
  );
}
