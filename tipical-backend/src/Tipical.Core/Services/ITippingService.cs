using Tipical.Core.DTOs;
using Tipical.Core.Models;

namespace Tipical.Core.Services;

public interface ITippingService
{
    Task<TippingVoteResponse?> SubmitReportAsync(string googlePlaceId, string userId, TippingPolicy policy);
    Task<TippingVotesAggregateResponse> GetReportsAggregateAsync(string googlePlaceId);
    Task<TippingVoteResponse?> GetUserReportAsync(string googlePlaceId, string userId);
}
