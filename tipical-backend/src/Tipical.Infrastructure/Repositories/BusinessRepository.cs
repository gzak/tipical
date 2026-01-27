using Microsoft.EntityFrameworkCore;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using Tipical.Core.Interfaces;
using Tipical.Core.Models;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Repositories;

public class BusinessRepository(ApplicationDbContext context) : IBusinessRepository
{
    private static readonly GeometryFactory GeometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

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

    public async Task<IEnumerable<Business>> GetNearbyAsync(double latitude, double longitude, int radiusMeters)
    {
        var point = GeometryFactory.CreatePoint(new Coordinate(longitude, latitude));

        var businesses = await context.Businesses
            .Where(b => b.Location != null && b.Location.Distance(point) <= radiusMeters)
            .OrderBy(b => b.Location!.Distance(point))
            .Include(b => b.TippingVotes)
            .ToListAsync();

        return businesses;
    }

    public async Task<Business> CreateAsync(Business business)
    {
        // Create PostGIS point from latitude/longitude
        business.Location = GeometryFactory.CreatePoint(new Coordinate((double)business.Longitude, (double)business.Latitude));
        business.CreatedAt = DateTime.UtcNow;
        business.UpdatedAt = DateTime.UtcNow;

        context.Businesses.Add(business);
        await context.SaveChangesAsync();

        return business;
    }

    public async Task<Business> UpdateAsync(Business business)
    {
        // Update PostGIS point if coordinates changed
        business.Location = GeometryFactory.CreatePoint(new Coordinate((double)business.Longitude, (double)business.Latitude));
        business.UpdatedAt = DateTime.UtcNow;

        context.Businesses.Update(business);
        await context.SaveChangesAsync();

        return business;
    }

    public async Task<IEnumerable<Business>> SearchAsync(string query)
    {
        return await context.Businesses
            .Where(b => EF.Functions.ILike(b.Name, $"%{query}%") || EF.Functions.ILike(b.Address, $"%{query}%"))
            .Include(b => b.TippingVotes)
            .Take(50)
            .ToListAsync();
    }
}
