using Tipical.Core.Models;

namespace Tipical.Core.Interfaces;

public interface ITippingVoteRepository
{
    Task<TippingVote?> GetByBusinessAndUserAsync(Guid businessId, string userId);
    Task<IEnumerable<TippingVote>> GetByBusinessIdAsync(Guid businessId);
    Task<TippingVote> UpsertAsync(Guid businessId, string userId, TippingPolicy policy);
    Task<Dictionary<TippingPolicy, int>> GetVoteCountsByPolicyAsync(Guid businessId);
}
