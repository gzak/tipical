using Tipical.Core.DTOs;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class TippingService(ITippingVoteRepository tippingVoteRepository, IBusinessRepository businessRepository) : ITippingService
{
    public async Task<TippingVoteResponse> SubmitVoteAsync(Guid businessId, string userId, TippingPolicy policy, string googlePlaceId)
    {
        Business? business = null;

        // If businessId is provided and not empty, try to get business by ID
        if (businessId != Guid.Empty)
        {
            business = await businessRepository.GetByIdAsync(businessId);
        }

        // If not found by ID, check if business exists by googlePlaceId
        if (business == null)
        {
            business = await businessRepository.GetByGooglePlaceIdAsync(googlePlaceId);
        }

        // If still not found, create minimal business record
        if (business == null)
        {
            business = new Business
            {
                Id = Guid.NewGuid(),
                GooglePlaceId = googlePlaceId
            };
            business = await businessRepository.CreateAsync(business);
        }

        // Use resolved business ID for vote
        var vote = await tippingVoteRepository.UpsertAsync(business.Id, userId, policy);

        return new TippingVoteResponse
        {
            Id = vote.Id,
            BusinessId = vote.BusinessId,
            TippingPolicy = vote.TippingPolicy,
            CreatedAt = vote.CreatedAt,
            UpdatedAt = vote.UpdatedAt
        };
    }

    public async Task<TippingVotesAggregateResponse> GetVotesAggregateAsync(Guid businessId)
    {
        var voteCounts = await tippingVoteRepository.GetVoteCountsByPolicyAsync(businessId);

        TippingPolicy? winningPolicy = null;
        int? winningPolicyVoteCount = null;
        var totalVotes = voteCounts.Sum(kvp => kvp.Value);

        if (voteCounts.Count != 0)
        {
            var winner = voteCounts.OrderByDescending(kvp => kvp.Value).First();
            winningPolicy = winner.Key;
            winningPolicyVoteCount = winner.Value;
        }

        return new TippingVotesAggregateResponse
        {
            BusinessId = businessId,
            WinningPolicy = winningPolicy,
            WinningPolicyVoteCount = winningPolicyVoteCount,
            VotesByPolicy = voteCounts,
            TotalVotes = totalVotes
        };
    }

    public async Task<TippingVoteResponse?> GetUserVoteAsync(Guid businessId, string userId)
    {
        var vote = await tippingVoteRepository.GetByBusinessAndUserAsync(businessId, userId);

        if (vote == null) return null;

        return new TippingVoteResponse
        {
            Id = vote.Id,
            BusinessId = vote.BusinessId,
            TippingPolicy = vote.TippingPolicy,
            CreatedAt = vote.CreatedAt,
            UpdatedAt = vote.UpdatedAt
        };
    }
}
