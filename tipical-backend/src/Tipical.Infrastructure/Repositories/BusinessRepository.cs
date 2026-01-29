using Microsoft.EntityFrameworkCore;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Repositories;

public class BusinessRepository(ApplicationDbContext context) : IBusinessRepository
{
    public async Task<Business?> GetByIdAsync(Guid id)
    {
        return await context.Businesses
            .Include(b => b.TippingVotes)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Business?> GetByGooglePlaceIdAsync(string googlePlaceId)
    {
        return await context.Businesses
            .Include(b => b.TippingVotes)
            .FirstOrDefaultAsync(b => b.GooglePlaceId == googlePlaceId);
    }

    public async Task<Dictionary<string, Business>> GetByGooglePlaceIdsAsync(IEnumerable<string> googlePlaceIds)
    {
        return await context.Businesses
            .Where(b => googlePlaceIds.Contains(b.GooglePlaceId))
            .Include(b => b.TippingVotes)
            .ToDictionaryAsync(b => b.GooglePlaceId, b => b);
    }

    public async Task<Business> CreateAsync(Business business)
    {
        context.Businesses.Add(business);
        await context.SaveChangesAsync();

        return business;
    }
}
