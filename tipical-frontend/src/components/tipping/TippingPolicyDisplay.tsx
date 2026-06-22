import { useTippingData } from '../../hooks';
import type { Business } from '../../types';
import { POLICY_LABELS, POLICY_BADGE_STYLES } from '../../utils/policy';

interface TippingPolicyDisplayProps {
  business: Business;
}

export function TippingPolicyDisplay({ business }: TippingPolicyDisplayProps) {
  const { votes, isLoading, error } = useTippingData(business);

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
