using Tipical.Core.DTOs;
using Tipical.Core.Models;

namespace Tipical.Core.Services;

public interface ITippingService
{
    Task<TippingVoteResponse> SubmitVoteAsync(string googlePlaceId, string userId, TippingPolicy policy, string name, double latitude, double longitude);
    Task<TippingVotesAggregateResponse> GetVotesAggregateAsync(string googlePlaceId);
    Task<TippingVoteResponse?> GetUserVoteAsync(string googlePlaceId, string userId);
}
