using Tipical.Core.DTOs;
using Tipical.Core.Models;

namespace Tipical.Core.Services;

public interface ITippingService
{
    Task<TippingVoteResponse> SubmitVoteAsync(Guid businessId, string userId, TippingPolicy policy, string googlePlaceId);
    Task<TippingVotesAggregateResponse> GetVotesAggregateAsync(Guid businessId);
    Task<TippingVoteResponse?> GetUserVoteAsync(Guid businessId, string userId);
}
