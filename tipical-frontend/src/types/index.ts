export const TippingPolicy = {
  NoTips: 0,
  TipsExcludeTax: 1,
  TipsIncludeTax: 2,
} as const;

export type TippingPolicy = typeof TippingPolicy[keyof typeof TippingPolicy];

export interface Business {
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  placeTypes?: string[];
  winningPolicy?: TippingPolicy;
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

export interface TippingVote {
  id: string;
  googlePlaceId: string;
  tippingPolicy: TippingPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface TippingVotesAggregate {
  googlePlaceId: string;
  winningPolicy?: TippingPolicy;
  winningPolicyVoteCount?: number;
  votesByPolicy: Record<TippingPolicy, number>;
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

export interface TippingVoteRequest {
  tippingPolicy: TippingPolicy;
  name: string;
  latitude: number;
  longitude: number;
}
