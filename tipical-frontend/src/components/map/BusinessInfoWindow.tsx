import { useUIStore } from '../../stores/uiStore';
import type { Business, TippingPolicy as TippingPolicyType } from '../../types';
import { TippingPolicy } from '../../types';

const POLICY_LABELS: Record<TippingPolicyType, string> = {
  [TippingPolicy.NoTips]: 'No Tips',
  [TippingPolicy.TipsExcludeTax]: 'Tips on Subtotal',
  [TippingPolicy.TipsIncludeTax]: 'Tips on Total',
};

const POLICY_COLORS: Record<TippingPolicyType, string> = {
  [TippingPolicy.NoTips]: 'bg-green-100 text-green-800',
  [TippingPolicy.TipsExcludeTax]: 'bg-yellow-100 text-yellow-800',
  [TippingPolicy.TipsIncludeTax]: 'bg-red-100 text-red-800',
};

interface BusinessInfoWindowProps {
  business: Business;
  onClose: () => void;
}

export function BusinessInfoWindow({ business, onClose }: BusinessInfoWindowProps) {
  const openBusinessPanel = useUIStore(s => s.openBusinessPanel);

  const handleViewDetails = () => {
    onClose();
    openBusinessPanel(business.id);
  };

  return (
    <div className="min-w-[180px] max-w-[240px] p-1">
      <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
        {business.name}
      </p>
      {business.winningPolicy !== undefined ? (
        <span
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${POLICY_COLORS[business.winningPolicy]}`}
        >
          {POLICY_LABELS[business.winningPolicy]}
        </span>
      ) : (
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 bg-gray-100 text-gray-600">
          No data yet
        </span>
      )}
      <button
        onClick={handleViewDetails}
        className="block w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
      >
        View Details →
      </button>
    </div>
  );
}
