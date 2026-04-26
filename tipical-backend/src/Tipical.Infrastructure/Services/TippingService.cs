using Tipical.Core.DTOs;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class TippingService(ITippingVoteRepository tippingVoteRepository, IBusinessRepository businessRepository) : ITippingService
{
    public async Task<TippingVoteResponse> SubmitVoteAsync(string googlePlaceId, string userId, TippingPolicy policy)
    {
        var business = await businessRepository.GetOrCreateAsync(googlePlaceId);
        var vote = await tippingVoteRepository.UpsertAsync(business.Id, userId, policy);

        return new TippingVoteResponse
        {
            Id = vote.Id,
            GooglePlaceId = googlePlaceId,
            TippingPolicy = vote.TippingPolicy,
            CreatedAt = vote.CreatedAt,
            UpdatedAt = vote.UpdatedAt
        };
    }

    public async Task<TippingVotesAggregateResponse> GetVotesAggregateAsync(string googlePlaceId)
    {
        var business = await businessRepository.GetByGooglePlaceIdAsync(googlePlaceId);

        var voteCounts = business?.TippingVotes
            .GroupBy(v => v.TippingPolicy)
            .ToDictionary(g => g.Key, g => g.Count())
            ?? new Dictionary<TippingPolicy, int>();

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
            GooglePlaceId = googlePlaceId,
            WinningPolicy = winningPolicy,
            WinningPolicyVoteCount = winningPolicyVoteCount,
            VotesByPolicy = voteCounts,
            TotalVotes = totalVotes
        };
    }

    public async Task<TippingVoteResponse?> GetUserVoteAsync(string googlePlaceId, string userId)
    {
        var business = await businessRepository.GetByGooglePlaceIdAsync(googlePlaceId);
        if (business == null) return null;

        var vote = business.TippingVotes.FirstOrDefault(v => v.UserId == userId);
        if (vote == null) return null;

        return new TippingVoteResponse
        {
            Id = vote.Id,
            GooglePlaceId = googlePlaceId,
            TippingPolicy = vote.TippingPolicy,
            CreatedAt = vote.CreatedAt,
            UpdatedAt = vote.UpdatedAt
        };
    }
}
