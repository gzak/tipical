import { useTipReportData } from '../../hooks';
import type { Business } from '../../types';
import { POLICY_LABELS, POLICY_BADGE_STYLES } from '../../utils/policy';

interface TipSuggestionDisplayProps {
  business: Business;
}

export function TipSuggestionDisplay({ business }: TipSuggestionDisplayProps) {
  const { reports, isLoading, error } = useTipReportData(business);

  if (isLoading) {
    return <div className="animate-pulse h-12 bg-gray-100 rounded-lg" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load tipping data.</p>;
  }

  if (!reports || reports.totalVotes === 0 || reports.winningPolicy === undefined) {
    return (
      <div className="text-center py-3">
        <p className="text-sm text-gray-500">No reports yet.</p>
        <p className="text-xs text-gray-400 mt-1">Be the first to share a tip suggestion!</p>
      </div>
    );
  }

  const leadingCount = reports.winningPolicyVoteCount ?? reports.votesByPolicy[reports.winningPolicy];
  const peopleStr = reports.totalVotes === 1 ? 'person says' : 'people say';

  return (
    <div className="space-y-1.5">
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${POLICY_BADGE_STYLES[reports.winningPolicy]}`}
      >
        {POLICY_LABELS[reports.winningPolicy]}
      </span>
      <p className="text-sm text-gray-600">
        {leadingCount} of {reports.totalVotes} {peopleStr}:{' '}
        <span className="font-medium">{POLICY_LABELS[reports.winningPolicy]}</span>
      </p>
    </div>
  );
}
