using Tipical.Core.DTOs;
using Tipical.Core.Interfaces;
using Tipical.Core.Models;

namespace Tipical.Infrastructure.Services;

public class TippingService(ITippingVoteRepository tippingVoteRepository, IBusinessRepository businessRepository)
{
    public async Task<TippingVoteResponse> SubmitVoteAsync(Guid businessId, string userId, TippingPolicy policy)
    {
        // Verify business exists
        var business = await businessRepository.GetByIdAsync(businessId);
        if (business == null)
        {
            throw new InvalidOperationException($"Business with ID {businessId} not found");
        }

        var vote = await tippingVoteRepository.UpsertAsync(businessId, userId, policy);

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
