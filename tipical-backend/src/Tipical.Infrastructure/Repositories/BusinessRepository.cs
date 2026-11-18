using FlexLabs.EntityFrameworkCore.Upsert;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Repositories;

public class BusinessRepository(ApplicationDbContext context) : IBusinessRepository
{
    public async Task<Business?> GetByGooglePlaceIdAsync(string googlePlaceId)
    {
        return await context.Businesses
            .Include(b => b.TippingVotes)
            .SingleOrDefaultAsync(b => b.GooglePlaceId == googlePlaceId);
    }

    public async Task<Dictionary<string, Business>> GetByGooglePlaceIdsAsync(IEnumerable<string> googlePlaceIds)
    {
        return await context.Businesses
            .Where(b => googlePlaceIds.Contains(b.GooglePlaceId))
            .Include(b => b.TippingVotes)
            .ToDictionaryAsync(b => b.GooglePlaceId, b => b);
    }

    public async Task<Business> GetOrCreateAsync(string googlePlaceId, Point? location)
    {
        var business = await GetByGooglePlaceIdAsync(googlePlaceId);
        if (business is not null)
            return business;

        if (location is null)
            throw new InvalidOperationException($"Business with GooglePlaceId '{googlePlaceId}' does not exist and no location was given to create it.");

        await context.Upsert(new Business { GooglePlaceId = googlePlaceId, Location = location, LastSyncedAt = DateTimeOffset.UtcNow })
            .On(b => b.GooglePlaceId)
            .NoUpdate()
            .RunAsync();

        return await GetByGooglePlaceIdAsync(googlePlaceId)
            ?? throw new InvalidOperationException($"Business with GooglePlaceId '{googlePlaceId}' not found after upsert.");
    }

    public async Task<List<Business>> SearchNearbyAsync(double latitude, double longitude, int radiusMeters, int limit)
    {
        var searchPoint = new Point(longitude, latitude) { SRID = GeoConstants.Wgs84Srid };
        return await context.Businesses
            .Where(b => b.Location.IsWithinDistance(searchPoint, radiusMeters))
            .Include(b => b.TippingVotes)
            .OrderBy(b =>
                context.TippingVotes
                    .Where(v => v.BusinessId == b.Id)
                    .GroupBy(v => v.TippingPolicy)
                    .OrderByDescending(g => g.Count())
                    .Select(g => g.Key)
                    .First())
            .Take(limit)
            .ToListAsync();
    }

    public Task SaveChangesAsync() => context.SaveChangesAsync();

    public Task DeleteByGooglePlaceIdsAsync(IReadOnlyCollection<string> googlePlaceIds) =>
        context.Businesses.Where(b => googlePlaceIds.Contains(b.GooglePlaceId)).ExecuteDeleteAsync();
}
