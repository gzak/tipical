using Microsoft.EntityFrameworkCore;
using Tipical.Core.Interfaces;
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
        var existingVote = await GetByBusinessAndUserAsync(businessId, userId);

        if (existingVote != null)
        {
            // Update existing vote
            existingVote.TippingPolicy = policy;
            existingVote.UpdatedAt = DateTime.UtcNow;
            context.TippingVotes.Update(existingVote);
        }
        else
        {
            // Create new vote
            existingVote = new TippingVote
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                UserId = userId,
                TippingPolicy = policy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.TippingVotes.Add(existingVote);
        }

        await context.SaveChangesAsync();
        return existingVote;
    }

    public async Task<Dictionary<TippingPolicy, int>> GetVoteCountsByPolicyAsync(Guid businessId)
    {
        return await context.TippingVotes
            .Where(tv => tv.BusinessId == businessId)
            .GroupBy(tv => tv.TippingPolicy)
            .ToDictionaryAsync(g => g.Key, g => g.Count());
    }
}
