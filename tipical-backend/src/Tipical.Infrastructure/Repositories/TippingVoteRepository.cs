using FlexLabs.EntityFrameworkCore.Upsert;
using Microsoft.EntityFrameworkCore;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Repositories;

public class TippingVoteRepository(ApplicationDbContext context) : ITippingVoteRepository
{
    public async Task<TippingVote?> GetByBusinessAndUserAsync(Guid businessId, string userId)
    {
        return await context.TippingVotes
            .FirstOrDefaultAsync(tv => tv.BusinessId == businessId && tv.UserId == userId);
    }

    public async Task<IEnumerable<TippingVote>> GetByBusinessIdAsync(Guid businessId)
    {
        return await context.TippingVotes
            .Where(tv => tv.BusinessId == businessId)
            .ToListAsync();
    }

    public async Task<TippingVote> UpsertAsync(Guid businessId, string userId, TippingPolicy policy)
    {
        var now = DateTime.UtcNow;

        await context.TippingVotes
            .Upsert(new TippingVote
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                UserId = userId,
                TippingPolicy = policy,
                CreatedAt = now,
                UpdatedAt = now
            })
            .On(v => new { v.BusinessId, v.UserId })
            .WhenMatched(v => new TippingVote
            {
                TippingPolicy = policy,
                UpdatedAt = now
            })
            .RunAsync();

        // Retrieve the upserted vote to return
        var vote = await GetByBusinessAndUserAsync(businessId, userId);
        return vote!;
    }

    public async Task<Dictionary<TippingPolicy, int>> GetVoteCountsByPolicyAsync(Guid businessId)
    {
        return await context.TippingVotes
            .Where(tv => tv.BusinessId == businessId)
            .GroupBy(tv => tv.TippingPolicy)
            .ToDictionaryAsync(g => g.Key, g => g.Count());
    }
}
