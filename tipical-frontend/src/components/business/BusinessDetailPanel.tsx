import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Sidebar } from '../common/Sidebar';
import { TippingPolicyDisplay } from '../tipping/TippingPolicyDisplay';
import { TippingPolicySelector } from '../tipping/TippingPolicySelector';
import { useUIStore } from '../../stores/uiStore';

export function BusinessDetailPanel() {
  const { selectedBusiness, showBusinessPanel, closeBusinessPanel } = useUIStore(
    useShallow(s => ({
      selectedBusiness: s.selectedBusiness,
      showBusinessPanel: s.showBusinessPanel,
      closeBusinessPanel: s.closeBusinessPanel,
    }))
  );

  // Preserve last business so content stays visible during the close animation
  const [displayBusiness, setDisplayBusiness] = useState(selectedBusiness);
  useEffect(() => {
    if (selectedBusiness) setDisplayBusiness(selectedBusiness);
  }, [selectedBusiness]);

  return (
    <Sidebar
      isOpen={showBusinessPanel}
      onClose={closeBusinessPanel}
      title={displayBusiness?.name}
      width="md"
    >
      {displayBusiness && (
        <div className="space-y-6">
          {/* Business info */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{displayBusiness.address}</p>
            {displayBusiness.phone && (
              <p className="text-sm text-gray-600">{displayBusiness.phone}</p>
            )}
            {displayBusiness.website && (
              <a
                href={displayBusiness.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {displayBusiness.website}
              </a>
            )}
            {displayBusiness.placeTypes && displayBusiness.placeTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {displayBusiness.placeTypes.map(type => (
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
            <TippingPolicyDisplay business={displayBusiness} />
          </div>

          <hr className="border-gray-200" />

          {/* Vote */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Cast Your Vote
            </h3>
            <TippingPolicySelector business={displayBusiness} />
          </div>
        </div>
      )}
    </Sidebar>
  );
}
