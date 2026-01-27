using Tipical.Core.DTOs;
using Tipical.Core.Interfaces;
using Tipical.Core.Models;

namespace Tipical.Infrastructure.Services;

public class TippingService
{
    private readonly ITippingVoteRepository _tippingVoteRepository;
    private readonly IBusinessRepository _businessRepository;

    public TippingService(ITippingVoteRepository tippingVoteRepository, IBusinessRepository businessRepository)
    {
        _tippingVoteRepository = tippingVoteRepository;
        _businessRepository = businessRepository;
    }

    public async Task<TippingVoteResponse> SubmitVoteAsync(Guid businessId, string userId, TippingPolicy policy)
    {
        // Verify business exists
        var business = await _businessRepository.GetByIdAsync(businessId);
        if (business == null)
        {
            throw new InvalidOperationException($"Business with ID {businessId} not found");
        }

        var vote = await _tippingVoteRepository.UpsertAsync(businessId, userId, policy);

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
        var voteCounts = await _tippingVoteRepository.GetVoteCountsByPolicyAsync(businessId);

        TippingPolicy? winningPolicy = null;
        int? winningPolicyVoteCount = null;
        var totalVotes = voteCounts.Sum(kvp => kvp.Value);

        if (voteCounts.Any())
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
        var vote = await _tippingVoteRepository.GetByBusinessAndUserAsync(businessId, userId);

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
