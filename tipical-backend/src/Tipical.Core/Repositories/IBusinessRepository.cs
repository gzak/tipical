using NetTopologySuite.Geometries;
using Tipical.Core.Models;

namespace Tipical.Core.Repositories;

public interface IBusinessRepository
{
    Task<Business?> GetByGooglePlaceIdAsync(string googlePlaceId);
    Task<Dictionary<string, Business>> GetByGooglePlaceIdsAsync(IEnumerable<string> googlePlaceIds);
    Task<Business> GetOrCreateAsync(string googlePlaceId, string name, Point location);
    Task<List<Business>> SearchNearbyAsync(double latitude, double longitude, int radiusMeters, int limit);
}
