import { useShallow } from 'zustand/react/shallow';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '../common/Sidebar';
import { TipSuggestionSelector } from '../tipping/TipSuggestionSelector';
import { useUIStore } from '../../stores/uiStore';
import { useBusinessDetail } from '../../hooks';
import type { Business } from '../../types';

interface BusinessDetailPanelProps {
  business: Business;
}

export function BusinessDetailPanel({ business }: BusinessDetailPanelProps) {
  const { showBusinessPanel, closeBusinessPanel } = useUIStore(
    useShallow(s => ({
      showBusinessPanel: s.showBusinessPanel,
      closeBusinessPanel: s.closeBusinessPanel,
    }))
  );

  const { data: detail, isLoading: detailLoading } = useBusinessDetail(business.googlePlaceId, { enabled: showBusinessPanel });

  const photos = detail?.photos ?? [];
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${business.googlePlaceId}`;

  const mapsLink = (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
    >
      Open in Google Maps
      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
    </a>
  );

  return (
    <Sidebar
      isOpen={showBusinessPanel}
      onClose={closeBusinessPanel}
      title={business.name}
      subtitle={mapsLink}
      width="sm"
    >
      <div className="space-y-3">
        {/* Photo grid */}
        {detailLoading ? (
          <div className="animate-pulse aspect-[2/1] bg-gray-100 rounded" />
        ) : photos.length > 0 && (
          <div className="grid grid-cols-2 gap-1">
            <img
              src={photos[0]}
              alt={business.name}
              className="col-span-2 w-full aspect-[2/1] object-cover rounded"
            />
            {photos.slice(1, 5).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${business.name} photo ${i + 2}`}
                className="w-full aspect-[3/2] object-cover rounded"
              />
            ))}
          </div>
        )}

        {(detailLoading || photos.length > 0) && <hr className="border-gray-200" />}

        {/* Reporting */}
        <TipSuggestionSelector business={business} />
      </div>
    </Sidebar>
  );
}
