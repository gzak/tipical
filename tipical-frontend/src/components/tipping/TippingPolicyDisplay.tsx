import { useTippingData } from '../../hooks';
import type { TippingPolicy as TippingPolicyType } from '../../types';
import { TippingPolicy } from '../../types';

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

interface TippingPolicyDisplayProps {
  businessId: string;
}

export function TippingPolicyDisplay({ businessId }: TippingPolicyDisplayProps) {
  const { votes, isLoading, error } = useTippingData(businessId);

  if (isLoading) {
    return <div className="animate-pulse h-12 bg-gray-100 rounded-lg" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load tipping data.</p>;
  }

  if (!votes || votes.totalVotes === 0 || votes.winningPolicy === undefined) {
    return (
      <div className="text-center py-3">
        <p className="text-sm text-gray-500">No votes yet.</p>
        <p className="text-xs text-gray-400 mt-1">Be the first to share the tipping policy!</p>
      </div>
    );
  }

  const leadingCount = votes.winningPolicyVoteCount ?? votes.votesByPolicy[votes.winningPolicy];
  const peopleStr = votes.totalVotes === 1 ? 'person says' : 'people say';

  return (
    <div className="space-y-1.5">
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${POLICY_BADGE_STYLES[votes.winningPolicy]}`}
      >
        {POLICY_LABELS[votes.winningPolicy]}
      </span>
      <p className="text-sm text-gray-600">
        {leadingCount} of {votes.totalVotes} {peopleStr}:{' '}
        <span className="font-medium">{POLICY_LABELS[votes.winningPolicy]}</span>
      </p>
    </div>
  );
}
