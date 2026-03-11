export const TippingPolicy = {
  NoTips: 0,
  TipsExcludeTax: 1,
  TipsIncludeTax: 2,
} as const;

export type TippingPolicy = typeof TippingPolicy[keyof typeof TippingPolicy];

export interface Business {
  id: string;
  googlePlaceId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeTypes?: string[];
  phone?: string;
  website?: string;
  winningPolicy?: TippingPolicy;
  winningPolicyVoteCount?: number;
}

export interface TippingVote {
  id: string;
  businessId: string;
  tippingPolicy: TippingPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface TippingVotesAggregate {
  businessId: string;
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
}
