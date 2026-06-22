import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useTipReportData } from '../../hooks';
import type { Business, TipSuggestion as TipSuggestionType } from '../../types';
import { TipSuggestion } from '../../types';

interface PolicyOption {
  policy: TipSuggestionType;
  label: string;
  selectedStyles: string;
  idleStyles: string;
}

const POLICY_OPTIONS: PolicyOption[] = [
  {
    policy: TipSuggestion.NoTips,
    label: 'No Tips',
    selectedStyles: 'bg-green-600 text-white border-green-600',
    idleStyles: 'bg-white text-green-700 border-green-300 hover:bg-green-50',
  },
  {
    policy: TipSuggestion.TipsExcludeTax,
    label: 'Tips on Subtotal',
    selectedStyles: 'bg-yellow-500 text-white border-yellow-500',
    idleStyles: 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50',
  },
  {
    policy: TipSuggestion.TipsIncludeTax,
    label: 'Tips on Total',
    selectedStyles: 'bg-red-600 text-white border-red-600',
    idleStyles: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
  },
];

interface TipSuggestionSelectorProps {
  business: Business;
}

export function TipSuggestionSelector({ business }: TipSuggestionSelectorProps) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated());
  const setShowAuthModal = useUIStore(s => s.setShowAuthModal);
  const { userReport, submitReport, isSubmitting, submitError } = useTipReportData(business);

  const handleReport = (policy: TipSuggestionType) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    submitReport(policy);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">What's the tip suggestion here?</p>
      <div className="flex flex-col gap-2">
        {POLICY_OPTIONS.map(({ policy, label, selectedStyles, idleStyles }) => {
          const isSelected = userReport?.tippingPolicy === policy;
          return (
            <button
              key={policy}
              onClick={() => handleReport(policy)}
              disabled={isSubmitting}
              aria-pressed={isSelected}
              className={`
                w-full px-4 py-2.5 rounded-lg border text-sm font-medium
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
                disabled:cursor-not-allowed disabled:opacity-60
                ${isSelected ? selectedStyles : idleStyles}
              `}
            >
              {isSelected && <span aria-hidden="true">✓ </span>}
              {label}
            </button>
          );
        })}
      </div>
      {submitError && (
        <p className="text-xs text-red-600 text-center">Failed to submit report. Please try again.</p>
      )}
      {!isAuthenticated && (
        <p className="text-xs text-gray-500 text-center">Sign in to submit a report</p>
      )}
    </div>
  );
}
