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

        // AsNoTracking bypasses EF Core identity map, ensuring the freshly-upserted
        // row is returned rather than a stale tracked entity loaded earlier in the request.
        var report = await context.TippingVotes
            .AsNoTracking()
            .FirstOrDefaultAsync(tv => tv.BusinessId == businessId && tv.UserId == userId);
        return report!;
    }

    public async Task<Dictionary<TippingPolicy, int>> GetReportCountsByPolicyAsync(Guid businessId)
    {
        return await context.TippingVotes
            .Where(tv => tv.BusinessId == businessId)
            .GroupBy(tv => tv.TippingPolicy)
            .ToDictionaryAsync(g => g.Key, g => g.Count());
    }
}
