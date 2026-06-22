import { useShallow } from 'zustand/react/shallow';
import { Sidebar } from '../common/Sidebar';
import { TippingPolicyDisplay } from '../tipping/TippingPolicyDisplay';
import { TippingPolicySelector } from '../tipping/TippingPolicySelector';
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

  const { data: detail, isLoading: detailLoading } = useBusinessDetail(business.googlePlaceId);

  return (
    <Sidebar
      isOpen={showBusinessPanel}
      onClose={closeBusinessPanel}
      title={business.name}
      width="md"
    >
      <div className="space-y-6">
        {/* Business info */}
        <div className="space-y-2">
          {detailLoading ? (
            <div className="space-y-2">
              <div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" />
              <div className="animate-pulse h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ) : (
            <>
              {detail?.address && (
                <p className="text-sm text-gray-600">{detail.address}</p>
              )}
              {detail?.phone && (
                <p className="text-sm text-gray-600">{detail.phone}</p>
              )}
              {detail?.website && (
                <a
                  href={detail.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {detail.website}
                </a>
              )}
            </>
          )}
          {business.placeTypes && business.placeTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {business.placeTypes.map(type => (
                <span
                  key={type}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-gray-200" />

        {/* Tipping policy display */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Tipping Policy
          </h3>
          <TippingPolicyDisplay business={business} />
        </div>

        <hr className="border-gray-200" />

        {/* Vote */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Cast Your Vote
          </h3>
          <TippingPolicySelector business={business} />
        </div>
      </div>
    </Sidebar>
  );
}
