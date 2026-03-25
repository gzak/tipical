import { useShallow } from 'zustand/react/shallow';
import { Sidebar } from '../common/Sidebar';
import { useSearchStore } from '../../stores/searchStore';
import { useUIStore } from '../../stores/uiStore';
import { useBusinessSearch } from '../../hooks/useBusinessSearch';
import { TippingPolicy } from '../../types';
import type { Business, TippingPolicy as TippingPolicyType } from '../../types';

const POLICY_LABELS: Record<TippingPolicyType, string> = {
  [TippingPolicy.NoTips]: 'No Tips',
  [TippingPolicy.TipsExcludeTax]: 'Tips on Subtotal',
  [TippingPolicy.TipsIncludeTax]: 'Tips on Total',
};

const POLICY_BADGE_STYLES: Record<TippingPolicyType, string> = {
  [TippingPolicy.NoTips]: 'bg-green-100 text-green-800',
  [TippingPolicy.TipsExcludeTax]: 'bg-yellow-100 text-yellow-800',
  [TippingPolicy.TipsIncludeTax]: 'bg-red-100 text-red-800',
};

const POLICY_RANK: Record<TippingPolicyType, number> = {
  [TippingPolicy.NoTips]: 0,
  [TippingPolicy.TipsExcludeTax]: 1,
  [TippingPolicy.TipsIncludeTax]: 2,
};

function sortByPolicy(a: Business, b: Business): number {
  const rankA = a.winningPolicy !== undefined ? POLICY_RANK[a.winningPolicy] : 999;
  const rankB = b.winningPolicy !== undefined ? POLICY_RANK[b.winningPolicy] : 999;
  return rankA - rankB;
}

export function SearchResults() {
  const { query, location, showResults, setShowResults } = useSearchStore(
    useShallow(s => ({ query: s.query, location: s.location, showResults: s.showResults, setShowResults: s.setShowResults }))
  );
  const openBusinessPanel = useUIStore(s => s.openBusinessPanel);

  const { data: businesses = [], isLoading, error } = useBusinessSearch({
    query: query.trim() || undefined,
    latitude: location!.latitude,
    longitude: location!.longitude,
  });

  const sorted = [...businesses].sort(sortByPolicy);

  return (
    <Sidebar
      isOpen={showResults}
      onClose={() => setShowResults(false)}
      title="Results"
      position="left"
      width="sm"
    >
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <p className="text-sm text-red-600">Failed to load results. Please try again.</p>
      )}

      {!isLoading && !error && sorted.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No businesses found.</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search or location.</p>
        </div>
      )}

      {!isLoading && !error && sorted.length > 0 && (
        <ul className="space-y-2">
          {sorted.map(business => (
            <li key={business.id}>
              <button
                onClick={() => openBusinessPanel(business)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{business.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{business.address}</p>
                {business.winningPolicy !== undefined && (
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${POLICY_BADGE_STYLES[business.winningPolicy]}`}
                  >
                    {POLICY_LABELS[business.winningPolicy]}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sidebar>
  );
}
