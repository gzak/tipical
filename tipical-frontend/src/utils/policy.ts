import { TipSuggestion } from '../types';
import type { TipSuggestion as TipSuggestionType } from '../types';

export const POLICY_LABELS: Record<TipSuggestionType, string> = {
  [TipSuggestion.NoTips]: 'No Tips',
  [TipSuggestion.TipsExcludeTax]: 'Tips on Subtotal',
  [TipSuggestion.TipsIncludeTax]: 'Tips on Total',
};

export const POLICY_BADGE_STYLES: Record<TipSuggestionType | 'unknown', string> = {
  [TipSuggestion.NoTips]: 'bg-green-100 text-green-800',
  [TipSuggestion.TipsExcludeTax]: 'bg-yellow-100 text-yellow-800',
  [TipSuggestion.TipsIncludeTax]: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
};

export const POLICY_HEX_COLORS: Record<TipSuggestionType | 'unknown', string> = {
  [TipSuggestion.NoTips]: '#22c55e',
  [TipSuggestion.TipsExcludeTax]: '#eab308',
  [TipSuggestion.TipsIncludeTax]: '#ef4444',
  unknown: '#9ca3af',
};
