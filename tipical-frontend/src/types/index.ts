export const TipSuggestion = {
  NoTips: 0,
  TipsExcludeTax: 1,
  TipsIncludeTax: 2,
} as const;

export type TipSuggestion = typeof TipSuggestion[keyof typeof TipSuggestion];

export interface Business {
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  placeTypes?: string[];
  winningPolicy?: TipSuggestion;
  winningPolicyVoteCount?: number;
}

export interface BusinessDetail {
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  photos: string[];
}

export interface TipReport {
  id: string;
  googlePlaceId: string;
  tippingPolicy: TipSuggestion;
  createdAt: string;
  updatedAt: string;
}

export interface TipReportsAggregate {
  googlePlaceId: string;
  winningPolicy?: TipSuggestion;
  winningPolicyVoteCount?: number;
  votesByPolicy: Record<TipSuggestion, number>;
  totalVotes: number;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface UserInfo {
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface TipReportRequest {
  tippingPolicy: TipSuggestion;
  name: string;
  latitude: number;
  longitude: number;
}
