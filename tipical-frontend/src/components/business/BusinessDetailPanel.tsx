import { Sidebar } from '../common/Sidebar';
import { TippingPolicyDisplay } from '../tipping/TippingPolicyDisplay';
import { TippingPolicySelector } from '../tipping/TippingPolicySelector';
import { useUIStore } from '../../stores/uiStore';

export function BusinessDetailPanel() {
  const selectedBusiness = useUIStore(s => s.selectedBusiness);
  const showBusinessPanel = useUIStore(s => s.showBusinessPanel);
  const closeBusinessPanel = useUIStore(s => s.closeBusinessPanel);

  return (
    <Sidebar
      isOpen={showBusinessPanel}
      onClose={closeBusinessPanel}
      title={selectedBusiness?.name}
      width="md"
    >
      {selectedBusiness && (
        <div className="space-y-6">
          {/* Business info */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{selectedBusiness.address}</p>
            {selectedBusiness.phone && (
              <p className="text-sm text-gray-600">{selectedBusiness.phone}</p>
            )}
            {selectedBusiness.website && (
              <a
                href={selectedBusiness.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {selectedBusiness.website}
              </a>
            )}
            {selectedBusiness.placeTypes && selectedBusiness.placeTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedBusiness.placeTypes.map(type => (
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
            <TippingPolicyDisplay businessId={selectedBusiness.id} />
          </div>

          <hr className="border-gray-200" />

          {/* Vote */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Cast Your Vote
            </h3>
            <TippingPolicySelector business={selectedBusiness} />
          </div>
        </div>
      )}
    </Sidebar>
  );
}
