import { TippingPolicy } from '../types';
import type { TippingPolicy as TippingPolicyType } from '../types';

export const POLICY_LABELS: Record<TippingPolicyType, string> = {
  [TippingPolicy.NoTips]: 'No Tips',
  [TippingPolicy.TipsExcludeTax]: 'Tips on Subtotal',
  [TippingPolicy.TipsIncludeTax]: 'Tips on Total',
};

export const POLICY_BADGE_STYLES: Record<TippingPolicyType, string> = {
  [TippingPolicy.NoTips]: 'bg-green-100 text-green-800',
  [TippingPolicy.TipsExcludeTax]: 'bg-yellow-100 text-yellow-800',
  [TippingPolicy.TipsIncludeTax]: 'bg-red-100 text-red-800',
};

export const POLICY_HEX_COLORS: Record<TippingPolicyType | 'unknown', string> = {
  [TippingPolicy.NoTips]: '#22c55e',
  [TippingPolicy.TipsExcludeTax]: '#eab308',
  [TippingPolicy.TipsIncludeTax]: '#ef4444',
  unknown: '#9ca3af',
};
