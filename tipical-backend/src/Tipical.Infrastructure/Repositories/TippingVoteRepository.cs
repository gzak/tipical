using Microsoft.EntityFrameworkCore;
using Tipical.Core.Interfaces;
using Tipical.Core.Models;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Repositories;

public class TippingVoteRepository : ITippingVoteRepository
{
    private readonly ApplicationDbContext _context;

    public TippingVoteRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TippingVote?> GetByBusinessAndUserAsync(Guid businessId, string userId)
    {
        return await _context.TippingVotes
            .FirstOrDefaultAsync(tv => tv.BusinessId == businessId && tv.UserId == userId);
    }

    public async Task<IEnumerable<TippingVote>> GetByBusinessIdAsync(Guid businessId)
    {
        return await _context.TippingVotes
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
            _context.TippingVotes.Update(existingVote);
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
            _context.TippingVotes.Add(existingVote);
        }

        await _context.SaveChangesAsync();
        return existingVote;
    }

    public async Task<Dictionary<TippingPolicy, int>> GetVoteCountsByPolicyAsync(Guid businessId)
    {
        var votes = await _context.TippingVotes
            .Where(tv => tv.BusinessId == businessId)
            .GroupBy(tv => tv.TippingPolicy)
            .Select(g => new { Policy = g.Key, Count = g.Count() })
            .ToListAsync();

        return votes.ToDictionary(v => v.Policy, v => v.Count);
    }
}
